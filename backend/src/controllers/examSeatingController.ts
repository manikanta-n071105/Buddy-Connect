import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query, executeTransaction } from '../config/db';
import { logger } from '../utils/logger';

// ============================================================================
// JNTUA ALPHANUMERIC ROLL NUMBER GENERATOR & PARSER
// Character skipping rule: Skips 'I' and 'O' to avoid confusion with 1 and 0.
// ============================================================================
const JNTU_CHARS = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','U','V','W','X','Y','Z'];

export function parseRollNumber(roll: string) {
  if (!roll) return { prefix: '', value: 0 };
  roll = roll.trim().toUpperCase();
  if (roll.length < 2) return { prefix: roll, value: 0 };
  const suffix = roll.substring(roll.length - 2);
  const prefix = roll.substring(0, roll.length - 2);

  const t = suffix[0];
  const u = suffix[1];

  const units = parseInt(u);
  if (isNaN(units)) {
    const val = parseInt(suffix, 36);
    return { prefix, value: isNaN(val) ? 0 : val };
  }

  let tens = JNTU_CHARS.indexOf(t);
  if (tens === -1) {
    tens = t.charCodeAt(0) - 55;
  }

  return { prefix, value: tens * 10 + units };
}

export function numToJntuSuffix(value: number) {
  const units = value % 10;
  const tensIdx = Math.floor(value / 10);
  const t = JNTU_CHARS[tensIdx] || 'Z';
  return `${t}${units}`;
}

export function generateStudentRange(startReg: string, endReg: string): string[] {
  if (!startReg || !endReg) return [];
  const startObj = parseRollNumber(startReg);
  const endObj = parseRollNumber(endReg);

  if (startObj.prefix !== endObj.prefix) {
    return [startReg.trim().toUpperCase(), endReg.trim().toUpperCase()];
  }

  const list: string[] = [];
  for (let v = startObj.value; v <= endObj.value; v++) {
    list.push(`${startObj.prefix}${numToJntuSuffix(v)}`);
  }
  return list;
}

// Helper to check if user is Controller of Examinations or Admin
const isControllerOrAdmin = (req: AuthenticatedRequest) => {
  const userRole = (req.user?.role || '').toUpperCase();
  const specialRole = (req.user?.specialRole || req.user?.special_role || '').toUpperCase();
  return (
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ADMIN' ||
    specialRole.includes('CONTROLLER') ||
    specialRole.includes('EXAM')
  );
};

/**
 * GET /api/exam-seating/exams
 * Fetch list of all exams
 */
export const getExams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isExec = isControllerOrAdmin(req);
    let sql = `SELECT * FROM exams WHERE 1=1`;
    if (!isExec) {
      sql += ` AND published = true`;
    }
    sql += ` ORDER BY date DESC, created_at DESC`;

    const result = await query(sql);
    return res.json({ success: true, data: result.rows });
  } catch (error: any) {
    logger.error('Error fetching exams:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
};

/**
 * POST /api/exam-seating/exams
 * Create new exam and run Automatic Seating Allocation Engine
 */
export const createExamWithAllocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isControllerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only Controller of Examinations or Admins can schedule exams & run seating allocation.'
      });
    }

    const {
      name,
      exam_code,
      date,
      time,
      session,
      academic_year,
      year_semester,
      batches, // Array of { branch, year_batch, start_reg, end_reg, excluded_ids }
      rooms   // Array of { hall_name, rows, cols, fill_strategy, prevent_adjacency, aisle_interval, disabled_seats }
    } = req.body;

    if (!name || !date || !time || !batches || !batches.length || !rooms || !rooms.length) {
      return res.status(400).json({
        success: false,
        message: 'Exam name, date, time, student batches, and exam hall configurations are required.'
      });
    }

    // 1. Expand Student Queues from JNTUA Ranges
    const batchQueues: { branch: string; year_batch: string; students: { roll_number: string; student_id?: string; student_name?: string }[] }[] = [];
    let grandTotalStudents = 0;

    for (const b of batches) {
      const excludedSet = new Set((b.excluded_ids || []).map((x: string) => x.trim().toUpperCase()));
      const rawRolls = generateStudentRange(b.start_reg, b.end_reg);
      const filteredRolls = rawRolls.filter(r => !excludedSet.has(r));

      // Attempt to map roll numbers to registered user records in DB for rich name/id lookup
      const userMatchRes = await query(
        `SELECT id, name, username FROM users WHERE UPPER(username) = ANY($1::text[]) OR UPPER(email) LIKE ANY($2::text[])`,
        [filteredRolls, filteredRolls.map(r => `${r.toLowerCase()}@%`)]
      );

      const userMap = new Map<string, { id: string; name: string }>();
      userMatchRes.rows.forEach(u => {
        userMap.set(u.username.toUpperCase(), { id: u.id, name: u.name });
      });

      const studentList = filteredRolls.map(roll => {
        const matchedUser = userMap.get(roll);
        return {
          roll_number: roll,
          student_id: matchedUser?.id,
          student_name: matchedUser?.name || `Student (${roll})`
        };
      });

      batchQueues.push({
        branch: b.branch || 'GENERAL',
        year_batch: b.year_batch || b.year || 'III Year',
        students: studentList
      });

      grandTotalStudents += studentList.length;
    }

    // 2. Perform Automatic Seating Allocation Engine Execution
    const allocationResults: {
      hall_name: string;
      capacity: number;
      rows_count: number;
      cols_count: number;
      fill_strategy: string;
      prevent_adjacency: boolean;
      aisle_interval: number;
      disabled_seats: string[];
      seatings: {
        seat_number: string;
        grid_row: number;
        grid_col: number;
        roll_number: string;
        student_name: string;
        student_id?: string;
        branch: string;
        year_batch: string;
      }[];
    }[] = [];

    // Flatten/interleave student queues across branches to alternate seats for anti-cheating
    let totalAssigned = 0;
    const branchesList = batchQueues.map(b => b.branch);

    for (const roomConfig of rooms) {
      const rows = parseInt(roomConfig.rows) || 8;
      const cols = parseInt(roomConfig.cols) || 6;
      const fillStrategy = roomConfig.fill_strategy || 'col';
      const preventAdjacency = roomConfig.prevent_adjacency !== false;
      const aisleInterval = parseInt(roomConfig.aisle_interval) || 2;
      const disabledSeats = new Set<string>(roomConfig.disabled_seats || []);

      const roomAllocations: any[] = [];
      const gridAllocatedBranches: { [key: string]: string } = {};

      // Determine fill sequence (Column-major or Row-major)
      const seatPositions: { r: number; c: number }[] = [];
      if (fillStrategy === 'col') {
        for (let c = 1; c <= cols; c++) {
          for (let r = 1; r <= rows; r++) {
            seatPositions.push({ r, c });
          }
        }
      } else {
        for (let r = 1; r <= rows; r++) {
          for (let c = 1; c <= cols; c++) {
            seatPositions.push({ r, c });
          }
        }
      }

      for (const pos of seatPositions) {
        const seatKey = `${pos.r}-${pos.c}`;
        if (disabledSeats.has(seatKey)) continue;

        // Find next student to assign
        let selectedStudent: any = null;
        let selectedBatchIdx = -1;

        // Check left neighbor for adjacency prevention
        const leftKey = `${pos.r}-${pos.c - 1}`;
        const leftBranch = gridAllocatedBranches[leftKey];
        const isAisleGap = aisleInterval > 0 && ((pos.c - 1) % aisleInterval === 0);

        for (let idx = 0; idx < batchQueues.length; idx++) {
          const queue = batchQueues[idx];
          if (queue.students.length === 0) continue;

          if (preventAdjacency && leftBranch && !isAisleGap && queue.branch === leftBranch) {
            // Conflict! Left neighbor is same branch across non-aisle bench. Try alternative batch if available.
            continue;
          }

          selectedBatchIdx = idx;
          selectedStudent = queue.students.shift();
          break;
        }

        // If all candidate queues were skipped due to strict adjacency, grab from first non-empty queue
        if (!selectedStudent) {
          for (let idx = 0; idx < batchQueues.length; idx++) {
            if (batchQueues[idx].students.length > 0) {
              selectedBatchIdx = idx;
              selectedStudent = batchQueues[idx].students.shift();
              break;
            }
          }
        }

        if (!selectedStudent) break; // All students allocated!

        const seatNumber = `R${pos.r}-C${pos.c}`;
        const batchInfo = batchQueues[selectedBatchIdx];

        gridAllocatedBranches[seatKey] = batchInfo.branch;
        roomAllocations.push({
          seat_number: seatNumber,
          grid_row: pos.r,
          grid_col: pos.c,
          roll_number: selectedStudent.roll_number,
          student_name: selectedStudent.student_name,
          student_id: selectedStudent.student_id,
          branch: batchInfo.branch,
          year_batch: batchInfo.year_batch
        });

        totalAssigned++;
      }

      allocationResults.push({
        hall_name: roomConfig.hall_name || `Exam Hall ${allocationResults.length + 1}`,
        capacity: rows * cols - disabledSeats.size,
        rows_count: rows,
        cols_count: cols,
        fill_strategy: fillStrategy,
        prevent_adjacency: preventAdjacency,
        aisle_interval: aisleInterval,
        disabled_seats: Array.from(disabledSeats),
        seatings: roomAllocations
      });

      if (batchQueues.every(b => b.students.length === 0)) break;
    }

    // 3. Persist Exam, Halls & Seating Allocations to Database
    const newExam = await executeTransaction(async (client) => {
      const examRes = await client.query(
        `INSERT INTO exams (
          name, exam_code, date, time, session, academic_year, year_semester, branches, created_by_id, status, published, total_students, total_halls
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ALLOCATED', false, $10, $11)
        RETURNING *`,
        [
          name,
          exam_code || `EXAM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          date,
          time,
          session || 'FN',
          academic_year || '2026',
          year_semester || 'III-I',
          JSON.stringify(branchesList),
          req.user!.id,
          totalAssigned,
          allocationResults.length
        ]
      );

      const examRecord = examRes.rows[0];

      for (const hall of allocationResults) {
        const hallRes = await client.query(
          `INSERT INTO exam_halls (
            exam_id, hall_name, capacity, rows_count, cols_count, fill_strategy, prevent_adjacency, aisle_interval, disabled_seats_json
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            examRecord.id,
            hall.hall_name,
            hall.capacity,
            hall.rows_count,
            hall.cols_count,
            hall.fill_strategy,
            hall.prevent_adjacency,
            hall.aisle_interval,
            JSON.stringify(hall.disabled_seats)
          ]
        );

        const hallRecord = hallRes.rows[0];

        for (const s of hall.seatings) {
          await client.query(
            `INSERT INTO exam_seatings (
              exam_id, hall_id, hall_name, seat_number, grid_row, grid_col, student_id, roll_number, student_name, branch, year_batch, attendance_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING')`,
            [
              examRecord.id,
              hallRecord.id,
              hall.hall_name,
              s.seat_number,
              s.grid_row,
              s.grid_col,
              s.student_id || null,
              s.roll_number,
              s.student_name,
              s.branch,
              s.year_batch
            ]
          );
        }
      }

      return examRecord;
    });

    return res.status(201).json({
      success: true,
      message: `Exam '${name}' created and ${totalAssigned} student seats allocated successfully across ${allocationResults.length} exam halls.`,
      data: newExam
    });

  } catch (error: any) {
    logger.error('Error creating exam seating allocation:', error);
    return res.status(500).json({ success: false, message: 'Failed to create exam seating allocation', error: error.message });
  }
};

/**
 * GET /api/exam-seating/exams/:id
 * Get single exam details with halls, full seating grid, invigilators, & malpractices
 */
export const getExamDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const examRes = await query(`SELECT * FROM exams WHERE id = $1`, [id]);
    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam record not found' });
    }

    const exam = examRes.rows[0];

    const [hallsRes, seatingsRes, invigRes, malpRes] = await Promise.all([
      query(`SELECT * FROM exam_halls WHERE exam_id = $1 ORDER BY hall_name ASC`, [id]),
      query(`SELECT * FROM exam_seatings WHERE exam_id = $1 ORDER BY hall_name ASC, grid_row ASC, grid_col ASC`, [id]),
      query(`SELECT * FROM exam_invigilators WHERE exam_id = $1 ORDER BY hall_name ASC`, [id]),
      query(`SELECT * FROM exam_malpractices WHERE exam_id = $1 ORDER BY logged_at DESC`, [id])
    ]);

    return res.json({
      success: true,
      data: {
        ...exam,
        halls: hallsRes.rows,
        seatings: seatingsRes.rows,
        invigilators: invigRes.rows,
        malpractices: malpRes.rows
      }
    });
  } catch (error: any) {
    logger.error('Error fetching exam details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch exam details', error: error.message });
  }
};

/**
 * POST /api/exam-seating/exams/:id/publish
 * Toggle publish status (makes seating plan visible on student & faculty portals)
 */
export const togglePublishExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isControllerOrAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Access denied: Controller of Examinations permission required.' });
    }

    const { id } = req.params;
    const { published } = req.body;

    const updateRes = await query(
      `UPDATE exams SET published = $1, status = CASE WHEN $1 = true THEN 'PUBLISHED' ELSE 'ALLOCATED' END, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [Boolean(published), id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam record not found' });
    }

    const updatedExam = updateRes.rows[0];

    if (updatedExam.published) {
      // Broadcast notification to all active students
      await query(
        `INSERT INTO notifications (recipient_id, title, message, type)
         SELECT id, 'Exam Seating Arrangement Published', $1, 'EXAM'
         FROM users WHERE role IN ('JUNIOR', 'SENIOR')`,
        [`Seating arrangement for '${updatedExam.name}' scheduled on ${new Date(updatedExam.date).toLocaleDateString()} has been published. Check your seat number!`]
      );
    }

    return res.json({
      success: true,
      message: `Exam seating status updated to ${updatedExam.published ? 'PUBLISHED' : 'UNPUBLISHED'}.`,
      data: updatedExam
    });
  } catch (error: any) {
    logger.error('Error publishing exam:', error);
    return res.status(500).json({ success: false, message: 'Failed to update publish status', error: error.message });
  }
};

/**
 * DELETE /api/exam-seating/exams/:id
 * Delete exam and associated seating records
 */
export const deleteExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isControllerOrAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Access denied: Controller of Examinations permission required.' });
    }

    const { id } = req.params;
    const deleteRes = await query(`DELETE FROM exams WHERE id = $1 RETURNING id`, [id]);

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    return res.json({ success: true, message: 'Exam seating plan deleted successfully.' });
  } catch (error: any) {
    logger.error('Error deleting exam:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete exam', error: error.message });
  }
};

/**
 * GET /api/exam-seating/my-seat
 * Student Seating Lookup by roll number or student ID
 */
export const getMySeat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const username = (req.user?.username || '').toUpperCase();

    const seatingRes = await query(
      `SELECT s.*, e.name as exam_name, e.date as exam_date, e.time as exam_time, e.session as exam_session, e.academic_year, e.year_semester
       FROM exam_seatings s
       JOIN exams e ON s.exam_id = e.id
       WHERE (s.student_id = $1 OR UPPER(s.roll_number) = $2)
         AND e.published = true
       ORDER BY e.date ASC`,
      [userId, username]
    );

    return res.json({
      success: true,
      data: seatingRes.rows
    });
  } catch (error: any) {
    logger.error('Error fetching student seating lookup:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student seating details', error: error.message });
  }
};

/**
 * GET /api/exam-seating/invigilation
 * Fetch invigilation duty assignments for logged-in Faculty
 */
export const getInvigilationDuties = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const isExec = isControllerOrAdmin(req);

    let sql = `
      SELECT i.*, e.name as exam_name, e.date as exam_date, e.time as exam_time, e.session as exam_session, h.capacity, h.rows_count, h.cols_count
      FROM exam_invigilators i
      JOIN exams e ON i.exam_id = e.id
      JOIN exam_halls h ON i.hall_id = h.id
    `;

    const params: any[] = [];
    if (!isExec) {
      params.push(userId);
      sql += ` WHERE i.faculty_id = $1`;
    }

    sql += ` ORDER BY e.date DESC`;

    const result = await query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (error: any) {
    logger.error('Error fetching invigilation duties:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invigilation duties', error: error.message });
  }
};

/**
 * POST /api/exam-seating/invigilation/attendance
 * Invigilator marks attendance (PRESENT / ABSENT / MALPRACTICE) for student seats
 */
export const markHallAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId, hallId, attendanceData } = req.body; // attendanceData: Array of { seatingId, attendance_status, remarks }

    if (!examId || !hallId || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ success: false, message: 'examId, hallId, and attendanceData array are required.' });
    }

    for (const item of attendanceData) {
      if (item.seatingId && item.attendance_status) {
        await query(
          `UPDATE exam_seatings SET attendance_status = $1, remarks = $2 WHERE id = $3 AND exam_id = $4`,
          [item.attendance_status, item.remarks || '', item.seatingId, examId]
        );
      }
    }

    return res.json({ success: true, message: `Attendance updated for ${attendanceData.length} students.` });
  } catch (error: any) {
    logger.error('Error marking hall attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to update hall attendance', error: error.message });
  }
};

/**
 * POST /api/exam-seating/invigilators/assign
 * Controller of Examinations assigns Faculty to an Exam Hall
 */
export const assignInvigilator = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isControllerOrAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Access denied: Controller of Examinations permission required.' });
    }

    const { examId, hallId, hallName, facultyId } = req.body;

    if (!examId || !hallId || !facultyId) {
      return res.status(400).json({ success: false, message: 'examId, hallId, and facultyId are required.' });
    }

    const facRes = await query(`SELECT id, name, department FROM users WHERE id = $1`, [facultyId]);
    if (facRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty user not found' });
    }

    const fac = facRes.rows[0];

    const assignRes = await query(
      `INSERT INTO exam_invigilators (exam_id, hall_id, hall_name, faculty_id, faculty_name, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (exam_id, hall_id, faculty_id) DO UPDATE SET assigned_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [examId, hallId, hallName || 'Exam Hall', fac.id, fac.name, fac.department || 'General']
    );

    // Notify Faculty
    await query(
      `INSERT INTO notifications (recipient_id, title, message, type)
       VALUES ($1, 'New Exam Invigilation Duty Assigned', $2, 'EXAM')`,
      [fac.id, `You have been assigned as invigilator for hall ${hallName} for upcoming examination.`]
    );

    return res.json({ success: true, message: `Invigilator ${fac.name} assigned to ${hallName} successfully.`, data: assignRes.rows[0] });
  } catch (error: any) {
    logger.error('Error assigning invigilator:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign invigilator', error: error.message });
  }
};

/**
 * POST /api/exam-seating/malpractice
 * Log Malpractice incident
 */
export const logMalpracticeIncident = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId, seatingId, rollNumber, studentName, hallName, offenseDetails, evidenceNotes, actionTaken } = req.body;

    if (!examId || !rollNumber || !offenseDetails) {
      return res.status(400).json({ success: false, message: 'examId, rollNumber, and offenseDetails are required.' });
    }

    const logRes = await query(
      `INSERT INTO exam_malpractices (
        exam_id, seating_id, roll_number, student_name, hall_name, invigilator_name, offense_details, evidence_notes, action_taken
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        examId,
        seatingId || null,
        rollNumber,
        studentName || 'Student',
        hallName || 'Exam Hall',
        req.user?.name || 'Invigilator',
        offenseDetails,
        evidenceNotes || '',
        actionTaken || 'BOOKED_UNDER_MALPRACTICE'
      ]
    );

    if (seatingId) {
      await query(`UPDATE exam_seatings SET attendance_status = 'MALPRACTICE', remarks = $1 WHERE id = $2`, [offenseDetails, seatingId]);
    }

    return res.status(201).json({ success: true, message: 'Malpractice case logged successfully.', data: logRes.rows[0] });
  } catch (error: any) {
    logger.error('Error logging malpractice:', error);
    return res.status(500).json({ success: false, message: 'Failed to log malpractice incident', error: error.message });
  }
};

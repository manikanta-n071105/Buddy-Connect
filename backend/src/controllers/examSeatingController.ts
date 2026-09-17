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

export function isStudentInBatchRange(regNo: string, startReg: string, endReg: string): boolean {
  if (!regNo || !startReg || !endReg) return false;
  const regObj = parseRollNumber(regNo);
  const startObj = parseRollNumber(startReg);
  const endObj = parseRollNumber(endReg);

  if (regObj.prefix !== startObj.prefix || regObj.prefix !== endObj.prefix) {
    return false;
  }

  return regObj.value >= startObj.value && regObj.value <= endObj.value;
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
    const exams = result.rows;

    for (const exam of exams) {
      const hallsRes = await query(
        `SELECT id, hall_name, capacity, rows_count, cols_count, fill_strategy
         FROM exam_halls
         WHERE exam_id = $1`,
        [exam.id]
      );
      if (hallsRes.rows.length > 0) {
        exam.halls = hallsRes.rows;
      } else if (Array.isArray(exam.rooms_json) && exam.rooms_json.length > 0) {
        exam.halls = exam.rooms_json.map((r: any, idx: number) => ({
          id: r.id || `hall-${idx}`,
          hall_name: r.hall_name || `Hall ${idx + 1}`,
          capacity: (parseInt(r.rows) || 8) * (parseInt(r.cols) || 6)
        }));
      } else {
        exam.halls = [];
      }
    }

    return res.json({ success: true, data: exams });
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
    const batchRollsMap: { branch: string; year_batch: string; filteredRolls: string[] }[] = [];
    const allFilteredRolls: string[] = [];

    for (const b of batches) {
      let excludedSet: Set<string>;
      if (Array.isArray(b.excluded_ids)) {
        excludedSet = new Set(b.excluded_ids.map((x: any) => String(x).trim().toUpperCase()));
      } else {
        excludedSet = new Set(
          (b.excluded_ids || '')
            .split(',')
            .map((x: string) => x.trim().toUpperCase())
            .filter(Boolean)
        );
      }

      const rawRolls = generateStudentRange(b.start_reg, b.end_reg);
      const filteredRolls = rawRolls.filter(r => !excludedSet.has(r));

      batchRollsMap.push({
        branch: b.branch || 'GENERAL',
        year_batch: b.year_batch || b.year || 'III Year',
        filteredRolls
      });

      allFilteredRolls.push(...filteredRolls);
    }

    // Single fast B-tree indexed lookup for user details
    const userMap = new Map<string, { id: string; name: string }>();
    if (allFilteredRolls.length > 0) {
      const uniqueRolls = Array.from(new Set(allFilteredRolls.map(r => r.toUpperCase())));
      const userMatchRes = await query(
        `SELECT id, name, username, email FROM users WHERE UPPER(username) = ANY($1::text[]) OR UPPER(SPLIT_PART(email, '@', 1)) = ANY($1::text[])`,
        [uniqueRolls]
      );
      userMatchRes.rows.forEach(u => {
        if (u.username) userMap.set(u.username.toUpperCase(), { id: u.id, name: u.name });
        if (u.email) {
          const emailPrefix = u.email.split('@')[0].toUpperCase();
          if (!userMap.has(emailPrefix)) userMap.set(emailPrefix, { id: u.id, name: u.name });
        }
      });
    }

    const batchQueues: { branch: string; year_batch: string; students: { roll_number: string; student_id?: string; student_name?: string }[] }[] = [];
    let grandTotalStudents = 0;

    for (const item of batchRollsMap) {
      const studentList = item.filteredRolls.map(roll => {
        const matchedUser = userMap.get(roll.toUpperCase());
        return {
          roll_number: roll,
          student_id: matchedUser?.id,
          student_name: matchedUser?.name || `Student (${roll})`
        };
      });

      batchQueues.push({
        branch: item.branch,
        year_batch: item.year_batch,
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

    // Initialize Double-Branch Alternating seating slots
    let activeBatch1: number | null = null;
    let activeBatch2: number | null = null;

    for (let i = 0; i < batchQueues.length; i++) {
      if (batchQueues[i] && batchQueues[i].students.length > 0) {
        activeBatch1 = i;
        break;
      }
    }

    for (let i = 0; i < batchQueues.length; i++) {
      if (i !== activeBatch1 && batchQueues[i] && batchQueues[i].students.length > 0) {
        activeBatch2 = i;
        break;
      }
    }

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

        let selectedStudent: any = null;
        let selectedBatchIdx = -1;

        // Check left and top neighbors for 2D adjacency prevention
        const leftKey = `${pos.r}-${pos.c - 1}`;
        const topKey = `${pos.r - 1}-${pos.c}`;
        const leftBranch = gridAllocatedBranches[leftKey];
        const topBranch = gridAllocatedBranches[topKey];
        const isAisleGap = aisleInterval > 0 && ((pos.c - 1) % aisleInterval === 0);

        const blockedBatches = new Set<number>();
        if (preventAdjacency) {
          batchQueues.forEach((q, idx) => {
            if (leftBranch && !isAisleGap && q.branch === leftBranch) {
              blockedBatches.add(idx);
            }
            if (topBranch && q.branch === topBranch) {
              blockedBatches.add(idx);
            }
          });
        }

        // Ensure activeBatch1 has students, or find next
        if (activeBatch1 !== null && batchQueues[activeBatch1].students.length === 0) {
          let nextBatch: number | null = null;
          for (let i = 0; i < batchQueues.length; i++) {
            if (i !== activeBatch2 && batchQueues[i] && batchQueues[i].students.length > 0) {
              nextBatch = i;
              break;
            }
          }
          activeBatch1 = nextBatch;
        }

        // Ensure activeBatch2 has students, or find next
        if (activeBatch2 !== null && batchQueues[activeBatch2].students.length === 0) {
          let nextBatch: number | null = null;
          for (let i = 0; i < batchQueues.length; i++) {
            if (i !== activeBatch1 && batchQueues[i] && batchQueues[i].students.length > 0) {
              nextBatch = i;
              break;
            }
          }
          activeBatch2 = nextBatch;
        }

        let chosenBatch: number | null = null;
        const preferredSlot = (pos.r + pos.c) % 2 === 0 ? 1 : 2;

        if (preferredSlot === 1) {
          if (activeBatch1 !== null && batchQueues[activeBatch1].students.length > 0 && !blockedBatches.has(activeBatch1)) {
            chosenBatch = activeBatch1;
          } else if (activeBatch2 !== null && batchQueues[activeBatch2].students.length > 0 && !blockedBatches.has(activeBatch2)) {
            chosenBatch = activeBatch2;
          }
        } else {
          if (activeBatch2 !== null && batchQueues[activeBatch2].students.length > 0 && !blockedBatches.has(activeBatch2)) {
            chosenBatch = activeBatch2;
          } else if (activeBatch1 !== null && batchQueues[activeBatch1].students.length > 0 && !blockedBatches.has(activeBatch1)) {
            chosenBatch = activeBatch1;
          }
        }

        if (chosenBatch !== null) {
          selectedBatchIdx = chosenBatch;
          selectedStudent = batchQueues[chosenBatch].students.shift();
          gridAllocatedBranches[seatKey] = batchQueues[chosenBatch].branch;
        }

        if (!selectedStudent) continue; // Seat stays EMPTY if no batch can be placed without violating adjacency

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
          name, exam_code, date, time, session, academic_year, year_semester, branches, batches_json, rooms_json, created_by_id, status, published, total_students, total_halls
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ALLOCATED', false, $12, $13)
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
          JSON.stringify(batches || []),
          JSON.stringify(rooms || []),
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

        if (hall.seatings.length > 0) {
          const values: any[] = [];
          const valueRows: string[] = [];
          let paramIdx = 1;

          for (const s of hall.seatings) {
            valueRows.push(
              `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, 'PENDING')`
            );
            values.push(
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
            );
          }

          await client.query(
            `INSERT INTO exam_seatings (
              exam_id, hall_id, hall_name, seat_number, grid_row, grid_col, student_id, roll_number, student_name, branch, year_batch, attendance_status
            ) VALUES ${valueRows.join(', ')}`,
            values
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

export function reconstructBatchesFromSeatings(seatings: any[]) {
  if (!seatings || !seatings.length) return [];

  const branchMap = new Map<string, { branch: string; year_batch: string; rolls: string[] }>();

  seatings.forEach(s => {
    const branchKey = (s.branch || 'GENERAL').trim().toUpperCase();
    if (!branchMap.has(branchKey)) {
      branchMap.set(branchKey, {
        branch: branchKey,
        year_batch: s.year_batch || 'III Year',
        rolls: []
      });
    }
    if (s.roll_number) {
      branchMap.get(branchKey)!.rolls.push(s.roll_number.trim().toUpperCase());
    }
  });

  const reconstructedBatches: any[] = [];

  branchMap.forEach((data, branchKey) => {
    if (data.rolls.length === 0) return;

    data.rolls.sort((a, b) => {
      const pA = parseRollNumber(a);
      const pB = parseRollNumber(b);
      if (pA.prefix !== pB.prefix) return pA.prefix.localeCompare(pB.prefix);
      return pA.value - pB.value;
    });

    const startReg = data.rolls[0];
    const endReg = data.rolls[data.rolls.length - 1];
    const expectedRange = generateStudentRange(startReg, endReg);
    const rollsSet = new Set(data.rolls);
    const excludedList = expectedRange.filter(r => !rollsSet.has(r));

    reconstructedBatches.push({
      branch: branchKey,
      subject: '',
      year_batch: data.year_batch,
      start_reg: startReg,
      end_reg: endReg,
      excluded_ids: excludedList.join(', ')
    });
  });

  return reconstructedBatches;
}

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

    let activeBatches = exam.batches_json;
    if (!Array.isArray(activeBatches) || activeBatches.length === 0) {
      activeBatches = reconstructBatchesFromSeatings(seatingsRes.rows);
    }

    return res.json({
      success: true,
      data: {
        ...exam,
        batches: activeBatches,
        rooms: exam.rooms_json || [],
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
    const userId = req.user?.id || '';
    const username = (req.user?.username || '').toUpperCase().trim();
    const userRegNo = ((req.user as any)?.register_number || (req.user as any)?.reg_no || '').toUpperCase().trim();
    const rollNoQuery = (req.query.roll || req.query.roll_number || req.query.rollNumber || '').toString().toUpperCase().trim();

    const sql = `
      SELECT s.*, 
             e.name as exam_name, e.date as exam_date, e.time as exam_time, e.session as exam_session, e.academic_year, e.year_semester,
             h.id as hall_id, h.hall_name, h.capacity as hall_capacity, h.rows_count as hall_rows, h.cols_count as hall_cols, h.disabled_seats_json
      FROM exam_seatings s
      JOIN exams e ON s.exam_id = e.id
      LEFT JOIN exam_halls h ON (s.hall_id IS NOT NULL AND s.hall_id = h.id) OR (s.hall_name IS NOT NULL AND LOWER(s.hall_name) = LOWER(h.hall_name))
      WHERE e.published = true
        AND (
          ($1 != '' AND UPPER(s.roll_number) = $1)
          OR ($2 != '' AND UPPER(s.roll_number) = $2)
          OR ($3 != '' AND s.student_id = $3)
          OR ($4 != '' AND UPPER(s.roll_number) = $4)
        )
      ORDER BY e.date ASC`;

    const seatingRes = await query(sql, [rollNoQuery, username, userId, userRegNo]);

    // Attach full seating grid of each matched hall for visual seat location preview
    const seatsWithHallGrid = await Promise.all(
      seatingRes.rows.map(async (seat: any) => {
        let hallSeatings: any[] = [];
        if (seat.exam_id && (seat.hall_id || seat.hall_name)) {
          const gridRes = await query(
            `SELECT id, roll_number, student_name, branch, grid_row, grid_col, seat_number, hall_name
             FROM exam_seatings
             WHERE exam_id = $1 AND ((hall_id IS NOT NULL AND hall_id = $2) OR (LOWER(hall_name) = LOWER($3)))`,
            [seat.exam_id, seat.hall_id, seat.hall_name]
          );
          hallSeatings = gridRes.rows;
        }
        return {
          ...seat,
          hall_seatings: hallSeatings
        };
      })
    );

    return res.json({
      success: true,
      data: seatsWithHallGrid
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

    if (!examId || !facultyId) {
      return res.status(400).json({ success: false, message: 'examId and facultyId are required.' });
    }

    const facRes = await query(`SELECT id, name, department FROM users WHERE id = $1`, [facultyId]);
    if (facRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty user not found' });
    }

    const fac = facRes.rows[0];

    if (hallId) {
      await query(`DELETE FROM exam_invigilators WHERE exam_id = $1 AND hall_id = $2`, [examId, hallId]);
    } else if (hallName) {
      await query(`DELETE FROM exam_invigilators WHERE exam_id = $1 AND hall_name = $2`, [examId, hallName]);
    }

    const assignRes = await query(
      `INSERT INTO exam_invigilators (exam_id, hall_id, hall_name, faculty_id, faculty_name, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [examId, hallId || null, hallName || 'Exam Hall', fac.id, fac.name, fac.department || 'General']
    );

    // Notify Faculty
    try {
      await query(
        `INSERT INTO notifications (recipient_id, title, message, type)
         VALUES ($1, 'New Exam Invigilation Duty Assigned', $2, 'EXAM')`,
        [fac.id, `You have been assigned as invigilator for hall ${hallName || 'Exam Hall'} for upcoming examination.`]
      );
    } catch (nErr) {
      // Ignore notification failures
    }

    return res.json({ success: true, message: `Invigilator ${fac.name} assigned to ${hallName || 'hall'} successfully.`, data: assignRes.rows[0] });
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

/**
 * GET /api/exam-seating/faculty-list
 * Fetch list of all faculty members for invigilation duty selection
 */
export const getFacultyList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let result = await query(
      `SELECT DISTINCT
         u.id,
         u.name,
         u.email,
         COALESCE(f.department, m.department, 'General') as department,
         u.role,
         u.special_role,
         f.faculty_code
       FROM users u
       LEFT JOIN faculty f ON f.user_id = u.id
       LEFT JOIN mentors m ON m.user_id = u.id
       WHERE UPPER(u.role) IN ('FACULTY', 'MENTOR', 'ADMIN', 'SUPER_ADMIN', 'WARDEN')
          OR u.is_faculty = true
          OR f.id IS NOT NULL
          OR m.id IS NOT NULL
          OR (u.special_role IS NOT NULL AND u.special_role != '')
       ORDER BY u.name ASC`
    );

    if (result.rows.length === 0) {
      result = await query(
        `SELECT u.id, u.name, u.email, u.role, u.special_role, COALESCE(f.department, m.department, 'General') as department
         FROM users u
         LEFT JOIN faculty f ON f.user_id = u.id
         LEFT JOIN mentors m ON m.user_id = u.id
         WHERE UPPER(u.role) NOT IN ('JUNIOR', 'SENIOR', 'STUDENT')
         ORDER BY u.name ASC`
      );
    }

    if (result.rows.length === 0) {
      result = await query(
        `SELECT id, name, email, role, special_role, 'General' as department
         FROM users
         ORDER BY name ASC`
      );
    }

    return res.json({ success: true, data: result.rows });
  } catch (error: any) {
    logger.error('Error fetching faculty list:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch faculty list', error: error.message });
  }
};

/**
 * POST /api/exam-seating/invigilators/auto-assign
 * Automatically assign available faculty members to exam halls
 */
export const autoAssignInvigilators = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isControllerOrAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Access denied: Controller of Examinations permission required.' });
    }

    const { examId } = req.body;

    let examsSql = `SELECT id, name FROM exams WHERE 1=1`;
    const examsParams: any[] = [];
    if (examId) {
      examsSql += ` AND id = $1`;
      examsParams.push(examId);
    } else {
      examsSql += ` AND published = true`;
    }
    const examsRes = await query(examsSql, examsParams);

    if (examsRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No published or active exams found for invigilator allocation.' });
    }

    let facultyRes = await query(
      `SELECT DISTINCT
         u.id,
         u.name,
         u.email,
         COALESCE(f.department, m.department, 'General') as department
       FROM users u
       LEFT JOIN faculty f ON f.user_id = u.id
       LEFT JOIN mentors m ON m.user_id = u.id
       WHERE UPPER(u.role) IN ('FACULTY', 'MENTOR', 'ADMIN', 'SUPER_ADMIN', 'WARDEN')
          OR u.is_faculty = true
          OR f.id IS NOT NULL
          OR m.id IS NOT NULL
          OR (u.special_role IS NOT NULL AND u.special_role != '')
       ORDER BY u.name ASC`
    );

    if (facultyRes.rows.length === 0) {
      facultyRes = await query(
        `SELECT u.id, u.name, u.email, COALESCE(f.department, m.department, 'General') as department
         FROM users u
         LEFT JOIN faculty f ON f.user_id = u.id
         LEFT JOIN mentors m ON m.user_id = u.id
         WHERE UPPER(u.role) NOT IN ('JUNIOR', 'SENIOR', 'STUDENT')
         ORDER BY u.name ASC`
      );
    }

    if (facultyRes.rows.length === 0) {
      facultyRes = await query(`SELECT id, name, email, 'General' as department FROM users ORDER BY name ASC`);
    }

    if (facultyRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No faculty members found in the system.' });
    }

    const facultyList = facultyRes.rows;
    let facultyIdx = 0;
    let totalAssignments = 0;

    for (const exam of examsRes.rows) {
      let hallsRes = await query(
        `SELECT id as hall_id, hall_name
         FROM exam_halls
         WHERE exam_id = $1`,
        [exam.id]
      );

      let halls = hallsRes.rows;
      if (halls.length === 0) {
        const seatHallsRes = await query(
          `SELECT DISTINCT hall_id, hall_name
           FROM exam_seatings
           WHERE exam_id = $1 AND hall_id IS NOT NULL`,
          [exam.id]
        );
        halls = seatHallsRes.rows;
      }

      for (const hall of halls) {
        const fac = facultyList[facultyIdx % facultyList.length];
        facultyIdx++;

        if (hall.hall_id) {
          await query(`DELETE FROM exam_invigilators WHERE exam_id = $1 AND hall_id = $2`, [exam.id, hall.hall_id]);
        } else {
          await query(`DELETE FROM exam_invigilators WHERE exam_id = $1 AND hall_name = $2`, [exam.id, hall.hall_name]);
        }

        await query(
          `INSERT INTO exam_invigilators (exam_id, hall_id, hall_name, faculty_id, faculty_name, department)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [exam.id, hall.hall_id || null, hall.hall_name, fac.id, fac.name, fac.department || 'General']
        );

        try {
          await query(
            `INSERT INTO notifications (recipient_id, title, message, type)
             VALUES ($1, 'New Exam Invigilation Duty Assigned', $2, 'EXAM')`,
            [fac.id, `Automatically assigned invigilation duty for ${exam.name} at hall ${hall.hall_name}.`]
          );
        } catch (nErr) {
          // ignore notification error
        }

        totalAssignments++;
      }
    }

    return res.json({
      success: true,
      message: `Successfully auto-assigned faculty invigilators across ${totalAssignments} hall assignments.`,
      count: totalAssignments
    });
  } catch (error: any) {
    logger.error('Error auto-assigning invigilators:', error);
    return res.status(500).json({ success: false, message: 'Failed to auto-assign invigilators', error: error.message });
  }
};

/**
 * DELETE /api/exam-seating/invigilators/:id
 * Remove/Unassign an invigilator duty
 */
export const removeInvigilator = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isControllerOrAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Access denied: Controller permission required.' });
    }

    const { id } = req.params;
    await query(`DELETE FROM exam_invigilators WHERE id = $1`, [id]);

    return res.json({ success: true, message: 'Invigilation duty assignment removed.' });
  } catch (error: any) {
    logger.error('Error removing invigilator assignment:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove invigilator assignment', error: error.message });
  }
};

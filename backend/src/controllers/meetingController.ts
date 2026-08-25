import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

// Ensure mentorship_meetings table exists
const ensureMeetingsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS mentorship_meetings (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        title VARCHAR(200) NOT NULL,
        agenda TEXT,
        meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
        location VARCHAR(200) NOT NULL,
        meeting_link TEXT,
        mentor_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mentor_role VARCHAR(30) NOT NULL,
        target_junior_id VARCHAR(36) REFERENCES juniors(id) ON DELETE CASCADE,
        status VARCHAR(30) DEFAULT 'SCHEDULED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Get Meetings (Filter by User Role)
export const getMeetings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureMeetingsTable();
    const user = req.user!;

    if (user.role === 'JUNIOR') {
      // Find Junior's ID
      const jRes = await query(`SELECT id, senior_id, faculty_id FROM juniors WHERE user_id = $1`, [user.id]);
      if (jRes.rowCount === 0) {
        return res.json({ success: true, data: [] });
      }
      const jId = jRes.rows[0].id;
      const sId = jRes.rows[0].senior_id;
      const fId = jRes.rows[0].faculty_id;

      // Find user IDs for Senior, Faculty, and Directors
      const mentorUserIdsRes = await query(
        `SELECT user_id FROM seniors WHERE id = $1
         UNION
         SELECT user_id FROM faculty WHERE id = $2
         UNION
         SELECT user_id FROM directors`,
        [sId || '', fId || '']
      );
      const mentorUserIds = mentorUserIdsRes.rows.map(r => r.user_id);

      const meetingsRes = await query(
        `SELECT m.*, u.name as mentor_name, u.role as mentor_actual_role, ju.name as target_junior_name
         FROM mentorship_meetings m
         JOIN users u ON m.mentor_id = u.id
         LEFT JOIN juniors j ON m.target_junior_id = j.id
         LEFT JOIN users ju ON j.user_id = ju.id
         WHERE (m.target_junior_id = $1 OR (m.target_junior_id IS NULL AND m.mentor_id = ANY($2::text[])))
         ORDER BY m.meeting_date ASC`,
        [jId, mentorUserIds]
      );

      return res.json({ success: true, data: meetingsRes.rows });
    } else {
      // For Senior, Faculty, Director, Admin, SuperAdmin: return created meetings
      const meetingsRes = await query(
        `SELECT m.*, u.name as mentor_name, u.role as mentor_actual_role, ju.name as target_junior_name
         FROM mentorship_meetings m
         JOIN users u ON m.mentor_id = u.id
         LEFT JOIN juniors j ON m.target_junior_id = j.id
         LEFT JOIN users ju ON j.user_id = ju.id
         WHERE m.mentor_id = $1
         ORDER BY m.meeting_date ASC`,
        [user.id]
      );

      return res.json({ success: true, data: meetingsRes.rows });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Schedule New Meeting (Mentors: Senior, Faculty, Director, SuperAdmin, Admin)
export const createMeeting = async (req: AuthenticatedRequest, res: Response) => {
  const { title, agenda, meetingDate, location, meetingLink, targetJuniorId } = req.body;
  const user = req.user!;

  if (!['SENIOR', 'FACULTY', 'DIRECTOR', 'SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Mentors and Directors can schedule meetings',
      code: 'FORBIDDEN'
    });
  }

  if (!title || !meetingDate || !location) {
    return res.status(400).json({
      success: false,
      message: 'Meeting title, date & time, and location are required',
      code: 'INVALID_INPUT'
    });
  }

  try {
    await ensureMeetingsTable();

    let validTargetJuniorId = targetJuniorId || null;

    // Insert meeting
    const mRes = await query(
      `INSERT INTO mentorship_meetings
       (title, agenda, meeting_date, location, meeting_link, mentor_id, mentor_role, target_junior_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        title.trim(),
        agenda ? agenda.trim() : null,
        new Date(meetingDate).toISOString(),
        location.trim(),
        meetingLink ? meetingLink.trim() : null,
        user.id,
        user.role,
        validTargetJuniorId
      ]
    );

    await logAudit(user.id, 'CREATE_MENTORSHIP_MEETING', 'MEETING', mRes.rows[0].id, { title, location, meetingDate }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Mentorship meeting scheduled successfully!',
      data: mRes.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update Meeting Status (SCHEDULED, COMPLETED, CANCELLED)
export const updateMeetingStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value', code: 'INVALID_INPUT' });
  }

  try {
    await ensureMeetingsTable();
    const result = await query(
      `UPDATE mentorship_meetings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND mentor_id = $3 RETURNING *`,
      [status, id, req.user!.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Meeting record not found or unauthorized', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: `Meeting marked as ${status}`, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Delete / Cancel Meeting
export const deleteMeeting = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await ensureMeetingsTable();
    const result = await query(
      `DELETE FROM mentorship_meetings WHERE id = $1 AND (mentor_id = $2 OR $3 = 'SUPER_ADMIN') RETURNING *`,
      [id, req.user!.id, req.user!.role]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Meeting record not found or unauthorized', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: 'Meeting cancelled successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

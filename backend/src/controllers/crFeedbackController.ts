import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

// Submit Class Feedback (CR Only)
export const submitCrFeedback = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  // Verify CR status
  const uRes = await query(`SELECT COALESCE(is_cr, false) as is_cr, role FROM users WHERE id = $1`, [userId]);
  if (uRes.rowCount === 0 || !uRes.rows[0].is_cr) {
    return res.status(403).json({
      success: false,
      message: 'Only Class Representatives (CR) are authorized to submit class feedback.',
      code: 'CR_REQUIRED'
    });
  }

  const { subjectName, facultyName, feedbackCategory, rating, feedbackText } = req.body;

  if (!feedbackCategory || !rating || !feedbackText) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields (Feedback Category, Rating, Comments)',
      code: 'INVALID_INPUT'
    });
  }

  const subName = (subjectName && subjectName.trim()) || 'Class Feedback';
  const facName = (facultyName && facultyName.trim()) || 'General Faculty';

  const ratingVal = parseInt(rating);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be a number between 1 and 5',
      code: 'INVALID_RATING'
    });
  }

  try {
    // Get CR User Department and Year/Batch
    const infoRes = await query(
      `SELECT COALESCE(s.department, j.department, 'GENERAL') as department,
              CASE 
                WHEN u.role = 'JUNIOR' THEN CONCAT(j.year, ' (', j.batch, ')')
                WHEN u.role = 'SENIOR' THEN 'Senior Class'
                ELSE 'General'
              END as year_batch
       FROM users u
       LEFT JOIN seniors s ON u.id = s.user_id
       LEFT JOIN juniors j ON u.id = j.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const dept = infoRes.rows[0]?.department || 'GENERAL';
    const yearBatch = infoRes.rows[0]?.year_batch || 'N/A';

    const insRes = await query(
      `INSERT INTO cr_class_feedbacks 
        (cr_user_id, department, year_batch, subject_name, faculty_name, feedback_category, rating, feedback_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, dept, yearBatch, subName, facName, feedbackCategory.trim(), ratingVal, feedbackText.trim()]
    );

    await logAudit(userId, 'SUBMIT_CR_FEEDBACK', 'CR_FEEDBACK', insRes.rows[0].id, { category: feedbackCategory, ratingVal }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Class feedback submitted successfully to Super Administrator.',
      data: insRes.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Previous Feedbacks Submitted by Logged-In CR
export const getCrMyFeedbacks = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const resFeedbacks = await query(
      `SELECT * FROM cr_class_feedbacks WHERE cr_user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: resFeedbacks.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get All CR Feedbacks across campus (SUPER ADMIN strictly)
export const getAllCrFeedbacks = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Class feedback reports are confidential and accessible strictly to Super Administrators.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  const { department, category, rating } = req.query;

  try {
    let sql = `
      SELECT f.*, u.name as cr_name, u.username as cr_username, u.role as cr_role
      FROM cr_class_feedbacks f
      JOIN users u ON f.cr_user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (department && department !== 'ALL') {
      sql += ` AND f.department = $${params.length + 1}`;
      params.push(department);
    }

    if (category && category !== 'ALL') {
      sql += ` AND f.feedback_category = $${params.length + 1}`;
      params.push(category);
    }

    if (rating && rating !== 'ALL') {
      sql += ` AND f.rating = $${params.length + 1}`;
      params.push(parseInt(rating as string));
    }

    sql += ` ORDER BY f.created_at DESC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

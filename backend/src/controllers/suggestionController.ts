import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const getSuggestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Ensure columns exist
    await query(`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING'`);
    await query(`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS response_note TEXT`);

    const result = await query(
      `SELECT s.id, s.junior_id, s.title, s.description, s.category, s.is_anonymous, s.created_at,
              COALESCE(s.status, 'PENDING') as status, s.response_note,
              (SELECT COUNT(*) FROM suggestion_votes WHERE suggestion_id = s.id) as vote_count,
              EXISTS(SELECT 1 FROM suggestion_votes WHERE suggestion_id = s.id AND user_id = $1) as user_voted,
              CASE WHEN s.is_anonymous THEN 'Anonymous Student' ELSE u.name END as author_name
       FROM suggestions s
       JOIN juniors j ON s.junior_id = j.id
       JOIN users u ON j.user_id = u.id
       ORDER BY vote_count DESC, s.created_at DESC`,
      [req.user!.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const createSuggestion = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, category, isAnonymous } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ success: false, message: 'Title, description, and category required', code: 'INVALID_INPUT' });
  }

  if (!req.user!.juniorId) {
    return res.status(403).json({ success: false, message: 'Only juniors can submit suggestions', code: 'FORBIDDEN' });
  }

  try {
    await query(`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING'`);
    await query(`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS response_note TEXT`);

    const result = await query(
      `INSERT INTO suggestions (junior_id, title, description, category, is_anonymous, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
      [req.user!.juniorId, title, description, category, isAnonymous || false]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const toggleSuggestionVote = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await query(`SELECT id FROM suggestion_votes WHERE suggestion_id = $1 AND user_id = $2`, [id, req.user!.id]);
    if (existing.rowCount! > 0) {
      await query(`DELETE FROM suggestion_votes WHERE suggestion_id = $1 AND user_id = $2`, [id, req.user!.id]);
      res.json({ success: true, message: 'Vote removed' });
    } else {
      await query(`INSERT INTO suggestion_votes (suggestion_id, user_id) VALUES ($1, $2)`, [id, req.user!.id]);
      res.json({ success: true, message: 'Upvoted suggestion' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const updateSuggestionStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, responseNote } = req.body;

  if (!['SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR'].includes(req.user!.role)) {
    return res.status(403).json({ success: false, message: 'Only mentors and management can update suggestion status', code: 'FORBIDDEN' });
  }

  try {
    await query(`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING'`);
    await query(`ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS response_note TEXT`);

    await query(
      `UPDATE suggestions SET status = $1, response_note = $2 WHERE id = $3`,
      [status || 'PENDING', responseNote || null, id]
    );

    res.json({ success: true, message: 'Suggestion status and feedback updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

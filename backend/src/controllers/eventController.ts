import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

// Ensure table exists on initialization
const ensureEventsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        timings VARCHAR(150) NOT NULL,
        place VARCHAR(200) NOT NULL,
        poster_url TEXT,
        created_by VARCHAR(36) REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Get All Events (Visible to all authenticated users)
export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureEventsTable();
    const result = await query(
      `SELECT e.*, u.name as creator_name
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       ORDER BY e.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Create Event (Super Admin only)
export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, timings, place, posterUrl } = req.body;

  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Super Admin can create college events',
      code: 'FORBIDDEN'
    });
  }

  if (!title || !description || !timings || !place) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, timings, and place are required',
      code: 'INVALID_INPUT'
    });
  }

  try {
    await ensureEventsTable();
    const result = await query(
      `INSERT INTO events (title, description, timings, place, poster_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        title.trim(),
        description.trim(),
        timings.trim(),
        place.trim(),
        posterUrl ? posterUrl.trim() : null,
        req.user!.id
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update Event (Super Admin only)
export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, timings, place, posterUrl } = req.body;

  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Super Admin can edit events',
      code: 'FORBIDDEN'
    });
  }

  if (!title || !description || !timings || !place) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, timings, and place are required',
      code: 'INVALID_INPUT'
    });
  }

  try {
    const result = await query(
      `UPDATE events
       SET title = $1, description = $2, timings = $3, place = $4, poster_url = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [title.trim(), description.trim(), timings.trim(), place.trim(), posterUrl ? posterUrl.trim() : null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Delete Event (Super Admin only)
export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Super Admin can delete events',
      code: 'FORBIDDEN'
    });
  }

  try {
    const result = await query(`DELETE FROM events WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Event not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: 'College event deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

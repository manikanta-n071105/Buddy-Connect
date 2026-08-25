import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

// Helper to guarantee table existence and schema columns
const ensureAnnouncementsTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'NORMAL',
        target_audience VARCHAR(50) DEFAULT 'ALL',
        department VARCHAR(100),
        batch VARCHAR(30),
        created_by VARCHAR(36) REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure missing columns on pre-existing tables
  await query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);
  await query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL';`);
  await query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'ALL';`);
};

// Get All Announcements (Visible to all authenticated users with target audience filtering)
export const getAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureAnnouncementsTable();
    const userRole = req.user!.role;

    let sql = `
      SELECT a.*, u.name as creator_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter target audience for non-Super Admin users
    if (['SENIOR', 'JUNIOR', 'DIRECTOR'].includes(userRole)) {
      sql += ` AND (a.target_audience = 'ALL' OR a.target_audience ILIKE $${params.length + 1})`;
      params.push(`%${userRole}%`);
    }

    sql += ` ORDER BY a.created_at DESC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Create Announcement (Super Admin only)
export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, priority, targetAudience } = req.body;

  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Super Admin can post announcements',
      code: 'FORBIDDEN'
    });
  }

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Title and description are required',
      code: 'INVALID_INPUT'
    });
  }

  try {
    await ensureAnnouncementsTable();
    const result = await query(
      `INSERT INTO announcements (title, description, priority, target_audience, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        title.trim(),
        description.trim(),
        priority || 'NORMAL',
        targetAudience || 'ALL',
        req.user!.id
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update Announcement (Super Admin only)
export const updateAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, priority, targetAudience } = req.body;

  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Super Admin can edit announcements',
      code: 'FORBIDDEN'
    });
  }

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Title and description are required',
      code: 'INVALID_INPUT'
    });
  }

  try {
    await ensureAnnouncementsTable();
    const result = await query(
      `UPDATE announcements
       SET title = $1, description = $2, priority = $3, target_audience = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [title.trim(), description.trim(), priority || 'NORMAL', targetAudience || 'ALL', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Delete Announcement (Super Admin only)
export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Super Admin can delete announcements',
      code: 'FORBIDDEN'
    });
  }

  try {
    await ensureAnnouncementsTable();
    const result = await query(`DELETE FROM announcements WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

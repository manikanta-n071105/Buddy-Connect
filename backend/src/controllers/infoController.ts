import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

// Announcements
export const getAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`SELECT * FROM announcements ORDER BY created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, priority, targetAudience, department, batch, endDate } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description required', code: 'INVALID_INPUT' });
  }

  try {
    const result = await query(
      `INSERT INTO announcements (title, description, priority, target_audience, department, batch, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, priority || 'NORMAL', targetAudience || 'ALL', department || null, batch || null, endDate || null, req.user!.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// College Info
export const getCollegeInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`SELECT * FROM college_information ORDER BY sequence_order ASC, category ASC`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Campus Locations
export const getCampusLocations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`SELECT * FROM campus_locations ORDER BY category ASC, name ASC`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Emergency Contacts
export const getEmergencyContacts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`SELECT * FROM emergency_contacts ORDER BY name ASC`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const createEmergencyContact = async (req: AuthenticatedRequest, res: Response) => {
  const { name, contactType, phone, location, availability } = req.body;
  if (!name || !contactType || !phone) {
    return res.status(400).json({ success: false, message: 'Name, contact type, and phone required', code: 'INVALID_INPUT' });
  }

  try {
    const result = await query(
      `INSERT INTO emergency_contacts (name, contact_type, phone, location, availability)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), contactType.trim(), phone.trim(), (location || 'Campus Main').trim(), (availability || '24/7').trim()]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Emergency contact created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const updateEmergencyContact = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, contactType, phone, location, availability } = req.body;

  if (!name || !contactType || !phone) {
    return res.status(400).json({ success: false, message: 'Name, contact type, and phone required', code: 'INVALID_INPUT' });
  }

  try {
    const result = await query(
      `UPDATE emergency_contacts
       SET name = $1, contact_type = $2, phone = $3, location = $4, availability = $5
       WHERE id = $6 RETURNING *`,
      [name.trim(), contactType.trim(), phone.trim(), (location || 'Campus Main').trim(), (availability || '24/7').trim(), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Emergency contact not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Emergency contact updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const deleteEmergencyContact = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`DELETE FROM emergency_contacts WHERE id = $1 RETURNING *`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Emergency contact not found', code: 'NOT_FOUND' });
    }
    res.json({ success: true, message: 'Emergency contact deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

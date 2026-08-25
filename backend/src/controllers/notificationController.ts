import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user!.id]
    );

    const unreadCount = result.rows.filter(r => !r.is_read).length;

    res.json({ success: true, data: { notifications: result.rows, unreadCount } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    await query(`UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2`, [id, req.user!.id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await query(`UPDATE notifications SET is_read = true WHERE recipient_id = $1`, [req.user!.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const sendSampleNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersRes = await query(`SELECT id FROM users`);
    const users = usersRes.rows;

    const sampleNotifications = [
      {
        title: '📅 Upcoming Event: Annual Campus Tech & Orientation Summit 2026',
        message: 'Join us this Friday at 10:00 AM in the Main Auditorium for the Annual Tech & Orientation Summit featuring keynote speakers & interactive workshops!',
        type: 'EVENT',
        metadata: JSON.stringify({ eventId: 101, location: 'Main Auditorium', date: '2026-08-28' })
      },
      {
        title: '📊 New Poll: Preferred Orientation Workshop Timings',
        message: 'A new official poll has been published. Cast your vote to let us know your preferred slot for the upcoming orientation!',
        type: 'POLL',
        metadata: JSON.stringify({ pollId: 202, scope: 'CAMPUS' })
      },
      {
        title: '🗳️ Community Voting Needed: High-Priority Student Proposal #104',
        message: 'Community voting is now OPEN for Proposal #104 (Subsidized Canteen Meal Plan & Evening Lab Access). Review details and cast your vote today!',
        type: 'VOTING',
        metadata: JSON.stringify({ proposalId: 104, category: 'Campus Facilities' })
      },
      {
        title: '📢 Official Circular: Semester Lab & Mentorship Guidelines',
        message: 'All Directors, Senior Mentors, and Junior Students are requested to review the updated mentorship circular published on the portal.',
        type: 'ANNOUNCEMENT',
        metadata: JSON.stringify({ announcementId: 305 })
      }
    ];

    for (const u of users) {
      for (const n of sampleNotifications) {
        await query(
          `INSERT INTO notifications (recipient_id, title, message, type, metadata) VALUES ($1, $2, $3, $4, $5)`,
          [u.id, n.title, n.message, n.type, n.metadata]
        );
      }
    }

    res.json({
      success: true,
      message: `Broadcasted ${sampleNotifications.length} notifications to ${users.length} user accounts successfully!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

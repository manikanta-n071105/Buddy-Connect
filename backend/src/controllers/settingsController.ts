import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('MAX_JUNIORS_PER_FACULTY', '5', 'Maximum Juniors assigned per Faculty mentor')
      ON CONFLICT (key) DO NOTHING;
    `);

    const result = await query(`SELECT key, value, description, updated_at FROM system_settings ORDER BY key`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
  const { settings } = req.body; // array of { key, value }

  if (!Array.isArray(settings)) {
    return res.status(400).json({ success: false, message: 'Settings array required', code: 'INVALID_INPUT' });
  }

  try {
    for (const item of settings) {
      await query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [item.key, item.value.toString()]
      );

      if (item.key === 'MAX_JUNIORS_PER_FACULTY' && !isNaN(parseInt(item.value))) {
        const newMax = parseInt(item.value);
        await query(`UPDATE faculty SET max_juniors = $1`, [newMax]);
      }
    }

    await logAudit(req.user!.id, 'UPDATE_SYSTEM_SETTINGS', 'SYSTEM_SETTINGS', null, { settings }, req.ip);

    res.json({ success: true, message: 'System settings updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

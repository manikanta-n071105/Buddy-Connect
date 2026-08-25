import { Response } from 'express';
import { query, executeTransaction } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

// Hierarchy Tree representation
export const getHierarchyTree = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let directorsSql = `
      SELECT d.id as director_id, d.director_code, d.department, u.id as user_id, u.name as director_name, u.email as director_email
      FROM directors d
      JOIN users u ON d.user_id = u.id
    `;
    const directorsParams: any[] = [];

    if (req.user!.role === 'DIRECTOR') {
      directorsSql += ` WHERE d.id = $1`;
      directorsParams.push(req.user!.directorId);
    } else if (req.user!.role === 'SENIOR') {
      directorsSql += ` WHERE d.id = $1`;
      directorsParams.push(req.user!.directorId);
    }

    const directorsRes = await query(directorsSql, directorsParams);
    const directors = directorsRes.rows;

    const tree = [];

    for (const dir of directors) {
      let seniorsSql = `
        SELECT s.id as senior_id, s.senior_code, s.department, u.id as user_id, u.name as senior_name, u.email as senior_email
        FROM seniors s
        JOIN users u ON s.user_id = u.id
        WHERE s.director_id = $1
      `;
      const seniorsParams: any[] = [dir.director_id];

      if (req.user!.role === 'SENIOR') {
        seniorsSql += ` AND s.id = $2`;
        seniorsParams.push(req.user!.seniorId);
      }

      const seniorsRes = await query(seniorsSql, seniorsParams);
      const seniors = seniorsRes.rows;

      const seniorsWithJuniors = [];

      for (const sen of seniors) {
        const juniorsRes = await query(
          `SELECT j.id as junior_id, j.register_number, j.batch, j.year, u.id as user_id, u.name as junior_name, u.email as junior_email
           FROM juniors j
           JOIN users u ON j.user_id = u.id
           WHERE j.senior_id = $1`,
          [sen.senior_id]
        );

        seniorsWithJuniors.push({
          ...sen,
          juniors: juniorsRes.rows,
          juniorCount: juniorsRes.rowCount
        });
      }

      tree.push({
        ...dir,
        seniors: seniorsWithJuniors,
        seniorCount: seniorsWithJuniors.length
      });
    }

    res.json({ success: true, data: tree });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Transfer Junior to a new Senior
export const transferJunior = async (req: AuthenticatedRequest, res: Response) => {
  const { juniorId, newSeniorId, reason } = req.body;
  if (!juniorId || !newSeniorId) {
    return res.status(400).json({ success: false, message: 'Junior ID and new Senior ID are required', code: 'INVALID_INPUT' });
  }

  try {
    // Check capacity of new Senior
    const maxJuniorsRes = await query(`SELECT value FROM system_settings WHERE key = 'MAX_JUNIORS_PER_SENIOR'`);
    const maxJuniors = parseInt(maxJuniorsRes.rows[0]?.value || '8');

    const countRes = await query(`SELECT COUNT(*) FROM juniors WHERE senior_id = $1`, [newSeniorId]);
    if (parseInt(countRes.rows[0].count) >= maxJuniors) {
      return res.status(400).json({ success: false, message: `Target Senior has reached maximum capacity of ${maxJuniors} juniors`, code: 'CAPACITY_EXCEEDED' });
    }

    const juniorRes = await query(`SELECT senior_id FROM juniors WHERE id = $1`, [juniorId]);
    if (juniorRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Junior not found', code: 'NOT_FOUND' });

    const previousSeniorId = juniorRes.rows[0].senior_id;

    await query(`UPDATE juniors SET senior_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newSeniorId, juniorId]);

    await logAudit(req.user!.id, 'TRANSFER_JUNIOR', 'JUNIOR', juniorId, { previousSeniorId, newSeniorId, reason }, req.ip);

    res.json({ success: true, message: 'Junior transferred successfully to new senior.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Assign Temporary Mentor for Senior on Leave
export const assignTemporaryMentor = async (req: AuthenticatedRequest, res: Response) => {
  const { juniorId, tempSeniorId, startDate, endDate, reason } = req.body;
  if (!juniorId || !tempSeniorId || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Missing required parameters', code: 'INVALID_INPUT' });
  }

  try {
    const juniorRes = await query(`SELECT senior_id FROM juniors WHERE id = $1`, [juniorId]);
    if (juniorRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Junior not found', code: 'NOT_FOUND' });

    const originalSeniorId = juniorRes.rows[0].senior_id;

    const resTemp = await query(
      `INSERT INTO temporary_mentors (junior_id, original_senior_id, temp_senior_id, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [juniorId, originalSeniorId, tempSeniorId, startDate, endDate, reason || null]
    );

    await logAudit(req.user!.id, 'ASSIGN_TEMP_MENTOR', 'TEMPORARY_MENTOR', resTemp.rows[0].id, { juniorId, originalSeniorId, tempSeniorId }, req.ip);

    res.status(201).json({ success: true, data: resTemp.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

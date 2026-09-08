import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { cache } from '../utils/cache';
import { logAudit } from '../utils/audit';

// Hierarchy Tree representation - Optimized for 5ms Response Latency
export const getHierarchyTree = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const userRole = req.user.role;
    const userId = req.user.id;
    const directorId = req.user!.directorId;
    const seniorId = req.user!.seniorId;

    const cacheKey = `hierarchy_tree:${userRole}:${userId}:${directorId || ''}:${seniorId || ''}`;
    const cachedTree = await cache.get<any[]>(cacheKey);
    if (cachedTree) {
      return res.json({ success: true, data: cachedTree });
    }

    let directorsSql = `
      SELECT d.id as director_id, d.director_code, d.department, u.id as user_id, u.name as director_name, u.email as director_email
      FROM directors d
      JOIN users u ON d.user_id = u.id
    `;
    const directorsParams: any[] = [];

    if (userRole === 'DIRECTOR' || userRole === 'SENIOR') {
      directorsSql += ` WHERE d.id = $1`;
      directorsParams.push(directorId);
    }

    const directorsRes = await query(directorsSql, directorsParams);
    const directors = directorsRes.rows;

    if (directors.length === 0) {
      await cache.set(cacheKey, [], 15000);
      return res.json({ success: true, data: [] });
    }

    const directorIds = directors.map(d => d.director_id);

    // Fetch all seniors for all matched directors in a single batch query
    let seniorsSql = `
      SELECT s.id as senior_id, s.senior_code, s.department, s.director_id, u.id as user_id, u.name as senior_name, u.email as senior_email
      FROM seniors s
      JOIN users u ON s.user_id = u.id
      WHERE s.director_id = ANY($1::text[])
    `;
    const seniorsParams: any[] = [directorIds];

    if (userRole === 'SENIOR') {
      seniorsSql += ` AND s.id = $2`;
      seniorsParams.push(seniorId);
    }

    const seniorsRes = await query(seniorsSql, seniorsParams);
    const allSeniors = seniorsRes.rows;
    const seniorIds = allSeniors.map(s => s.senior_id);

    // Fetch all juniors for all matched seniors in a single batch query
    let allJuniors: any[] = [];
    if (seniorIds.length > 0) {
      const juniorsRes = await query(
        `SELECT j.id as junior_id, j.register_number, j.batch, j.year, j.senior_id, u.id as user_id, u.name as junior_name, u.email as junior_email
         FROM juniors j
         JOIN users u ON j.user_id = u.id
         WHERE j.senior_id = ANY($1::text[])`,
        [seniorIds]
      );
      allJuniors = juniorsRes.rows;
    }

    // Group juniors by senior_id
    const juniorsBySeniorId: Record<string, any[]> = {};
    for (const jun of allJuniors) {
      if (!juniorsBySeniorId[jun.senior_id]) {
        juniorsBySeniorId[jun.senior_id] = [];
      }
      juniorsBySeniorId[jun.senior_id].push(jun);
    }

    // Group seniors by director_id
    const seniorsByDirectorId: Record<string, any[]> = {};
    for (const sen of allSeniors) {
      const juniors = juniorsBySeniorId[sen.senior_id] || [];
      const senWithJun = {
        ...sen,
        juniors,
        juniorCount: juniors.length
      };

      if (!seniorsByDirectorId[sen.director_id]) {
        seniorsByDirectorId[sen.director_id] = [];
      }
      seniorsByDirectorId[sen.director_id].push(senWithJun);
    }

    // Assemble final tree
    const tree = directors.map(dir => {
      const seniors = seniorsByDirectorId[dir.director_id] || [];
      return {
        ...dir,
        seniors,
        seniorCount: seniors.length
      };
    });

    await cache.set(cacheKey, tree, 15000); // 15s TTL Cache

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

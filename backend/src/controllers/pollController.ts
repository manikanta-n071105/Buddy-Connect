import { Response } from 'express';
import { query, executeTransaction } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

const ensurePollTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS polls (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        department VARCHAR(100),
        target_audience VARCHAR(50) DEFAULT 'JUNIORS',
        created_by VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS poll_options (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        poll_id VARCHAR(36) NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        option_text VARCHAR(255) NOT NULL,
        sequence_order INT DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS poll_votes (
        id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
        poll_id VARCHAR(36) NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        option_id VARCHAR(36) NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
        voter_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(poll_id, voter_id)
    );
  `);
};

// Fetch Polls (Only active non-expired polls for Juniors, or all for SuperAdmin/Director)
export const getPolls = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensurePollTables();
    const { includeExpired } = req.query;

    let sql = `
      SELECT p.id, p.title, p.description, p.department, p.target_audience, p.expires_at, p.is_active, p.created_at,
             u.name as creator_name, u.role as creator_role
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter out expired polls for normal display unless includeExpired is true
    if (includeExpired !== 'true') {
      sql += ` AND p.is_active = true AND p.expires_at > CURRENT_TIMESTAMP`;
    }

    // Filter department scoping for Directors / Juniors if applicable
    if (req.user!.role === 'DIRECTOR' && req.user!.directorId) {
      const dRes = await query(`SELECT department FROM directors WHERE id = $1`, [req.user!.directorId]);
      if (dRes.rowCount! > 0) {
        const dept = dRes.rows[0].department;
        sql += ` AND (p.department IS NULL OR p.department = 'ALL' OR p.department = $${params.length + 1})`;
        params.push(dept);
      }
    }

    sql += ` ORDER BY p.created_at DESC`;

    const pollsRes = await query(sql, params);
    const polls = pollsRes.rows;

    const detailedPolls = [];

    for (const poll of polls) {
      // Get options & vote counts
      const optionsRes = await query(
        `SELECT po.id, po.option_text, po.sequence_order,
                COUNT(pv.id) as vote_count
         FROM poll_options po
         LEFT JOIN poll_votes pv ON po.id = pv.option_id
         WHERE po.poll_id = $1
         GROUP BY po.id, po.option_text, po.sequence_order
         ORDER BY po.sequence_order ASC`,
        [poll.id]
      );

      const options = optionsRes.rows.map(o => ({
        id: o.id,
        option_text: o.option_text,
        vote_count: parseInt(o.vote_count || '0')
      }));

      const totalVotes = options.reduce((sum, o) => sum + o.vote_count, 0);

      const optionsWithPct = options.map(o => ({
        ...o,
        percentage: totalVotes > 0 ? Math.round((o.vote_count / totalVotes) * 100) : 0
      }));

      // Check if current logged in user has voted on this poll
      const userVoteRes = await query(
        `SELECT option_id FROM poll_votes WHERE poll_id = $1 AND voter_id = $2`,
        [poll.id, req.user!.id]
      );

      const userVotedOptionId = userVoteRes.rowCount! > 0 ? userVoteRes.rows[0].option_id : null;
      const isExpired = new Date(poll.expires_at).getTime() <= Date.now();

      detailedPolls.push({
        ...poll,
        options: optionsWithPct,
        totalVotes,
        userVotedOptionId,
        isExpired
      });
    }

    res.json({ success: true, data: detailedPolls });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Create a new Poll (SuperAdmin, Admin, Director)
export const createPoll = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, department, options, durationHours, expiresAt } = req.body;

  if (!title || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ success: false, message: 'Title and at least 2 poll options are required', code: 'INVALID_INPUT' });
  }

  try {
    await ensurePollTables();

    // Calculate Expiry Date
    let expiryDate: Date;
    if (durationHours && !isNaN(parseFloat(durationHours))) {
      expiryDate = new Date(Date.now() + parseFloat(durationHours) * 3600 * 1000);
    } else if (expiresAt) {
      expiryDate = new Date(expiresAt);
    } else {
      expiryDate = new Date(Date.now() + 24 * 3600 * 1000); // Default 24 hours
    }

    const cleanOptions = options.map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);
    if (cleanOptions.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 non-empty poll choices are required', code: 'INVALID_INPUT' });
    }

    const createdPoll = await executeTransaction(async (client) => {
      const pRes = await client.query(
        `INSERT INTO polls (title, description, department, created_by, expires_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, title, description, department, expires_at, created_at`,
        [title.trim(), description ? description.trim() : null, department || 'ALL', req.user!.id, expiryDate]
      );

      const poll = pRes.rows[0];

      for (let i = 0; i < cleanOptions.length; i++) {
        await client.query(
          `INSERT INTO poll_options (poll_id, option_text, sequence_order) VALUES ($1, $2, $3)`,
          [poll.id, cleanOptions[i], i + 1]
        );
      }

      return poll;
    });

    await logAudit(req.user!.id, 'CREATE_POLL', 'POLL', createdPoll.id, { title: title.trim(), expiryDate }, req.ip);

    res.status(201).json({ success: true, data: createdPoll, message: 'Campus poll created successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'CREATE_FAILED' });
  }
};

// Vote on a Poll (Junior students only)
export const votePoll = async (req: AuthenticatedRequest, res: Response) => {
  const { pollId } = req.params;
  const { optionId } = req.body;

  if (req.user!.role !== 'JUNIOR') {
    return res.status(403).json({ success: false, message: 'Only Junior students are eligible to vote in campus polls.', code: 'FORBIDDEN' });
  }

  if (!optionId) {
    return res.status(400).json({ success: false, message: 'Poll option selection required', code: 'INVALID_INPUT' });
  }

  try {
    await ensurePollTables();

    // Check if poll is active and non-expired
    const pRes = await query(`SELECT id, is_active, expires_at FROM polls WHERE id = $1`, [pollId]);
    if (pRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Poll not found', code: 'NOT_FOUND' });
    }

    const poll = pRes.rows[0];
    if (!poll.is_active || new Date(poll.expires_at).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Poll has expired and is no longer accepting votes', code: 'POLL_EXPIRED' });
    }

    // Record or update vote
    await query(
      `INSERT INTO poll_votes (poll_id, option_id, voter_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (poll_id, voter_id) DO UPDATE SET option_id = EXCLUDED.option_id, created_at = CURRENT_TIMESTAMP`,
      [pollId, optionId, req.user!.id]
    );

    res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Delete a Poll
export const deletePoll = async (req: AuthenticatedRequest, res: Response) => {
  const { pollId } = req.params;

  try {
    await ensurePollTables();
    await query(`DELETE FROM polls WHERE id = $1`, [pollId]);
    await logAudit(req.user!.id, 'DELETE_POLL', 'POLL', pollId as string, {}, req.ip);

    res.json({ success: true, message: 'Poll deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

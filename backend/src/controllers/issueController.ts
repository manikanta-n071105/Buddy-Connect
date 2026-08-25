import { Response } from 'express';
import { query, executeTransaction } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

const ensureVotingScopeColumn = async () => {
  await query(`ALTER TABLE issues ADD COLUMN IF NOT EXISTS voting_scope VARCHAR(50) DEFAULT 'NONE'`);
};

// List Categories
export const getCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`SELECT * FROM issue_categories WHERE is_active = true ORDER BY name`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Create Issue (Junior or on behalf of Junior)
export const createIssue = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, categoryId, priority, votingScope } = req.body;
  if (!title || !description || !categoryId || !priority) {
    return res.status(400).json({ success: false, message: 'Missing required issue details', code: 'INVALID_INPUT' });
  }

  try {
    await ensureVotingScopeColumn();

    // Determine Junior, Senior, and Director IDs
    let juniorId: string;
    let seniorId: string;
    let directorId: string;
    let seniorUserId: string;

    if (req.user!.role === 'JUNIOR') {
      juniorId = req.user!.juniorId!;
      seniorId = req.user!.seniorId!;
      directorId = req.user!.directorId!;
    } else {
      if (!req.body.juniorId) {
        return res.status(400).json({ success: false, message: 'Junior ID required when creating issue on behalf of student', code: 'INVALID_INPUT' });
      }
      juniorId = req.body.juniorId;
      const jRes = await query(
        `SELECT j.senior_id, s.director_id, s.user_id as senior_user_id
         FROM juniors j JOIN seniors s ON j.senior_id = s.id WHERE j.id = $1`,
        [juniorId]
      );
      if (jRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Junior not found', code: 'NOT_FOUND' });
      seniorId = jRes.rows[0].senior_id;
      directorId = jRes.rows[0].director_id;
    }

    const senUserRes = await query(`SELECT user_id FROM seniors WHERE id = $1`, [seniorId]);
    seniorUserId = senUserRes.rows[0].user_id;

    // Generate Issue Number
    const countRes = await query(`SELECT COUNT(*) FROM issues`);
    const seq = parseInt(countRes.rows[0].count) + 1001;
    const issueNumber = `JC-${seq}`;
    // STRICT RULE: By default no one can vote (targetVotingScope = 'NONE') unless Director grants access!
    const targetVotingScope = votingScope && ['ALL', 'MENTOR_SCOPE', 'REPORTER_ONLY', 'NONE'].includes(votingScope) ? votingScope : 'NONE';

    const newIssue = await executeTransaction(async (client) => {
      const iRes = await client.query(
        `INSERT INTO issues (
          issue_number, reported_by_id, junior_id, senior_id, director_id,
          category_id, title, description, priority, status, assigned_to_id, voting_scope
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN', $10, $11)
        RETURNING *`,
        [issueNumber, req.user!.id, juniorId, seniorId, directorId, categoryId, title, description, priority, seniorUserId, targetVotingScope]
      );

      await client.query(
        `INSERT INTO notifications (recipient_id, title, message, type, metadata)
         VALUES ($1, $2, $3, 'ISSUE_CREATED', $4)`,
        [
          seniorUserId,
          `New Issue Assigned: ${issueNumber}`,
          `A new ${priority} priority issue titled "${title}" has been assigned to you.`,
          JSON.stringify({ issueId: iRes.rows[0].id, issueNumber })
        ]
      );

      return iRes.rows[0];
    });

    await logAudit(req.user!.id, 'CREATE_ISSUE', 'ISSUE', newIssue.id, { issueNumber, title, priority, targetVotingScope }, req.ip);

    res.status(201).json({ success: true, data: newIssue });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'CREATE_FAILED' });
  }
};

// List Issues with filtering & scope visibility filtering
export const getIssues = async (req: AuthenticatedRequest, res: Response) => {
  const { status, priority, categoryId, search } = req.query;

  try {
    await ensureVotingScopeColumn();

    let sql = `
      SELECT i.*,
             ic.name as category_name,
             uj.name as junior_name, uj.email as junior_email,
             us.name as senior_name,
             ud.name as director_name,
             ua.name as assigned_to_name
      FROM issues i
      JOIN issue_categories ic ON i.category_id = ic.id
      JOIN juniors j ON i.junior_id = j.id
      JOIN users uj ON j.user_id = uj.id
      JOIN seniors s ON i.senior_id = s.id
      JOIN users us ON s.user_id = us.id
      JOIN directors d ON i.director_id = d.id
      JOIN users ud ON d.user_id = ud.id
      LEFT JOIN users ua ON i.assigned_to_id = ua.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Scope Visibility Filtering:
    // Don't show issue to other students unless it is made visible to all (voting_scope = 'ALL' or 'MENTOR_SCOPE' or self reported)
    if (req.user!.role === 'JUNIOR') {
      sql += ` AND (
        i.junior_id = $${params.length + 1}
        OR (i.voting_scope = 'MENTOR_SCOPE' AND i.senior_id = $${params.length + 2})
        OR (i.voting_scope = 'ALL')
      )`;
      params.push(req.user!.juniorId, req.user!.seniorId);
    } else if (req.user!.role === 'SENIOR') {
      sql += ` AND i.senior_id = $${params.length + 1}`;
      params.push(req.user!.seniorId);
    } else if (req.user!.role === 'DIRECTOR') {
      sql += ` AND i.director_id = $${params.length + 1}`;
      params.push(req.user!.directorId);
    }

    if (status) {
      sql += ` AND i.status = $${params.length + 1}`;
      params.push(status);
    }

    if (priority) {
      sql += ` AND i.priority = $${params.length + 1}`;
      params.push(priority);
    }

    if (categoryId) {
      sql += ` AND i.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    if (search) {
      sql += ` AND (i.title ILIKE $${params.length + 1} OR i.issue_number ILIKE $${params.length + 1} OR i.description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY (CASE WHEN i.status = 'ESCALATED' THEN 0 ELSE 1 END), i.created_at DESC`;

    const result = await query(sql, params);
    let rows = result.rows;

    // Mask issue status for non-reporter students
    if (req.user!.role === 'JUNIOR') {
      rows = rows.map((r: any) => {
        const isMyIssue = r.junior_id === req.user!.juniorId;
        if (!isMyIssue) {
          return {
            ...r,
            status: 'COMMUNITY_TICKET',
            resolution: null,
            resolution_notes: null,
            is_reporter: false
          };
        }
        return {
          ...r,
          is_reporter: true
        };
      });
    }

    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Issue Details with comments and votes
export const getIssueById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    await ensureVotingScopeColumn();

    const issueRes = await query(
      `SELECT i.*,
              ic.name as category_name,
              uj.name as junior_name, uj.email as junior_email,
              us.name as senior_name,
              ud.name as director_name,
              ua.name as assigned_to_name
       FROM issues i
       JOIN issue_categories ic ON i.category_id = ic.id
       JOIN juniors j ON i.junior_id = j.id
       JOIN users uj ON j.user_id = uj.id
       JOIN seniors s ON i.senior_id = s.id
       JOIN users us ON s.user_id = us.id
       JOIN directors d ON i.director_id = d.id
       JOIN users ud ON d.user_id = ud.id
       LEFT JOIN users ua ON i.assigned_to_id = ua.id
       WHERE i.id = $1`,
      [id]
    );

    if (issueRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Issue not found', code: 'NOT_FOUND' });

    const issue = issueRes.rows[0];
    const isReporter = req.user!.role === 'JUNIOR' && issue.junior_id === req.user!.juniorId;

    // Enforce visibility restriction for Juniors
    if (req.user!.role === 'JUNIOR') {
      const scope = issue.voting_scope || 'NONE';
      if (scope === 'REPORTER_ONLY' && !isReporter) {
        return res.status(403).json({ success: false, message: 'Access to this issue ticket is restricted to the reporting student.', code: 'FORBIDDEN' });
      }
      if (scope === 'MENTOR_SCOPE' && req.user!.seniorId !== issue.senior_id && !isReporter) {
        return res.status(403).json({ success: false, message: 'Access to this issue ticket is restricted to students under the assigned Senior Mentor.', code: 'FORBIDDEN' });
      }
    }

    const commentsRes = await query(
      `SELECT c.*, u.name as author_name, u.role as author_role
       FROM issue_comments c JOIN users u ON c.author_id = u.id
       WHERE c.issue_id = $1 ORDER BY c.created_at ASC`,
      [id]
    );

    const votesRes = await query(
      `SELECT v.*, u.name as voter_name, u.role as voter_role
       FROM issue_votes v JOIN users u ON v.voter_id = u.id
       WHERE v.issue_id = $1 ORDER BY v.created_at DESC`,
      [id]
    );

    let voteSummary = { satisfied: 0, partiallySatisfied: 0, notSatisfied: 0, total: 0, satisfiedPercent: 0 };
    if (votesRes.rowCount! > 0) {
      let sat = 0, part = 0, notSat = 0;
      votesRes.rows.forEach(v => {
        if (v.vote_type === 'SATISFIED') sat++;
        else if (v.vote_type === 'PARTIALLY_SATISFIED') part++;
        else if (v.vote_type === 'NOT_SATISFIED') notSat++;
      });
      const total = votesRes.rowCount!;
      voteSummary = {
        satisfied: sat,
        partiallySatisfied: part,
        notSatisfied: notSat,
        total,
        satisfiedPercent: Math.round((sat / total) * 100)
      };
    }

    // STRICT RULE: Voting buttons allowed ONLY if status is RESOLVED or VOTING
    let isEligibleToVote = false;
    if (req.user!.role === 'JUNIOR' && ['RESOLVED', 'VOTING'].includes(issue.status)) {
      const scope = issue.voting_scope || 'NONE';
      if (scope === 'ALL') isEligibleToVote = true;
      else if (scope === 'MENTOR_SCOPE' && (req.user!.seniorId === issue.senior_id || isReporter)) isEligibleToVote = true;
      else if (scope === 'REPORTER_ONLY' && isReporter) isEligibleToVote = true;
    }

    // Mask issue status for non-reporter students
    if (req.user!.role === 'JUNIOR' && !isReporter) {
      issue.status = 'COMMUNITY_TICKET';
      issue.resolution = null;
      issue.resolution_notes = null;
    }

    res.json({
      success: true,
      data: {
        issue,
        comments: commentsRes.rows,
        votes: votesRes.rows,
        voteSummary,
        isEligibleToVote,
        isReporter: req.user!.role !== 'JUNIOR' || isReporter
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update Issue Status / Add Resolution (Clears old votes for fresh re-voting)
export const updateIssueStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, resolution, resolutionNotes } = req.body;

  try {
    const issueRes = await query(`SELECT * FROM issues WHERE id = $1`, [id]);
    if (issueRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Issue not found', code: 'NOT_FOUND' });

    const issue = issueRes.rows[0];

    // STRICT RULE: If the issue is escalated to Director, Senior Mentor CANNOT change the status of the issue!
    if (issue.status === 'ESCALATED' && req.user!.role === 'SENIOR') {
      return res.status(403).json({
        success: false,
        message: 'This issue has been escalated to the Department Director. Senior Mentors cannot change the status of escalated issues.',
        code: 'FORBIDDEN'
      });
    }

    let updateFields: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    let params: any[] = [status];

    if (status === 'RESOLVED' || status === 'VOTING') {
      updateFields.push(`resolution = $${params.length + 1}`);
      params.push(resolution || 'Resolution provided by mentor.');
      updateFields.push(`resolution_notes = $${params.length + 1}`);
      params.push(resolutionNotes || '');
      updateFields.push(`resolved_at = CURRENT_TIMESTAMP`);
      params[0] = 'VOTING';

      // Clear previous votes on resolution status change so students can fresh re-vote!
      await query(`DELETE FROM issue_votes WHERE issue_id = $1`, [id]);
    } else if (status === 'CLOSED') {
      updateFields.push(`closed_at = CURRENT_TIMESTAMP`);
    } else if (status === 'REOPENED') {
      updateFields.push(`reopened_at = CURRENT_TIMESTAMP`);
    }

    params.push(id);

    await query(`UPDATE issues SET ${updateFields.join(', ')} WHERE id = $${params.length}`, params);

    const jRes = await query(`SELECT user_id FROM juniors WHERE id = $1`, [issue.junior_id]);
    if (jRes.rowCount! > 0) {
      await query(
        `INSERT INTO notifications (recipient_id, title, message, type, metadata)
         VALUES ($1, $2, $3, 'ISSUE_UPDATED', $4)`,
        [
          jRes.rows[0].user_id,
          `Issue #${issue.issue_number} Updated`,
          `Your issue status has been updated to ${status === 'RESOLVED' ? 'VOTING (Awaiting Feedback)' : status}. You can cast a fresh vote!`,
          JSON.stringify({ issueId: id, issueNumber: issue.issue_number })
        ]
      );
    }

    await logAudit(req.user!.id, 'UPDATE_ISSUE_STATUS', 'ISSUE', id as string, { status, resolution }, req.ip);

    res.json({ success: true, message: `Issue status updated to ${status === 'RESOLVED' ? 'VOTING' : status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update Issue Voting Audience Scope (Only Department Director and Super Admin)
export const updateVotingScope = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { votingScope } = req.body;

  // STRICT RULE: Only Department Director and Super Admin can decide who can vote
  if (!['SUPER_ADMIN', 'ADMIN', 'DIRECTOR'].includes(req.user!.role)) {
    return res.status(403).json({ success: false, message: 'Only Department Director and Super Admin can configure voting audience settings.', code: 'FORBIDDEN' });
  }

  if (!votingScope || !['ALL', 'MENTOR_SCOPE', 'REPORTER_ONLY', 'NONE'].includes(votingScope)) {
    return res.status(400).json({ success: false, message: 'Valid votingScope (ALL, MENTOR_SCOPE, REPORTER_ONLY, NONE) required', code: 'INVALID_INPUT' });
  }

  try {
    await ensureVotingScopeColumn();
    await query(`UPDATE issues SET voting_scope = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [votingScope, id]);
    await logAudit(req.user!.id, 'UPDATE_VOTING_SCOPE', 'ISSUE', id as string, { votingScope }, req.ip);

    res.json({ success: true, message: `Issue voting audience scope updated to ${votingScope}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Post Comment
export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ success: false, message: 'Comment text required', code: 'INVALID_INPUT' });

  try {
    const result = await query(
      `INSERT INTO issue_comments (issue_id, author_id, comment)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, req.user!.id, comment]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Submit Issue Vote with Audience Scope Validation & Re-voting
export const submitVote = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { voteType, comment } = req.body;

  if (!voteType || !['SATISFIED', 'PARTIALLY_SATISFIED', 'NOT_SATISFIED'].includes(voteType)) {
    return res.status(400).json({ success: false, message: 'Valid voteType (SATISFIED, PARTIALLY_SATISFIED, NOT_SATISFIED) required', code: 'INVALID_INPUT' });
  }

  try {
    await ensureVotingScopeColumn();
    const issueRes = await query(
      `SELECT i.*, s.user_id as senior_user_id, d.user_id as director_user_id
       FROM issues i
       JOIN seniors s ON i.senior_id = s.id
       JOIN directors d ON i.director_id = d.id
       WHERE i.id = $1`,
      [id]
    );
    if (issueRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Issue not found', code: 'NOT_FOUND' });

    const issue = issueRes.rows[0];
    const scope = issue.voting_scope || 'NONE';

    // STRICT RULE: Voting permitted ONLY when issue status is RESOLVED or VOTING!
    if (!['RESOLVED', 'VOTING'].includes(issue.status)) {
      return res.status(400).json({ success: false, message: 'Voting is permitted ONLY when the issue status is RESOLVED or VOTING.', code: 'INVALID_STATUS' });
    }

    // STRICT RULE: By default no one can vote (scope = 'NONE') unless Director grants access!
    if (scope === 'NONE') {
      return res.status(403).json({ success: false, message: 'Voting access is locked for this issue until Department Director grants voting permissions.', code: 'VOTING_LOCKED' });
    }

    // Validate voting eligibility
    if (req.user!.role !== 'JUNIOR') {
      return res.status(403).json({ success: false, message: 'Only Junior students are eligible to vote on issue tickets.', code: 'FORBIDDEN' });
    }

    if (scope === 'REPORTER_ONLY' && req.user!.juniorId !== issue.junior_id) {
      return res.status(403).json({ success: false, message: 'Voting on this issue is restricted to the student who reported it.', code: 'VOTING_RESTRICTED' });
    } else if (scope === 'MENTOR_SCOPE' && req.user!.seniorId !== issue.senior_id && req.user!.juniorId !== issue.junior_id) {
      return res.status(403).json({ success: false, message: 'Voting on this issue is restricted to students under the assigned Senior Mentor.', code: 'VOTING_RESTRICTED' });
    }

    // Re-voting Support: UPSERT vote so student can change/update vote when status changes!
    const checkVote = await query(`SELECT id FROM issue_votes WHERE issue_id = $1 AND voter_id = $2`, [id, req.user!.id]);
    if (checkVote.rowCount! > 0) {
      await query(
        `UPDATE issue_votes SET vote_type = $1, comment = $2, created_at = CURRENT_TIMESTAMP WHERE issue_id = $3 AND voter_id = $4`,
        [voteType, comment || null, id, req.user!.id]
      );
    } else {
      await query(
        `INSERT INTO issue_votes (issue_id, voter_id, vote_type, comment)
         VALUES ($1, $2, $3, $4)`,
        [id, req.user!.id, voteType, comment || null]
      );
    }

    // Evaluate voting threshold for auto escalation
    const votesRes = await query(`SELECT vote_type FROM issue_votes WHERE issue_id = $1`, [id]);
    const totalVotes = votesRes.rowCount!;
    const satisfiedVotes = votesRes.rows.filter(r => r.vote_type === 'SATISFIED').length;
    const notSatisfiedVotes = votesRes.rows.filter(r => r.vote_type === 'NOT_SATISFIED').length;
    const satisfiedPercentage = Math.round((satisfiedVotes / totalVotes) * 100);

    let newStatus = issue.status;
    let messageNotice = 'Your vote has been recorded.';

    // Low Satisfaction Auto Escalation: If NOT_SATISFIED > SATISFIED or satisfied percentage < 50%
    if (notSatisfiedVotes > satisfiedVotes || (totalVotes >= 1 && satisfiedPercentage < 50)) {
      newStatus = 'ESCALATED';
      await query(`UPDATE issues SET status = 'ESCALATED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

      // Dispatch urgent notifications directly to Senior Mentor and Director
      await query(
        `INSERT INTO notifications (recipient_id, title, message, type, metadata)
         VALUES ($1, $2, $3, 'ISSUE_ESCALATED', $4), ($5, $2, $6, 'ISSUE_ESCALATED', $4)`,
        [
          issue.senior_user_id,
          `URGENT: Issue #${issue.issue_number} Escalated to Director`,
          `Satisfaction rating is low for issue "${issue.title}". Ticket has been automatically escalated directly to Director for immediate review.`,
          JSON.stringify({ issueId: id, issueNumber: issue.issue_number }),
          issue.director_user_id,
          `URGENT: Issue #${issue.issue_number} Escalated due to low student satisfaction.`
        ]
      );

      messageNotice += ' Due to low satisfaction rating, the issue has been automatically escalated directly to your Department Director for immediate review.';
    }

    await logAudit(req.user!.id, 'SUBMIT_ISSUE_VOTE', 'ISSUE_VOTE', id as string, { voteType, newStatus }, req.ip);

    res.json({ success: true, message: messageNotice, newStatus });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

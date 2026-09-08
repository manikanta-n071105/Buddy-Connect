import { Response } from 'express';
import { query, executeTransaction } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

// List Categories
export const getCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validCats = [
      'Academics', 'Academic', 'Hostel', 'Safety', 'Transport', 'Technical',
      'ID Card', 'Accommodation', 'Events', 'Examination', 'Faculty',
      'Fees', 'Food', 'Infrastructure', 'Library', 'College Tour', 'Other'
    ];
    for (const cat of validCats) {
      await query(
        `INSERT INTO issue_categories (name, description, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (name) DO UPDATE SET is_active = true`,
        [cat, `${cat} support and queries`]
      );
    }
    await query(`UPDATE issue_categories SET is_active = true`);

    const result = await query(`SELECT * FROM issue_categories WHERE is_active = true ORDER BY name ASC`);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Create Issue (Junior or on behalf of Junior)
export const createIssue = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, categoryId, priority } = req.body;
  if (!title || !description || !categoryId || !priority) {
    return res.status(400).json({ success: false, message: 'Missing required issue details', code: 'INVALID_INPUT' });
  }

  try {
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

    const newIssue = await executeTransaction(async (client) => {
      const iRes = await client.query(
        `INSERT INTO issues (
          issue_number, reported_by_id, junior_id, senior_id, director_id,
          category_id, title, description, priority, status, assigned_to_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN', $10)
        RETURNING *`,
        [issueNumber, req.user!.id, juniorId, seniorId, directorId, categoryId, title, description, priority, seniorUserId]
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

    await logAudit(req.user!.id, 'CREATE_ISSUE', 'ISSUE', newIssue.id, { issueNumber, title, priority }, req.ip);

    res.status(201).json({ success: true, data: newIssue });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'CREATE_FAILED' });
  }
};

// List Issues with filtering & scope visibility filtering
export const getIssues = async (req: AuthenticatedRequest, res: Response) => {
  const { status, priority, categoryId, search } = req.query;

  try {
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
    if (req.user!.role === 'JUNIOR') {
      sql += ` AND i.junior_id = $${params.length + 1}`;
      params.push(req.user!.juniorId);
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

    sql += ` ORDER BY 
      (CASE WHEN i.status IN ('CLOSED', 'RESOLVED') THEN 1 ELSE 0 END) ASC,
      (CASE WHEN i.status = 'ESCALATED' THEN 0 ELSE 1 END) ASC,
      (CASE 
        WHEN i.priority = 'URGENT' THEN 1 
        WHEN i.priority = 'CRITICAL' THEN 1 
        WHEN i.priority = 'HIGH' THEN 2 
        WHEN i.priority = 'MEDIUM' THEN 3 
        WHEN i.priority = 'LOW' THEN 4 
        ELSE 5 
      END) ASC,
      i.created_at DESC`;

    const result = await query(sql, params);
    let rows = result.rows.map((r: any) => ({
      ...r,
      is_reporter: req.user!.role !== 'JUNIOR' || r.junior_id === req.user!.juniorId
    }));

    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Issue Details
export const getIssueById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
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

    if (req.user!.role === 'JUNIOR' && !isReporter) {
      return res.status(403).json({ success: false, message: 'Access to this issue ticket is restricted to the reporting student.', code: 'FORBIDDEN' });
    }

    const commentsRes = await query(
      `SELECT c.*, u.name as author_name, u.role as author_role
       FROM issue_comments c JOIN users u ON c.author_id = u.id
       WHERE c.issue_id = $1 ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        issue,
        comments: commentsRes.rows,
        isReporter: req.user!.role !== 'JUNIOR' || isReporter
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update Issue Status / Add Resolution
export const updateIssueStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, resolution, resolutionNotes } = req.body;

  try {
    const issueRes = await query(`SELECT * FROM issues WHERE id = $1`, [id]);
    if (issueRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Issue not found', code: 'NOT_FOUND' });

    const issue = issueRes.rows[0];

    if (issue.status === 'ESCALATED' && req.user!.role === 'SENIOR') {
      return res.status(403).json({
        success: false,
        message: 'This issue has been escalated to the Department Director. Senior Mentors cannot change the status of escalated issues.',
        code: 'FORBIDDEN'
      });
    }

    if (status === 'CLOSED' && req.user!.role === 'SENIOR') {
      return res.status(403).json({
        success: false,
        message: 'Senior Mentors cannot close issue tickets. Issues can only be closed by the student who reported it, Department Director, or Administrator.',
        code: 'FORBIDDEN'
      });
    }

    let updateFields: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    let params: any[] = [status];

    if (status === 'RESOLVED') {
      updateFields.push(`resolution = $${params.length + 1}`);
      params.push(resolution || 'Resolution provided by mentor.');
      updateFields.push(`resolution_notes = $${params.length + 1}`);
      params.push(resolutionNotes || '');
      updateFields.push(`resolved_at = CURRENT_TIMESTAMP`);
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
          `Your issue status has been updated to ${status}.`,
          JSON.stringify({ issueId: id, issueNumber: issue.issue_number })
        ]
      );
    }

    await logAudit(req.user!.id, 'UPDATE_ISSUE_STATUS', 'ISSUE', id as string, { status, resolution }, req.ip);

    res.json({ success: true, message: `Issue status updated to ${status}` });
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

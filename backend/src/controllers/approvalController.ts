import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/db';
import { logger } from '../utils/logger';

// Helper to generate readable request number (e.g. REQ-2026-8491)
const generateRequestNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${year}-${rand}`;
};

/**
 * GET /api/approvals
 * Fetch all approval requests with optional filters
 */
export const getApprovals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const specialRole = (req.user?.specialRole || '').toUpperCase();

    const { status, category, search } = req.query;

    let queryText = `
      SELECT a.*, u.email as submitter_email
      FROM approval_requests a
      LEFT JOIN users u ON a.submitted_by_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role-based visibility scoping: Mentors, Directors, HR, Accounts, Admins, Super Admins can view pending departmental reviews & approvals
    const userRoleUpper = (userRole || '').toUpperCase();
    const isExecutiveOrReviewer =
      userRoleUpper === 'SUPER_ADMIN' ||
      userRoleUpper === 'ADMIN' ||
      userRoleUpper === 'MENTOR' ||
      userRoleUpper === 'DIRECTOR' ||
      userRoleUpper === 'HR' ||
      userRoleUpper === 'ACCOUNTS' ||
      specialRole.includes('PRINCIPAL') ||
      specialRole.includes('DIRECTOR') ||
      specialRole.includes('MENTOR') ||
      specialRole.includes('HR') ||
      specialRole.includes('ACCOUNTS');

    if (userRoleUpper !== 'SUPER_ADMIN' && !specialRole.includes('PRINCIPAL')) {
      if (isExecutiveOrReviewer) {
        params.push(userId);
        queryText += ` AND (a.submitted_by_id = $${params.length} OR a.status IN ('PENDING_DEPARTMENTAL_REVIEW', 'FULLY_APPROVED', 'PENDING_PRINCIPAL_APPROVAL', 'CHANGES_REQUESTED', 'REJECTED'))`;
      } else {
        // Standard Faculty sees requests submitted by them
        params.push(userId);
        queryText += ` AND a.submitted_by_id = $${params.length}`;
      }
    }

    if (status) {
      params.push(status);
      queryText += ` AND a.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      queryText += ` AND a.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (a.title ILIKE $${params.length} OR a.request_number ILIKE $${params.length} OR a.department ILIKE $${params.length} OR a.submitted_by_name ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY a.updated_at DESC`;

    const result = await query(queryText, params);
    return res.json({ success: true, data: result.rows });
  } catch (error: any) {
    logger.error('Error fetching approval requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch approval requests', error: error.message });
  }
};

/**
 * GET /api/approvals/:id
 * Fetch single approval request with comment thread
 */
export const getApprovalById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reqResult = await query(
      `SELECT a.*, u.email as submitter_email, u.phone as submitter_phone
       FROM approval_requests a
       LEFT JOIN users u ON a.submitted_by_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (reqResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    const requestData = reqResult.rows[0];

    const commentsResult = await query(
      `SELECT c.*, u.special_role as author_special_role
       FROM approval_request_comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.request_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...requestData,
        comments: commentsResult.rows
      }
    });
  } catch (error: any) {
    logger.error('Error fetching approval request by ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch approval request details', error: error.message });
  }
};

/**
 * POST /api/approvals
 * Submit new requisition (HOD)
 */
export const createApproval = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || 'HOD / Faculty';
    const { title, category, description, amount, department } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ success: false, message: 'Title, category, and description are required.' });
    }

    const reqNumber = generateRequestNumber();
    const reqDept = department || req.user?.department || 'General Department';

    const insertResult = await query(
      `INSERT INTO approval_requests (
        request_number, title, category, description, amount, department, submitted_by_id, submitted_by_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_PRINCIPAL_APPROVAL')
      RETURNING *`,
      [reqNumber, title, category, description, amount || 0, reqDept, userId, userName]
    );

    const newReq = insertResult.rows[0];

    // Initial submission comment
    await query(
      `INSERT INTO approval_request_comments (request_id, author_id, author_name, author_role, comment, stage)
       VALUES ($1, $2, $3, $4, $5, 'HOD_SUBMISSION')`,
      [newReq.id, userId, userName, 'HOD', `Requisition created and submitted to Principal for approval.`]
    );

    // Notify Super Admin / Principal
    await query(
      `INSERT INTO notifications (recipient_id, title, message, type)
       SELECT id, 'New Requisition Submitted', $1, 'APPROVAL'
       FROM users WHERE role = 'SUPER_ADMIN'`,
      [`HOD ${userName} submitted requisition ${reqNumber}: ${title}`]
    );

    return res.status(201).json({ success: true, message: 'Requisition submitted to Principal successfully', data: newReq });
  } catch (error: any) {
    logger.error('Error creating approval request:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit requisition', error: error.message });
  }
};

/**
 * POST /api/approvals/:id/principal-action
 * Principal (Super Admin) approves, requests changes (with comment), or rejects
 */
export const principalAction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'
    const userId = req.user?.id;
    const userName = req.user?.name || 'Principal';
    const userRole = req.user?.role;
    const specialRole = (req.user?.specialRole || '').toUpperCase();

    // Verify Principal / Super Admin authorization
    if (userRole !== 'SUPER_ADMIN' && !specialRole.includes('PRINCIPAL')) {
      return res.status(403).json({ success: false, message: 'Access denied: Only Principal (Super Admin) can perform Principal actions.' });
    }

    if (!['APPROVE', 'REQUEST_CHANGES', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be APPROVE, REQUEST_CHANGES, or REJECT.' });
    }

    if (action === 'REQUEST_CHANGES' && (!comments || !comments.trim())) {
      return res.status(400).json({ success: false, message: 'Comment is required when requesting changes.' });
    }

    const checkReq = await query(`SELECT * FROM approval_requests WHERE id = $1`, [id]);
    if (checkReq.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    const currentReq = checkReq.rows[0];
    let newStatus = currentReq.status;
    let commentStage = 'PRINCIPAL_ACTION';
    let actionNotice = '';

    if (action === 'APPROVE') {
      newStatus = 'PENDING_DEPARTMENTAL_REVIEW';
      commentStage = 'PRINCIPAL_APPROVED';
      actionNotice = `Principal approved the requisition. Moved to HR, Director, and Accounts Department for review.`;
    } else if (action === 'REQUEST_CHANGES') {
      newStatus = 'CHANGES_REQUESTED';
      commentStage = 'PRINCIPAL_CHANGES_REQUESTED';
      actionNotice = `Principal requested changes: ${comments}`;
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
      commentStage = 'PRINCIPAL_REJECTED';
      actionNotice = `Principal rejected the requisition. Reason: ${comments || 'N/A'}`;
    }

    // Update request
    await query(
      `UPDATE approval_requests
       SET status = $1, principal_comments = $2, principal_action_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newStatus, comments || actionNotice, id]
    );

    // Record comment
    await query(
      `INSERT INTO approval_request_comments (request_id, author_id, author_name, author_role, comment, stage)
       VALUES ($1, $2, $3, 'PRINCIPAL', $4, $5)`,
      [id, userId, userName, comments ? `[Principal Decision: ${action}] ${comments}` : actionNotice, commentStage]
    );

    // Send notification to submitter HOD
    await query(
      `INSERT INTO notifications (recipient_id, title, message, type)
       VALUES ($1, $2, $3, 'APPROVAL')`,
      [currentReq.submitted_by_id, `Principal Decision: ${action}`, `Requisition ${currentReq.request_number} status updated to ${newStatus}.`]
    );

    // If approved by Principal, notify Directors, HR, Accounts, and Mentors for departmental review
    if (action === 'APPROVE') {
      await query(
        `INSERT INTO notifications (recipient_id, title, message, type)
         SELECT id, 'Requisition Pending Departmental Review', $1, 'APPROVAL'
         FROM users
         WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'DIRECTOR', 'HR', 'ACCOUNTS')
            OR UPPER(COALESCE(special_role, '')) LIKE '%DIRECTOR%'
            OR UPPER(COALESCE(special_role, '')) LIKE '%HR%'
            OR UPPER(COALESCE(special_role, '')) LIKE '%ACCOUNTS%'`,
        [`Requisition ${currentReq.request_number} (${currentReq.title}) was approved by Principal and is now ready for Director / HR / Accounts review.`]
      );
    }

    return res.json({ success: true, message: `Principal action '${action}' recorded successfully.`, status: newStatus });
  } catch (error: any) {
    logger.error('Error processing Principal action:', error);
    return res.status(500).json({ success: false, message: 'Failed to process Principal action', error: error.message });
  }
};

/**
 * PUT /api/approvals/:id/resubmit
 * HOD modifies & resubmits request after Principal requested changes
 */
export const resubmitApproval = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || 'HOD';
    const { title, category, description, amount, resubmissionNotes } = req.body;

    const checkReq = await query(`SELECT * FROM approval_requests WHERE id = $1`, [id]);
    if (checkReq.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    const currentReq = checkReq.rows[0];
    if (currentReq.submitted_by_id !== userId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the original submitter can resubmit this request.' });
    }

    const updatedTitle = title || currentReq.title;
    const updatedCategory = category || currentReq.category;
    const updatedDesc = description || currentReq.description;
    const updatedAmount = amount !== undefined ? amount : currentReq.amount;

    await query(
      `UPDATE approval_requests
       SET title = $1, category = $2, description = $3, amount = $4, status = 'PENDING_PRINCIPAL_APPROVAL', updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [updatedTitle, updatedCategory, updatedDesc, updatedAmount, id]
    );

    // Record resubmission comment
    await query(
      `INSERT INTO approval_request_comments (request_id, author_id, author_name, author_role, comment, stage)
       VALUES ($1, $2, $3, 'HOD', $4, 'HOD_RESUBMISSION')`,
      [id, userId, userName, `[HOD Resubmission] ${resubmissionNotes || 'Updated requisition details based on Principal comments and resubmitted for approval.'}`]
    );

    // Notify Principal
    await query(
      `INSERT INTO notifications (recipient_id, title, message, type)
       SELECT id, 'Requisition Resubmitted', $1, 'APPROVAL'
       FROM users WHERE role = 'SUPER_ADMIN'`,
      [`Requisition ${currentReq.request_number} has been revised and resubmitted by ${userName}.`]
    );

    return res.json({ success: true, message: 'Requisition revised and resubmitted to Principal successfully.' });
  } catch (error: any) {
    logger.error('Error resubmitting approval request:', error);
    return res.status(500).json({ success: false, message: 'Failed to resubmit request', error: error.message });
  }
};

/**
 * POST /api/approvals/:id/department-action
 * HR, Director, or Accounts Department reviewer adds comments and sign-off
 */
export const departmentAction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { departmentRole, action, comments } = req.body; // departmentRole: 'HR' | 'DIRECTOR' | 'ACCOUNTS', action: 'APPROVED' | 'NEEDS_INFO'
    const userId = req.user?.id;
    const userName = req.user?.name || `${departmentRole} Reviewer`;

    if (!['HR', 'DIRECTOR', 'ACCOUNTS'].includes(departmentRole)) {
      return res.status(400).json({ success: false, message: 'Invalid department role. Must be HR, DIRECTOR, or ACCOUNTS.' });
    }

    if (!comments || !comments.trim()) {
      return res.status(400).json({ success: false, message: 'Comments are required for departmental review.' });
    }

    const checkReq = await query(`SELECT * FROM approval_requests WHERE id = $1`, [id]);
    if (checkReq.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    let updateColStatus = '';
    let updateColComments = '';
    let updateColTime = '';

    if (departmentRole === 'HR') {
      updateColStatus = 'hr_status';
      updateColComments = 'hr_comments';
      updateColTime = 'hr_action_at';
    } else if (departmentRole === 'DIRECTOR') {
      updateColStatus = 'director_status';
      updateColComments = 'director_comments';
      updateColTime = 'director_action_at';
    } else if (departmentRole === 'ACCOUNTS') {
      updateColStatus = 'accounts_status';
      updateColComments = 'accounts_comments';
      updateColTime = 'accounts_action_at';
    }

    const statusVal = action === 'APPROVED' ? 'APPROVED' : 'NEEDS_INFO';

    await query(
      `UPDATE approval_requests
       SET ${updateColStatus} = $1, ${updateColComments} = $2, ${updateColTime} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [statusVal, comments, id]
    );

    // Insert comment entry
    await query(
      `INSERT INTO approval_request_comments (request_id, author_id, author_name, author_role, comment, stage)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, userName, departmentRole, `[${departmentRole} Review: ${statusVal}] ${comments}`, `${departmentRole}_REVIEW`]
    );

    // Re-query to check if HR, Director, and Accounts all approved
    const refreshReq = await query(`SELECT * FROM approval_requests WHERE id = $1`, [id]);
    const r = refreshReq.rows[0];

    let isFullyApproved = false;
    if (r.hr_status === 'APPROVED' && r.director_status === 'APPROVED' && r.accounts_status === 'APPROVED') {
      isFullyApproved = true;
      await query(`UPDATE approval_requests SET status = 'FULLY_APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    }

    return res.json({
      success: true,
      message: `${departmentRole} review recorded.`,
      isFullyApproved
    });
  } catch (error: any) {
    logger.error('Error processing departmental review:', error);
    return res.status(500).json({ success: false, message: 'Failed to process departmental review', error: error.message });
  }
};

/**
 * POST /api/approvals/:id/comments
 * Add general comment to discussion thread
 */
export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || 'User';
    const userRole = req.user?.specialRole || req.user?.role || 'Staff';

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
    }

    const insertResult = await query(
      `INSERT INTO approval_request_comments (request_id, author_id, author_name, author_role, comment, stage)
       VALUES ($1, $2, $3, $4, $5, 'GENERAL')
       RETURNING *`,
      [id, userId, userName, userRole, comment]
    );

    return res.status(201).json({ success: true, message: 'Comment added', data: insertResult.rows[0] });
  } catch (error: any) {
    logger.error('Error adding approval comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};

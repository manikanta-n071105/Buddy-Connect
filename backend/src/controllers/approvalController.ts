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
    const userRole = (req.user?.role || '').toUpperCase();
    const specialRole = (req.user?.specialRole || req.user?.special_role || '').toUpperCase();

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
       SET title = $1, category = $2, description = $3, amount = $4, status = 'PENDING_PRINCIPAL_APPROVAL',
           hr_status = NULL, director_status = NULL, accounts_status = NULL,
           hr_comments = NULL, director_comments = NULL, accounts_comments = NULL,
           updated_at = CURRENT_TIMESTAMP
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

    const userRoleUpper = (req.user?.role || '').toUpperCase();
    const specialRole = (req.user?.specialRole || req.user?.special_role || '').toUpperCase();

    const isAllowed =
      userRoleUpper === 'SUPER_ADMIN' ||
      userRoleUpper === 'ADMIN' ||
      userRoleUpper === departmentRole ||
      specialRole.includes(departmentRole) ||
      (departmentRole === 'DIRECTOR' && (userRoleUpper === 'MENTOR' || specialRole.includes('MENTOR')));

    if (!isAllowed) {
      return res.status(403).json({ success: false, message: `Access denied: You do not have permission to sign off for ${departmentRole}.` });
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

/**
 * POST /api/approvals/:id/report
 * Submit Post-Event Outcome & Completion Report with photos
 */
export const saveCompletionReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || 'HOD / Submitter';

    const checkReq = await query(`SELECT * FROM approval_requests WHERE id = $1`, [id]);
    if (checkReq.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    const currentReq = checkReq.rows[0];
    if (currentReq.submitted_by_id !== userId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the original submitter or Super Admin can submit the completion report.' });
    }

    const {
      reportSummary,
      reportOutcomes,
      reportParticipantsCount,
      reportEventDate,
      reportActualExpenditure,
      reportPhotos,
      reportCustomTitle,
      reportCustomHeading
    } = req.body;

    const photosJson = JSON.stringify(reportPhotos || []);

    await query(
      `UPDATE approval_requests
       SET report_summary = $1,
           report_outcomes = $2,
           report_participants_count = $3,
           report_event_date = $4,
           report_actual_expenditure = $5,
           report_photos = $6::jsonb,
           report_custom_title = $7,
           report_custom_heading = $8,
           report_submitted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        reportSummary,
        reportOutcomes,
        reportParticipantsCount,
        reportEventDate,
        reportActualExpenditure || 0,
        photosJson,
        reportCustomTitle || null,
        reportCustomHeading || null,
        id
      ]
    );

    // Record audit log comment
    await query(
      `INSERT INTO approval_request_comments (request_id, author_id, author_name, author_role, comment, stage)
       VALUES ($1, $2, $3, 'HOD', $4, 'EVENT_REPORT_SUBMITTED')`,
      [id, userId, userName, `[Post-Event Report Submitted] HOD submitted the formal event completion report with ${(reportPhotos || []).length} photo(s).`]
    );

    return res.json({ success: true, message: 'Post-event completion report with photos saved successfully.' });
  } catch (error: any) {
    logger.error('Error saving event completion report:', error);
    return res.status(500).json({ success: false, message: 'Failed to save completion report', error: error.message });
  }
};

/**
 * POST /api/approvals/generate-report-ai
 * Uses Gemini AI API (with smart fallback) to generate a ~300-word Executive Summary and Key Outcomes based on user notes & event details
 */
export const generateReportAI = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, department, category, description, userNotes, eventDate, participantsCount } = req.body;

    const titleStr = title?.trim() || 'Academic & Technical Activity';
    const deptStr = department?.trim() || 'Engineering';
    const catStr = category?.trim() || 'Academic Program';
    const descStr = description?.trim() || '';
    const dateStr = eventDate || 'recently';
    const countStr = participantsCount || '145 Participants';
    
    // Filter out previous generated boilerplate & strip expenditure/budget details
    let cleanNotes = (userNotes || '').trim();
    if (cleanNotes.startsWith('The Department of') || cleanNotes.length > 400) {
      cleanNotes = '';
    }

    // Strip out any financial expenditure, budget, TA/DA, or honorarium lines from cleanNotes
    cleanNotes = cleanNotes
      .replace(/Estimated\s+Expenditure[\s\S]*?(Financial\s+Assistance|Note\s+on|$)/gi, '')
      .replace(/Financial\s+Assistance\s+Sought[\s\S]*?(Expected|Note|$)/gi, '')
      .replace(/TA\s*&\s*DA[\s\S]*?\n/gi, '')
      .replace(/Honorarium[\s\S]*?\n/gi, '')
      .replace(/Total\s+Expenditure[\s\S]*?\n/gi, '')
      .replace(/Rs\.?\s*\d+/gi, '')
      .replace(/₹\s*\d+/gi, '')
      .trim();

    // Extract clean topic and speaker info from description or title (stripping raw list labels like 1. Organizing Secretary)
    const extractTopicAndSpeaker = (t: string, desc: string) => {
      let topic = '';
      let speaker = '';

      // Check description for "Note on Importance:"
      const importanceMatch = (desc || '').match(/Note\s+on\s+Importance\s*:\s*([^.\n]+)/i);
      if (importanceMatch && importanceMatch[1]) {
        topic = importanceMatch[1].replace(/essential|for|first|year|students|foundational|growth/gi, '').trim();
      }

      // Check description for "Resource Person:"
      const speakerMatch = (desc || '').match(/Resource\s+Person\s*:\s*([^.\n\d]+)/i);
      if (speakerMatch && speakerMatch[1]) {
        speaker = speakerMatch[1].trim();
      }

      // Check title if topic not clean
      if (!topic || topic.length < 3 || /^\d{2}\s+[A-Za-z]+\s+\d{4}$/.test(topic)) {
        topic = (t || '')
          .replace(/APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING ONE DAY GUEST PROGRAM ON/gi, '')
          .replace(/APPLICATION FOR FINANCIAL ASSISTANCE FOR CONDUCTING/gi, '')
          .replace(/APPLICATION FOR FINANCIAL ASSISTANCE FOR/gi, '')
          .replace(/APPLICATION FOR/gi, '')
          .replace(/ONE DAY GUEST PROGRAM ON/gi, '')
          .replace(/GUEST PROGRAM ON/gi, '')
          .replace(/WORKSHOP ON/gi, '')
          .replace(/SEMINAR ON/gi, '')
          .replace(/FDP ON/gi, '')
          .replace(/\b\d{1,2}\s+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4}\b/gi, '')
          .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '')
          .trim();
      }

      // Sanitize topic to remove prefix clutter (e.g. "Guest Lecture on ", "   -")
      if (topic) {
        topic = topic
          .replace(/^Guest\s+Lecture\s+on\s+/gi, '')
          .replace(/^FDP\s+on\s+/gi, '')
          .replace(/^Workshop\s+on\s+/gi, '')
          .replace(/^Seminar\s+on\s+/gi, '')
          .replace(/^Program\s+on\s+/gi, '')
          .replace(/\s*-\s*$/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (!topic || topic.length < 3 || /^\d{2}\s+[A-Za-z]+\s+\d{4}$/.test(topic)) {
        topic = 'Physics & Engineering Applications';
      }

      return { topic, speaker };
    };

    const { topic: topicFocus, speaker: speakerName } = extractTopicAndSpeaker(titleStr, descStr);

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    let aiSuccess = false;
    let executiveSummary = '';
    let keyOutcomes = '';

    if (geminiKey && geminiKey.trim().length > 5) {
      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      
      for (const modelName of modelsToTry) {
        if (aiSuccess) break;
        try {
          const prompt = `You are an experienced HOD / faculty member at Sanskrithi School of Engineering writing an official post-event outcome report.
Write in a clear, natural, human tone — exactly like a real person describing a successful campus event in plain, professional English.

=== EVENT DETAILS ===
Program Title: ${titleStr}
Topic Focus: ${topicFocus}
Speaker / Resource Person: ${speakerName || 'Domain Expert'}
Department: ${deptStr}
Category: ${catStr}
Execution Date: ${dateStr}
Attendance: ${countStr}
Faculty Notes: "${cleanNotes || 'Interactive session with guest speaker lectures, live demonstrations, and student Q&A.'}"

=== HUMAN WRITING STYLE GUIDELINES ===
- Write like a real person describing what happened at the event, why it was valuable for students, and how the session went.
- Do NOT use robotic AI buzzwords or stiff template clichés (avoid phrases like "Conceptualized under the framework", "aligned with autonomous benchmarks", or echoing topic titles in quotes multiple times).
- Paragraph 1: State what event was held, who organized it, and what subject was covered naturally.
- Paragraph 2: Describe what took place during the session, speaker presentations, student interaction, and Q&A.
- Paragraph 3: Mention attendee numbers (${countStr}), the event date (${dateStr}), and how students benefited overall.
- Key Outcomes: Write 4 natural, clear, bullet-point sentences (1., 2., 3., 4.) explaining what students learned and gained.
- Do NOT include any financial expenditure, budget amounts, honorarium, TA/DA, costs, or money references anywhere.

=== FORMAT INSTRUCTIONS ===
Write a unique report formatted as JSON (no markdown formatting or code block quotes):
{
  "executiveSummary": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3",
  "keyOutcomes": "1. Natural human key outcome 1\\n2. Natural human key outcome 2\\n3. Natural human key outcome 3\\n4. Natural human key outcome 4"
}`;

          const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.85 }
            })
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const responseText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (responseText) {
              const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (parsed.executiveSummary && parsed.keyOutcomes) {
                executiveSummary = parsed.executiveSummary;
                keyOutcomes = parsed.keyOutcomes;
                aiSuccess = true;
              }
            }
          }
        } catch (geminiErr) {
          logger.warn(`Gemini model ${modelName} call warning:`, geminiErr);
        }
      }
    }

    // Dynamic Synthesis Engine (used if Gemini Key is absent or network fails)
    if (!aiSuccess) {
      const combinedText = `${titleStr} ${descStr} ${cleanNotes}`.toLowerCase();

      let eventType = 'guest session';
      if (combinedText.includes('workshop')) eventType = 'interactive workshop';
      else if (combinedText.includes('fdp') || combinedText.includes('faculty')) eventType = 'Faculty Development Program (FDP)';
      else if (combinedText.includes('visit') || combinedText.includes('industrial')) eventType = 'industrial field visit';
      else if (combinedText.includes('hackathon') || combinedText.includes('contest')) eventType = 'technical hackathon';
      else if (combinedText.includes('conference') || combinedText.includes('seminar')) eventType = 'seminar';

      // Seed for multi-pattern structural variation
      const seed = Math.floor(Math.random() * 4);

      // Human-style Paragraph 1 Variations
      const p1Pool = [
        `The ${deptStr} Department at Sanskrithi School of Engineering recently organized a ${eventType} on ${topicFocus} for our students. The main objective was to give students real-world technical exposure alongside their regular coursework.`,
        `We conducted an interactive ${eventType} on ${topicFocus} for the ${deptStr} Department at Sanskrithi School of Engineering. This event gave students and faculty a great opportunity to explore practical engineering applications firsthand.`,
        `The ${deptStr} Department at Sanskrithi School of Engineering hosted a ${eventType} focused on ${topicFocus}. It was organized to help students connect theoretical principles with actual industry practices.`,
        `Sanskrithi School of Engineering's ${deptStr} Department organized a specialized ${eventType} on ${topicFocus}. The program focused on building analytical skills and giving students practical insights into modern technical tools.`
      ];
      const p1 = p1Pool[seed % p1Pool.length];

      // Human-style Paragraph 2 Variations
      let p2 = '';
      if (cleanNotes && cleanNotes.length > 5) {
        const cleanNotesFormatted = cleanNotes.endsWith('.') ? cleanNotes : cleanNotes + '.';
        const p2NotesPool = [
          `During the event, ${cleanNotesFormatted} The speaker shared practical case studies and demonstrated real-world workflows. Students stayed involved throughout, asking questions during the Q&A session and discussing key takeaways.`,
          `Session Highlights: ${cleanNotesFormatted} The speaker walked through core concepts and practical examples. Students gained clear insights through interactive problem-solving and open Q&A discussions on ${topicFocus}.`,
          `Event Highlights: ${cleanNotesFormatted} The interactive setup allowed participating students and faculty to discuss live demonstrations, tool sets, and practical applications in ${topicFocus} directly with the speaker.`,
          `Detailed Proceedings: ${cleanNotesFormatted} The presentation covered structured technical modules and live demonstrations. Attendees actively participated in Q&A segments, gaining a clearer picture of real-world implementation.`
        ];
        p2 = p2NotesPool[seed % p2NotesPool.length];
      } else if (speakerName) {
        p2 = `Our resource person, ${speakerName}, led the session and covered key aspects of ${topicFocus}. The presentation blended core concepts with live demonstrations. Students engaged actively, asked thoughtful questions, and gained practical clarity during the open Q&A.`;
      } else {
        p2 = `The session included detailed presentations and practical demonstrations on ${topicFocus}. Resource speakers walked through real-world case studies, and students participated actively during the Q&A session.`;
      }

      // Human-style Paragraph 3 Variations
      const p3Pool = [
        `The program took place on ${dateStr} with ${countStr} attending. Feedback from students was very positive, with many highlighting how helpful the practical examples were for their learning.`,
        `In total, ${countStr} participated in the event on ${dateStr}. Overall feedback was excellent, and the session helped boost student confidence and interest in ${topicFocus}.`,
        `Conducted on ${dateStr}, the session saw great turnout with ${countStr}. It proved to be a valuable learning experience that helped students connect classroom learning with practical application.`,
        `With ${countStr} attending on ${dateStr}, the event delivered strong learning value. The active Q&A session gave students a clear path for applying ${topicFocus} concepts in their academic and project work.`
      ];
      const p3 = p3Pool[seed % p3Pool.length];

      executiveSummary = `${p1}\n\n${p2}\n\n${p3}`;

      // Human-style Key Outcomes
      const o1 = cleanNotes.length > 10
        ? `1. Gained a clear understanding of core concepts in ${topicFocus}: ${cleanNotes.slice(0, 110)}${cleanNotes.length > 110 ? '...' : ''}.`
        : `1. Gained a clear understanding of core concepts and principles in ${topicFocus}.`;

      const o2 = `2. Saw practical examples and real-world engineering applications firsthand.`;

      const o3 = speakerName
        ? `3. Interacted directly with ${speakerName} to discuss career guidance and academic opportunities in ${deptStr}.`
        : `3. Interacted directly with domain experts to discuss career pathways and industry expectations in ${deptStr}.`;

      const o4 = `4. Strong student participation and positive feedback from ${countStr} on ${dateStr}.`;

      keyOutcomes = `${o1}\n${o2}\n${o3}\n${o4}`;
    }

    return res.json({
      success: true,
      data: {
        executiveSummary,
        keyOutcomes,
        usedGemini: aiSuccess
      }
    });
  } catch (error: any) {
    logger.error('Error generating AI report content:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI report content', error: error.message });
  }
};


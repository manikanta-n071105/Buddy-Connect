import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getApprovals,
  getApprovalById,
  createApproval,
  principalAction,
  resubmitApproval,
  departmentAction,
  addComment,
  saveCompletionReport,
  generateReportAI
} from '../controllers/approvalController';

const router = Router();

// Public AI generation for standalone public report tool
router.post('/public-generate-report-ai', generateReportAI);

router.use(authenticate);

// Fetch all approval requests
router.get('/', getApprovals);

// Generate Gemini AI Report content (Executive Summary & Key Outcomes)
router.post('/generate-report-ai', generateReportAI);

// Fetch single request by ID with comment thread
router.get('/:id', getApprovalById);

// Submit new requisition (HOD)
router.post('/', createApproval);

// Principal (Super Admin) decision (Approve / Request Changes / Reject)
router.post('/:id/principal-action', principalAction);

// HOD resubmits modified request
router.put('/:id/resubmit', resubmitApproval);

// Departmental review (HR, Director, Accounts) sign-off and comment
router.post('/:id/department-action', departmentAction);

// Add general comment to discussion thread
router.post('/:id/comments', addComment);

// Save Post-Event Outcome & Completion Report with photos (HOD)
router.post('/:id/report', saveCompletionReport);

export default router;

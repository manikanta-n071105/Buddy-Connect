import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getApprovals,
  getApprovalById,
  createApproval,
  principalAction,
  resubmitApproval,
  departmentAction,
  addComment
} from '../controllers/approvalController';

const router = Router();

router.use(authenticate);

// Fetch all approval requests
router.get('/', getApprovals);

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

export default router;

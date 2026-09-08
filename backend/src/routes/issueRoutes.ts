import { Router } from 'express';
import { getCategories, createIssue, getIssues, getIssueById, updateIssueStatus, addComment } from '../controllers/issueController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/categories', getCategories);
router.get('/', getIssues);
router.post('/', createIssue);
router.get('/:id', getIssueById);
router.patch('/:id/status', updateIssueStatus);
router.post('/:id/comments', addComment);

export default router;

import { Router } from 'express';
import { getCategories, createIssue, getIssues, getIssueById, updateIssueStatus, updateVotingScope, addComment, submitVote } from '../controllers/issueController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/categories', getCategories);
router.get('/', getIssues);
router.post('/', createIssue);
router.get('/:id', getIssueById);
router.patch('/:id/status', updateIssueStatus);
router.patch('/:id/voting-scope', updateVotingScope);
router.post('/:id/comments', addComment);
router.post('/:id/vote', submitVote);

export default router;

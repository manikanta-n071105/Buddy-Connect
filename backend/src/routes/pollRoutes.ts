import { Router } from 'express';
import { getPolls, createPoll, votePoll, deletePoll } from '../controllers/pollController';
import { authenticate, authorizePermission, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getPolls);
router.post('/', authorizePermission('MANAGE_POLLS'), createPoll);
router.post('/:pollId/vote', authorizeRole('JUNIOR'), votePoll);
router.delete('/:pollId', authorizePermission('MANAGE_POLLS'), deletePoll);

export default router;

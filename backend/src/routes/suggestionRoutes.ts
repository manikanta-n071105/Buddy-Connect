import { Router } from 'express';
import { getSuggestions, createSuggestion, toggleSuggestionVote, updateSuggestionStatus } from '../controllers/suggestionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSuggestions);
router.post('/', createSuggestion);
router.post('/:id/vote', toggleSuggestionVote);
router.patch('/:id/status', updateSuggestionStatus);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { submitCrFeedback, getCrMyFeedbacks, getAllCrFeedbacks } from '../controllers/crFeedbackController';

const router = Router();

router.use((req, res, next) => authenticate(req as any, res, next));

router.post('/', submitCrFeedback);
router.get('/my', getCrMyFeedbacks);
router.get('/admin', getAllCrFeedbacks);

export default router;

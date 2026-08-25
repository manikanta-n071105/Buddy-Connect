import { Router } from 'express';
import {
  getOnboardingProgress,
  createOnboardingItem,
  toggleOnboardingItem,
  getQuestions,
  createCommonQuestion,
  submitQuestionResponse
} from '../controllers/onboardingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/progress', getOnboardingProgress);
router.post('/items', createOnboardingItem);
router.post('/item/:itemId', toggleOnboardingItem);
router.get('/questions', getQuestions);
router.post('/questions/create', createCommonQuestion);
router.post('/questions', submitQuestionResponse);

export default router;

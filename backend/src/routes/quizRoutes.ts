import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth';
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResults,
  reconductQuiz
} from '../controllers/quizController';

const router = Router();

router.use(authenticate);

router.post('/', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'FACULTY'), createQuiz);
router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.post('/:id/submit', authorizeRole('JUNIOR', 'SENIOR'), submitQuiz);
router.get('/:id/results', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'FACULTY'), getQuizResults);
router.post('/:id/reconduct', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'FACULTY'), reconductQuiz);

export default router;

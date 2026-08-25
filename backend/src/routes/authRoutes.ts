import { Router } from 'express';
import { login, getMe, changePassword, refreshToken } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

export default router;

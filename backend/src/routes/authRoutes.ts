import { Router } from 'express';
import { login, getMe, changePassword, refreshToken } from '../controllers/authController';
import { setup2FA, verifySetup2FA, disable2FA } from '../controllers/twoFactorController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

// Google Authenticator 2FA Routes
router.get('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify-setup', authenticate, verifySetup2FA);
router.post('/2fa/disable', authenticate, disable2FA);

export default router;

import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', authorizeRole('SUPER_ADMIN'), updateSettings);

export default router;

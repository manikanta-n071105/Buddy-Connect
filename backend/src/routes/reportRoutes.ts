import { Router } from 'express';
import { getDashboardStats } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard-stats', getDashboardStats);

export default router;

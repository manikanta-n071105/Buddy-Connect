import { Router } from 'express';
import { getDashboardStats, getDetailedIssuesReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard-stats', getDashboardStats);
router.get('/issues-report', getDetailedIssuesReport);

export default router;

import { Router } from 'express';
import { 
  getDashboardStats, 
  getDetailedIssuesReport,
  getConsolidatedReportStatus,
  downloadConsolidatedReport,
  regenerateConsolidatedReport,
  uploadAndConsolidateZip,
  getDepartmentSubmissions,
  clearDepartmentSubmissions,
  uploadDepartmentReport,
  generateConsolidatedReportFromSubmissions,
  downloadDepartmentReport
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public / Standalone routes for HODs and Super Admin (NO LOGIN REQUIRED)
router.get('/consolidated-status', getConsolidatedReportStatus);
router.get('/download-consolidated', downloadConsolidatedReport);
router.post('/regenerate-consolidated', regenerateConsolidatedReport);
router.post('/upload-and-consolidate', uploadAndConsolidateZip);

// HOD Submission & Live Super Admin Consolidation Routes
router.get('/department-submissions', getDepartmentSubmissions);
router.delete('/department-submissions', clearDepartmentSubmissions);
router.post('/clear-department-submissions', clearDepartmentSubmissions);
router.post('/upload-department-report', uploadDepartmentReport);
router.post('/generate-from-submissions', generateConsolidatedReportFromSubmissions);
router.get('/download-department/:id', downloadDepartmentReport);

router.use(authenticate);

router.get('/dashboard-stats', getDashboardStats);
router.get('/issues-report', getDetailedIssuesReport);

export default router;


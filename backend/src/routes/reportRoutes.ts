import { Router } from 'express';
import { 
  getDashboardStats, 
  getDetailedIssuesReport,
  getConsolidatedReportStatus,
  downloadConsolidatedReport,
  downloadConsolidatedPDF,
  generateConsolidatedLatexPDF,
  saveConsolidatedPDF,
  regenerateConsolidatedReport,
  uploadAndConsolidateZip,
  getDepartmentSubmissions,
  clearDepartmentSubmissions,
  uploadDepartmentReport,
  uploadAutoMapReport,
  generateConsolidatedReportFromSubmissions,
  downloadDepartmentReport,
  generateManualDepartmentReport,
  saveDepartmentJson,
  saveDepartmentDraft,
  getDepartmentReportData,
  getAllDepartmentReportData,
  syncSeptemberSeed
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Monthly Institutional & Departmental Report Routes (Accessible without login, fully End-to-End Encrypted)
router.get('/consolidated-status', getConsolidatedReportStatus);
router.get('/download-consolidated', downloadConsolidatedReport);
router.get('/download-consolidated-pdf', downloadConsolidatedPDF);
router.post('/generate-consolidated-pdf', generateConsolidatedLatexPDF);
router.post('/save-consolidated-pdf', saveConsolidatedPDF);
router.post('/regenerate-consolidated', regenerateConsolidatedReport);
router.post('/upload-and-consolidate', uploadAndConsolidateZip);
router.get('/sync-seed', syncSeptemberSeed);
router.post('/sync-seed', syncSeptemberSeed);

// HOD & Committee Submission & Live Super Admin Consolidation Routes (Dedicated Report Database, E2EE Encrypted)
router.get('/department-submissions', getDepartmentSubmissions);
router.delete('/department-submissions', clearDepartmentSubmissions);
router.post('/clear-department-submissions', clearDepartmentSubmissions);
router.post('/upload-department-report', uploadDepartmentReport);
router.post('/upload-auto-map', uploadAutoMapReport);
router.post('/generate-manual-report', generateManualDepartmentReport);
router.post('/save-department-json', saveDepartmentJson);
router.post('/save-department-draft', saveDepartmentDraft);
router.get('/department-report-data', getDepartmentReportData);
router.get('/all-department-report-data', getAllDepartmentReportData);
router.post('/generate-from-submissions', generateConsolidatedReportFromSubmissions);
router.get('/download-department/:id', downloadDepartmentReport);

// Internal administrative analytics (Authentication Required)
router.get('/dashboard-stats', authenticate, getDashboardStats);
router.get('/issues-report', authenticate, getDetailedIssuesReport);

export default router;


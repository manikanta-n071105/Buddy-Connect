import { Router } from 'express';
import {
  getHealth,
  getPortalDiagnosis,
  runBenchmarkTest,
  runIntegrityCheck,
  updateSystemSetting,
  resetPoolConnections,
  triggerSlaCheck,
  runDatabaseAnalyze
} from '../controllers/healthController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Health Check Endpoints
router.get('/ping', getHealth);
router.get('/health', getHealth);

// Diagnosis Telemetry Endpoints (Support both /diagnosis and root /)
router.get('/', (req, res, next) => {
  if (req.baseUrl.includes('diagnosis')) {
    return getPortalDiagnosis(req, res);
  }
  return getHealth(req, res);
});
router.get('/diagnosis', getPortalDiagnosis);

// Benchmark Endpoints
router.post('/benchmark', authenticate, runBenchmarkTest);
router.post('/diagnosis/benchmark', authenticate, runBenchmarkTest);

// Database Integrity Audit Endpoints
router.post('/integrity', authenticate, runIntegrityCheck);
router.post('/diagnosis/integrity', authenticate, runIntegrityCheck);

// System Settings Update Endpoints
router.put('/settings', authenticate, updateSystemSetting);
router.put('/diagnosis/settings', authenticate, updateSystemSetting);

// Connection Pool Reset Endpoints
router.post('/reset-pool', authenticate, resetPoolConnections);
router.post('/diagnosis/reset-pool', authenticate, resetPoolConnections);

// SLA Escalation Trigger Endpoints
router.post('/trigger-sla', authenticate, triggerSlaCheck);
router.post('/diagnosis/trigger-sla', authenticate, triggerSlaCheck);

// DB Analyze Endpoints
router.post('/analyze', authenticate, runDatabaseAnalyze);
router.post('/diagnosis/analyze', authenticate, runDatabaseAnalyze);

export default router;

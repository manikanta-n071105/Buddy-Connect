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

router.get('/', getHealth);
router.get('/health', getHealth);
router.get('/diagnosis', getPortalDiagnosis);
router.post('/diagnosis/benchmark', authenticate, runBenchmarkTest);
router.post('/diagnosis/integrity', authenticate, runIntegrityCheck);
router.put('/diagnosis/settings', authenticate, updateSystemSetting);
router.post('/diagnosis/reset-pool', authenticate, resetPoolConnections);
router.post('/diagnosis/trigger-sla', authenticate, triggerSlaCheck);
router.post('/diagnosis/analyze', authenticate, runDatabaseAnalyze);

export default router;



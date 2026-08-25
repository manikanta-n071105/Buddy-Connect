import { Router } from 'express';
import { getHierarchyTree, transferJunior, assignTemporaryMentor } from '../controllers/hierarchyController';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/tree', getHierarchyTree);
router.post('/transfer-junior', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR'), transferJunior);
router.post('/temp-mentor', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR'), assignTemporaryMentor);

export default router;

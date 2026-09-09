import { Router } from 'express';
import { getHierarchyTree, transferJunior, assignTemporaryMentor } from '../controllers/hierarchyController';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/tree', getHierarchyTree);
router.post('/transfer-junior', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), transferJunior);
router.post('/temp-mentor', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'SENIOR'), assignTemporaryMentor);

export default router;

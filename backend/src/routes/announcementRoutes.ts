import { Router } from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcementController';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAnnouncements);
router.post('/', authorizeRole('SUPER_ADMIN'), createAnnouncement);
router.put('/:id', authorizeRole('SUPER_ADMIN'), updateAnnouncement);
router.delete('/:id', authorizeRole('SUPER_ADMIN'), deleteAnnouncement);

export default router;

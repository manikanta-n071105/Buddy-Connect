import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventController';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getEvents);
router.post('/', authorizeRole('SUPER_ADMIN'), createEvent);
router.put('/:id', authorizeRole('SUPER_ADMIN'), updateEvent);
router.delete('/:id', authorizeRole('SUPER_ADMIN'), deleteEvent);

export default router;

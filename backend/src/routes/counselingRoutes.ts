import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  toggleCounselorStatus,
  getCounselorsList,
  bookAppointment,
  getMyAppointments,
  getCounselorAppointments,
  updateAppointmentStatus,
  getAllAppointmentsAdmin
} from '../controllers/counselingController';

const router = Router();

router.use((req, res, next) => authenticate(req as any, res, next));

router.patch('/:userId/counselor-status', toggleCounselorStatus);
router.get('/counselors', getCounselorsList);
router.post('/book', bookAppointment);
router.get('/my', getMyAppointments);
router.get('/counselor-requests', getCounselorAppointments);
router.patch('/:id/status', updateAppointmentStatus);
router.get('/admin', getAllAppointmentsAdmin);

export default router;

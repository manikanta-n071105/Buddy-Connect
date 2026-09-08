import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDailyMenu,
  updateDailyMenu,
  getHostellerMealRsvp,
  updateMealRsvp,
  getWardenMessSummary
} from '../controllers/messController';

const router = Router();

router.use(authenticate);

router.get('/menu', getDailyMenu);
router.post('/menu', updateDailyMenu);
router.get('/rsvp', getHostellerMealRsvp);
router.post('/rsvp', updateMealRsvp);
router.get('/warden-summary', getWardenMessSummary);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBloodRequests,
  createBloodRequest,
  volunteerForBloodRequest,
  cancelVolunteerPledge,
  cancelBloodRequest,
  updateUserBloodGroup,
  getMyDonations,
  getMyRequests
} from '../controllers/bloodController';

const router = Router();

router.use((req, res, next) => authenticate(req as any, res, next));

// Requests CRUD & listing
router.get('/requests', getBloodRequests as any);
router.post('/requests', createBloodRequest as any);
router.patch('/requests/:id/cancel', cancelBloodRequest as any);

// Volunteering
router.post('/requests/:id/volunteer', volunteerForBloodRequest as any);
router.delete('/requests/:id/volunteer', cancelVolunteerPledge as any);

// User-specific queries
router.get('/my-donations', getMyDonations as any);
router.get('/my-requests', getMyRequests as any);
router.put('/user/blood-group', updateUserBloodGroup as any);

export default router;

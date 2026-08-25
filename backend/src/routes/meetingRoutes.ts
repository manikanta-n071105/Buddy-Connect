import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMeetings,
  createMeeting,
  updateMeetingStatus,
  deleteMeeting
} from '../controllers/meetingController';

const router = Router();

router.use(authenticate);

router.get('/', getMeetings);
router.post('/', createMeeting);
router.patch('/:id/status', updateMeetingStatus);
router.delete('/:id', deleteMeeting);

export default router;

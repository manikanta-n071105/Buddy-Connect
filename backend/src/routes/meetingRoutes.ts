import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMeetings,
  createMeeting,
  updateMeetingStatus,
  deleteMeeting,
  getMeetingMinutes,
  summarizeMeetingHearing,
  saveMeetingMinutes,
  deleteMeetingMinutes
} from '../controllers/meetingController';

const router = Router();

router.use(authenticate);

router.get('/', getMeetings);
router.post('/', createMeeting);
router.patch('/:id/status', updateMeetingStatus);
router.delete('/:id', deleteMeeting);

// Minutes of Meeting (MoM) Endpoints
router.get('/mom', getMeetingMinutes);
router.post('/mom/summarize', summarizeMeetingHearing);
router.post('/mom', saveMeetingMinutes);
router.delete('/mom/:id', deleteMeetingMinutes);

export default router;

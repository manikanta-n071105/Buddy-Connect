import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead, sendSampleNotifications } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.post('/read-all', markAllNotificationsRead);
router.post('/send-sample', sendSampleNotifications);

export default router;

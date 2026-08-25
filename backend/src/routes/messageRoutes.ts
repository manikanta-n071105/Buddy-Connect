import { Router } from 'express';
import { getConversation, getConversationsList, sendMessage } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversationsList);
router.get('/conversation', getConversation);
router.post('/send', sendMessage);

export default router;

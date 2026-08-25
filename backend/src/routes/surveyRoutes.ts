import { Router } from 'express';
import { getSurveys, getSurveyDetails, submitSurvey, getSupportIndicators } from '../controllers/surveyController';
import { authenticate, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getSurveys);
router.get('/support-indicators', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR'), getSupportIndicators);
router.get('/:id', getSurveyDetails);
router.post('/:id/submit', submitSurvey);

export default router;

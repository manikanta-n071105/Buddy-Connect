import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getExams,
  createExamWithAllocation,
  getExamDetails,
  togglePublishExam,
  deleteExam,
  getMySeat,
  getInvigilationDuties,
  markHallAttendance,
  assignInvigilator,
  logMalpracticeIncident
} from '../controllers/examSeatingController';

const router = Router();

router.use(authenticate);

// Student Lookup Endpoint
router.get('/my-seat', getMySeat);

// Invigilation Duty Endpoints
router.get('/invigilation', getInvigilationDuties);
router.post('/invigilation/attendance', markHallAttendance);
router.post('/invigilators/assign', assignInvigilator);
router.post('/malpractice', logMalpracticeIncident);

// Exam Seating Engine Endpoints (Controller of Examinations / Admin)
router.get('/exams', getExams);
router.post('/exams', createExamWithAllocation);
router.get('/exams/:id', getExamDetails);
router.post('/exams/:id/publish', togglePublishExam);
router.delete('/exams/:id', deleteExam);

export default router;

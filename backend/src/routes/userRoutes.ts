import { Router } from 'express';
import { 
  createAdmin, createMentor, createFaculty, createSenior, createJunior, createStudent, createWarden, bulkCreateJuniors,
  getUsers, getMentorsList, getSeniorsList, getFacultyList, getFacultyAssignedJuniors,
  assignJuniorToFaculty, unassignJuniorFromFaculty, updateFacultyCapacity, updateUserFacultyAssignment,
  getUserProfile, lookupUserByQr, updateUserProfile, deleteUser, toggleUserStatus, resetUserPassword, updateUserPermissions,
  getDisciplinaryCommitteeMembers, appointDisciplinaryCommitteeMember, removeDisciplinaryCommitteeMember,
  createDisciplinaryComplaint, getStudentDisciplinaryComplaints, getAllDisciplinaryComplaints, updateDisciplinaryComplaintStatus
} from '../controllers/userController';
import { authenticate, authorizeRole, authorizePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/mentors', getMentorsList);
router.get('/seniors', getSeniorsList);
router.get('/faculty', getFacultyList);
router.get('/faculty/juniors', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'FACULTY'), getFacultyAssignedJuniors);
router.post('/faculty/assign-junior', authorizeRole('SUPER_ADMIN', 'ADMIN'), assignJuniorToFaculty);
router.post('/faculty/unassign-junior', authorizeRole('SUPER_ADMIN', 'ADMIN'), unassignJuniorFromFaculty);
router.put('/faculty/:facultyId/capacity', authorizeRole('SUPER_ADMIN'), updateFacultyCapacity);

router.get('/disciplinary-committee', getDisciplinaryCommitteeMembers);
router.post('/disciplinary-committee/appoint', authorizeRole('SUPER_ADMIN', 'ADMIN'), appointDisciplinaryCommitteeMember);
router.delete('/disciplinary-committee/:userId', authorizeRole('SUPER_ADMIN', 'ADMIN'), removeDisciplinaryCommitteeMember);

router.post('/disciplinary-complaints', createDisciplinaryComplaint);
router.get('/disciplinary-complaints/student/:studentUserId', getStudentDisciplinaryComplaints);
router.get('/disciplinary-complaints/all', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'FACULTY'), getAllDisciplinaryComplaints);
router.patch('/disciplinary-complaints/:id/status', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'FACULTY'), updateDisciplinaryComplaintStatus);

router.post('/bulk-juniors', authorizeRole('SUPER_ADMIN', 'ADMIN'), bulkCreateJuniors);
router.get('/scan-qr', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'FACULTY'), lookupUserByQr);
router.get('/:userId/profile', getUserProfile);
router.put('/:userId', updateUserProfile);
router.delete('/:userId', deleteUser);
router.post('/admin', authorizePermission('CREATE_ADMIN'), createAdmin);
router.post('/mentor', authorizePermission('MANAGE_USERS'), createMentor);
router.post('/warden', authorizeRole('SUPER_ADMIN', 'ADMIN'), createWarden);
router.post('/faculty', authorizeRole('SUPER_ADMIN', 'ADMIN'), createFaculty);
router.post('/senior', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), createSenior);
router.post('/junior', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'SENIOR', 'FACULTY'), createJunior);
router.post('/student', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR', 'SENIOR', 'FACULTY'), createStudent);
router.patch('/:userId/status', authorizePermission('MANAGE_USERS'), toggleUserStatus);
router.post('/:userId/reset-password', authorizePermission('MANAGE_USERS'), resetUserPassword);
router.patch('/:userId/permissions', authorizeRole('SUPER_ADMIN'), updateUserPermissions);
router.patch('/:userId/faculty-assignment', authorizeRole('SUPER_ADMIN', 'ADMIN', 'MENTOR'), updateUserFacultyAssignment);

export default router;

import { Router } from 'express';
import { 
  createAdmin, createDirector, createFaculty, createSenior, createJunior, createStudent, createWarden, bulkCreateJuniors,
  getUsers, getDirectorsList, getSeniorsList, getFacultyList, getFacultyAssignedJuniors,
  assignJuniorToFaculty, unassignJuniorFromFaculty, updateFacultyCapacity, updateUserFacultyAssignment,
  getUserProfile, lookupUserByQr, updateUserProfile, deleteUser, toggleUserStatus, resetUserPassword, updateUserPermissions,
  getDisciplinaryCommitteeMembers, appointDisciplinaryCommitteeMember, removeDisciplinaryCommitteeMember,
  createDisciplinaryComplaint, getStudentDisciplinaryComplaints, getAllDisciplinaryComplaints, updateDisciplinaryComplaintStatus
} from '../controllers/userController';
import { authenticate, authorizeRole, authorizePermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/directors', getDirectorsList);
router.get('/seniors', getSeniorsList);
router.get('/faculty', getFacultyList);
router.get('/faculty/juniors', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'FACULTY'), getFacultyAssignedJuniors);
router.post('/faculty/assign-junior', authorizeRole('SUPER_ADMIN', 'ADMIN'), assignJuniorToFaculty);
router.post('/faculty/unassign-junior', authorizeRole('SUPER_ADMIN', 'ADMIN'), unassignJuniorFromFaculty);
router.put('/faculty/:facultyId/capacity', authorizeRole('SUPER_ADMIN'), updateFacultyCapacity);

router.get('/disciplinary-committee', getDisciplinaryCommitteeMembers);
router.post('/disciplinary-committee/appoint', authorizeRole('SUPER_ADMIN', 'ADMIN'), appointDisciplinaryCommitteeMember);
router.delete('/disciplinary-committee/:userId', authorizeRole('SUPER_ADMIN', 'ADMIN'), removeDisciplinaryCommitteeMember);

router.post('/disciplinary-complaints', createDisciplinaryComplaint);
router.get('/disciplinary-complaints/student/:studentUserId', getStudentDisciplinaryComplaints);
router.get('/disciplinary-complaints/all', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'FACULTY'), getAllDisciplinaryComplaints);
router.patch('/disciplinary-complaints/:id/status', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'FACULTY'), updateDisciplinaryComplaintStatus);

router.post('/bulk-juniors', authorizeRole('SUPER_ADMIN', 'ADMIN'), bulkCreateJuniors);
router.get('/scan-qr', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'FACULTY'), lookupUserByQr);
router.get('/:userId/profile', getUserProfile);
router.put('/:userId', updateUserProfile);
router.delete('/:userId', deleteUser);
router.post('/admin', authorizePermission('CREATE_ADMIN'), createAdmin);
router.post('/director', authorizePermission('MANAGE_USERS'), createDirector);
router.post('/warden', authorizeRole('SUPER_ADMIN', 'ADMIN'), createWarden);
router.post('/faculty', authorizeRole('SUPER_ADMIN', 'ADMIN'), createFaculty);
router.post('/senior', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR'), createSenior);
router.post('/junior', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR', 'FACULTY'), createJunior);
router.post('/student', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR', 'FACULTY'), createStudent);
router.patch('/:userId/status', authorizePermission('MANAGE_USERS'), toggleUserStatus);
router.post('/:userId/reset-password', authorizePermission('MANAGE_USERS'), resetUserPassword);
router.patch('/:userId/permissions', authorizeRole('SUPER_ADMIN'), updateUserPermissions);
router.patch('/:userId/faculty-assignment', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR'), updateUserFacultyAssignment);

export default router;

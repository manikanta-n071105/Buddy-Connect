import { Router } from 'express';
import { 
  createAdmin, createDirector, createFaculty, createSenior, createJunior, 
  getUsers, getDirectorsList, getSeniorsList, getFacultyList, getFacultyAssignedJuniors,
  assignJuniorToFaculty, unassignJuniorFromFaculty, updateFacultyCapacity,
  getUserProfile, updateUserProfile, deleteUser, toggleUserStatus, resetUserPassword, updateUserPermissions 
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

router.get('/:userId/profile', getUserProfile);
router.put('/:userId', updateUserProfile);
router.delete('/:userId', deleteUser);
router.post('/admin', authorizePermission('CREATE_ADMIN'), createAdmin);
router.post('/director', authorizePermission('MANAGE_USERS'), createDirector);
router.post('/faculty', authorizeRole('SUPER_ADMIN', 'ADMIN'), createFaculty);
router.post('/senior', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR'), createSenior);
router.post('/junior', authorizeRole('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR', 'FACULTY'), createJunior);
router.patch('/:userId/status', authorizePermission('MANAGE_USERS'), toggleUserStatus);
router.post('/:userId/reset-password', authorizePermission('MANAGE_USERS'), resetUserPassword);
router.patch('/:userId/permissions', authorizeRole('SUPER_ADMIN'), updateUserPermissions);

export default router;

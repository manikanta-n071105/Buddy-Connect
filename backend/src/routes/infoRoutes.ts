import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  getCollegeInfo,
  getCampusLocations,
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
} from '../controllers/infoController';
import { authenticate, authorizePermission, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/announcements', getAnnouncements);
router.post('/announcements', authorizePermission('MANAGE_ANNOUNCEMENTS'), createAnnouncement);
router.get('/college', getCollegeInfo);
router.get('/campus', getCampusLocations);

router.get('/emergency', getEmergencyContacts);
router.post('/emergency', authorizePermission('MANAGE_EMERGENCY'), createEmergencyContact);
router.put('/emergency/:id', authorizePermission('MANAGE_EMERGENCY'), updateEmergencyContact);
router.delete('/emergency/:id', authorizePermission('MANAGE_EMERGENCY'), deleteEmergencyContact);

export default router;

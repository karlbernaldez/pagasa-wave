import express from 'express';

import {
  getAllUsers,
  getUserDetails,
  updateUserDetails,
  deleteUser,
  updateUserStatus,
  createUserByAdmin,
  changePassword,
} from '../controllers/userController.js';
import {
  requestEmailChange,
  resendPendingEmailChange,
  cancelPendingEmailChange,
} from '../controllers/emailChangeController.js';
import authenticate from '../middleware/authMiddleware.js';
import { verificationEmailLimiter } from '../middleware/authRateLimits.js';
import { isOwnerOnly } from '../middleware/adminMiddleware.js';
import {
  requirePermission,
  requireSelfOrPermission,
} from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('users.view'), getAllUsers);
router.post('/', requirePermission('users.create'), createUserByAdmin);

router.get('/:userId', requireSelfOrPermission('users.view'), getUserDetails);
router.put('/:userId', requireSelfOrPermission('users.edit'), updateUserDetails);
router.put('/:userId/change-password', isOwnerOnly, changePassword);
router.post(
  '/:userId/email-change/request',
  isOwnerOnly,
  verificationEmailLimiter,
  requestEmailChange
);
router.post(
  '/:userId/email-change/resend',
  isOwnerOnly,
  verificationEmailLimiter,
  resendPendingEmailChange
);
router.delete('/:userId/email-change', isOwnerOnly, cancelPendingEmailChange);
router.put('/:userId/status', requirePermission('users.change_status'), updateUserStatus);
router.delete('/:userId', requirePermission('users.delete'), deleteUser);

export default router;

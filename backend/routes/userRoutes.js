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
import { isAdmin, isOwnerOnly, isOwnerOrAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', isAdmin, getAllUsers);
router.post('/', isAdmin, createUserByAdmin);

router.get('/:userId', isOwnerOrAdmin, getUserDetails);
router.put('/:userId', isOwnerOrAdmin, updateUserDetails);
router.put('/:userId/change-password', isOwnerOrAdmin, changePassword);
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
router.put('/:userId/status', isAdmin, updateUserStatus);
router.delete('/:userId', isAdmin, deleteUser);

export default router;

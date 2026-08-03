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
import authenticate from '../middleware/authMiddleware.js';
import { isAdmin, isOwnerOrAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', isAdmin, getAllUsers);
router.post('/', isAdmin, createUserByAdmin);

router.get('/:userId', isOwnerOrAdmin, getUserDetails);
router.put('/:userId', isOwnerOrAdmin, updateUserDetails);
router.put('/:userId/change-password', isOwnerOrAdmin, changePassword);
router.put('/:userId/status', isAdmin, updateUserStatus);
router.delete('/:userId', isAdmin, deleteUser);

export default router;

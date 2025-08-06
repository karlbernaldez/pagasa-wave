import express from 'express';
import { getAllUsers, getUserDetails, updateUserDetails, deleteUser } from '../controllers/userController.js';
import { isAdmin, isOwnerOrAdmin, isOwnerOnly } from '../middleware/adminMiddleware.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.get('/', isAdmin, getAllUsers); // Only accessible by admins -- CHECKED PASSED

router.get('/:userId',  authenticateToken, isOwnerOrAdmin, getUserDetails); // Route to get user details -- CHECKED PASSED

router.put('/:userId', authenticateToken, isOwnerOrAdmin, updateUserDetails); // Route to update user details -- CHECKED PASSED

// Route to delete user
router.delete('/:userId', authenticateToken, isAdmin, deleteUser); // Optional: protect delete user as well -- CHECKED PASSED

export default router;

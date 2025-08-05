import express from 'express';
import { getAllUsers, getUserDetails, updateUserDetails, deleteUser } from '../controllers/userController.js';
import { isAdmin, isOwnerOrAdmin, isOwnerOnly } from '../middleware/adminMiddleware.js'; // Import the isAdmin middleware
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.get('/', isAdmin, getAllUsers); // Only accessible by admins

// Route to get user details
router.get('/:userId', isOwnerOrAdmin, authenticateToken, getUserDetails);

// Route to update user details
router.put('/:userId', updateUserDetails);

// Route to delete user
router.delete('/:userId', isAdmin, deleteUser); // Optional: protect delete user as well

export default router;

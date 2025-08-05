import express from 'express';
import {authenticateToken} from '../middleware/authenticateToken.js';
import { registerUser, loginUser, refreshAccessToken, logoutUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/refresh-token', refreshAccessToken);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/check', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

export default router;

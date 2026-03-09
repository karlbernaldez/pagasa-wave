import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { registerUser, loginUser, refreshAccessToken, logoutUser, sendOtp, verifyOtp } from '#controllers/auth/index';

const router = express.Router();

router.post('/refresh-token', (req, res) => { refreshAccessToken(req, res);});
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.get('/check', authenticateToken, (req, res) => {
  // console.log('✅ /check route hit with user:', req.user);
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

export default router;

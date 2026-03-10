import express from 'express';

import { authenticateToken } from '../middleware/authenticateToken.js';

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  sendOtp,
  verifyOtp,
  verifyEmail,
  resendVerification,
} from '#controllers/auth/index';

const router = express.Router();

router.post('/refresh-token', (req, res) => {
  refreshAccessToken(req, res);
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

/* OTP */
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

/* Email verification */
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

router.get('/check', authenticateToken, (req, res) => {
  res.status(200).json({
    message: 'Authenticated',
    user: req.user
  });
});

export default router;
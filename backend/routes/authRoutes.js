import express from 'express';

import authenticate from '../middleware/authMiddleware.js';
import {
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  refreshLimiter,
  registrationLimiter,
  verificationEmailLimiter,
} from '../middleware/authRateLimits.js';

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  sendOtp,
  verifyOtp,
  verifyEmail,
  resendVerification,
} from '#controllers/auth/index';

const router = express.Router();

router.post('/refresh-token', refreshLimiter, refreshAccessToken);
router.post('/register', registrationLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/logout-all', authenticate, logoutAllDevices);

router.post('/otp/send', otpSendLimiter, sendOtp);
router.post('/otp/verify', otpVerifyLimiter, verifyOtp);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', verificationEmailLimiter, resendVerification);

router.get('/check', authenticate, (req, res) => {
  res.status(200).json({
    message: 'Authenticated',
    user: {
      id: req.user.id,
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
  });
});

export default router;

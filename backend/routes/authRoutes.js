import express from 'express';

import authenticate from '../middleware/authMiddleware.js';

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

router.post('/refresh-token', refreshAccessToken);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

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

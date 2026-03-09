import bcrypt from 'bcryptjs';

import User from '../../models/User.js';
import { MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS } from '#controllers/auth/constants/auth';
import { normalizeEmail } from '#controllers/auth/utils/validators';
import { getStatusError } from './_helpers.js';
import { markCredentialsVerified, generateAndStoreOtp } from './otp.js';
import { sendOtpEmail } from '#controllers/auth/sendOtpEmail';

export const loginUser = async (req, res) => {
  try {
    const emailNorm = normalizeEmail(req.body.email);
    const password  = req.body.password || '';

    if (!emailNorm || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: emailNorm }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── Auto-unlock if the lock window has elapsed ───────────────────────────
    if (user.lockUntil && user.lockUntil <= Date.now()) {
      user.lockUntil           = null;
      user.failedLoginAttempts = 0;
      if (user.status === 'locked') user.status = 'active';
      await user.save();
    }

    // ── Hard-lock check ──────────────────────────────────────────────────────
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message:   'Account locked. Try again later.',
        lockUntil: user.lockUntil,
      });
    }

    // ── Status gate ──────────────────────────────────────────────────────────
    const statusError = getStatusError(user.status);
    if (statusError) {
      return res.status(403).json({ message: statusError });
    }

    // ── Credential check ─────────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      const attemptsLeft = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.status    = 'locked';
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await user.save();
        return res.status(403).json({
          message:   'Account locked due to multiple failed login attempts.',
          lockUntil: user.lockUntil,
        });
      }

      await user.save();

      let message = 'Invalid email or password.';
      if (attemptsLeft <= 3) {
        message = `${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} remaining before account lock.`;
      }

      return res.status(401).json({ message, attemptsLeft });
    }

    // ── Credentials valid — open OTP window, generate & send code ────────────
    await markCredentialsVerified(emailNorm);

    const otp = await generateAndStoreOtp(emailNorm);
    await sendOtpEmail(emailNorm, otp, user.firstName ?? user.username);

    return res.status(200).json({
      message:     'Credentials verified. OTP sent to your email.',
      otpRequired: true,
    });

  } catch (err) {
    console.error('[loginUser]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
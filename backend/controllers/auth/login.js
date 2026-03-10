import bcrypt from 'bcryptjs';

import User from '../../models/User.js';
import { MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS } from '#controllers/auth/constants/auth';
import { normalizeEmail } from '#controllers/auth/utils/validators';
import { getStatusError } from './_helpers.js';
import { markCredentialsVerified, generateAndStoreOtp, isTrustedDevice } from './otp.js';
import { issueTokens } from './_helpers.js';
import { sendOtpEmail } from '#services/email/sendOtpEmail';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

// Sanitise and validate the coordinates payload from the client.
// Returns a plain object safe to store, or null if missing/malformed.
const parseCoordinates = (raw) => {
  if (!raw) return null;
  const { latitude: lat, longitude: lng, accuracy } = raw;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180)  return null;
  return {
    lat:       parseFloat(lat.toFixed(6)),
    lng:       parseFloat(lng.toFixed(6)),
    accuracyM: typeof accuracy === 'number' ? Math.round(accuracy) : null,
  };
};

export const loginUser = async (req, res) => {
  try {
    const emailNorm   = normalizeEmail(req.body.email);
    const password    = req.body.password || '';
    const coordinates = parseCoordinates(req.body.coordinates); // null if denied/absent

    if (!emailNorm || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Shared meta block — appended to every audit log in this request
    const geoMeta = coordinates ? { geo: coordinates } : {};

    const user = await User.findOne({ email: emailNorm, deletedAt: null }).select(
      '+password status role emailVerified lockUntil failedLoginAttempts firstName username lastLoginIP lastLoginUserAgent'
    );

    // ── Unknown email ────────────────────────────────────────────────────────
    if (!user) {
      logger.warn('Login attempt for unknown email', { email: emailNorm, ip: req.ip });
      await createAuditLog({
        user: null, action: 'login_failed', resourceType: 'User', resourceId: null,
        ip: req.ip, userAgent: req.headers['user-agent'],
        meta: { reason: 'Unknown email', email: emailNorm, ...geoMeta },
      }).catch((e) => logger.error('Audit log failed', { error: e.message }));

      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ── Auto-unlock ──────────────────────────────────────────────────────────
    if (!user.isLocked() && user.lockUntil !== null) {
      user.lockUntil = null;
      user.failedLoginAttempts = 0;
      if (user.status === 'locked') user.status = 'active';
      await user.save();
    }

    // ── Hard-lock check ──────────────────────────────────────────────────────
    if (user.isLocked()) {
      logger.warn('Login attempt on locked account', { userId: user._id, ip: req.ip });
      await createAuditLog({
        user: user._id, action: 'login_blocked', resourceType: 'User', resourceId: user._id,
        ip: req.ip, userAgent: req.headers['user-agent'],
        meta: { reason: 'Account locked', lockUntil: user.lockUntil, ...geoMeta },
      }).catch((e) => logger.error('Audit log failed', { error: e.message }));

      return res.status(403).json({ message: 'Account locked. Try again later.', lockUntil: user.lockUntil });
    }

    // ── Status gate ──────────────────────────────────────────────────────────
    const statusError = getStatusError(user.status);
    if (statusError) {
      logger.warn('Login attempt on non-active account', { userId: user._id, status: user.status, ip: req.ip });
      await createAuditLog({
        user: user._id, action: 'login_blocked', resourceType: 'User', resourceId: user._id,
        ip: req.ip, userAgent: req.headers['user-agent'],
        meta: { reason: 'Account status gate', status: user.status, ...geoMeta },
      }).catch((e) => logger.error('Audit log failed', { error: e.message }));

      return res.status(403).json({ message: statusError });
    }

    // ── Email verification gate ──────────────────────────────────────────────
    if (!user.emailVerified) {
      logger.warn('Login attempt with unverified email', { userId: user._id, ip: req.ip });
      await createAuditLog({
        user: user._id, action: 'login_blocked', resourceType: 'User', resourceId: user._id,
        ip: req.ip, userAgent: req.headers['user-agent'],
        meta: { reason: 'Email not verified', ...geoMeta },
      }).catch((e) => logger.error('Audit log failed', { error: e.message }));

      return res.status(403).json({ message: 'Please verify your email before logging in.' });
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

        logger.warn('Account locked after max failed attempts', { userId: user._id, ip: req.ip });
        await createAuditLog({
          user: user._id, action: 'account_locked', resourceType: 'User', resourceId: user._id,
          ip: req.ip, userAgent: req.headers['user-agent'],
          meta: { reason: 'Max failed attempts', failedLoginAttempts: user.failedLoginAttempts, ...geoMeta },
        }).catch((e) => logger.error('Audit log failed', { error: e.message }));

        return res.status(403).json({
          message: 'Account locked due to multiple failed login attempts.',
          lockUntil: user.lockUntil,
        });
      }

      await user.save();
      logger.warn('Failed login attempt', { userId: user._id, attemptsLeft, ip: req.ip });
      await createAuditLog({
        user: user._id, action: 'login_failed', resourceType: 'User', resourceId: user._id,
        ip: req.ip, userAgent: req.headers['user-agent'],
        meta: { reason: 'Wrong password', failedLoginAttempts: user.failedLoginAttempts, attemptsLeft, ...geoMeta },
      }).catch((e) => logger.error('Audit log failed', { error: e.message }));

      let message = 'Invalid email or password.';
      if (attemptsLeft <= 3) {
        message = `${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} remaining before account lock.`;
      }
      return res.status(401).json({ message, attemptsLeft });
    }

    // ── Credentials valid — reset counters ───────────────────────────────────
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const currentIP = req.ip;
    const currentUA = req.headers['user-agent'] ?? '';

    // ── Trusted device — skip OTP ────────────────────────────────────────────
    if (isTrustedDevice(currentIP, currentUA, user.lastLoginIP, user.lastLoginUserAgent)) {
      logger.info('Trusted device detected — skipping OTP', { userId: user._id, ip: currentIP });

      user.lastLogin          = new Date();
      user.lastLoginIP        = currentIP;
      user.lastLoginUserAgent = currentUA;
      if (coordinates) user.lastLoginLocation = coordinates; // ← persist to User model
      await user.save();

      await createAuditLog({
        user: user._id, action: 'login_success', resourceType: 'User', resourceId: user._id,
        ip: currentIP, userAgent: currentUA,
        meta: { note: 'OTP skipped — trusted device', ...geoMeta },
      }).catch((e) => logger.error('Audit log failed', { error: e.message }));

      await issueTokens(user, req, res);
      return res.status(200).json({
        user: {
          id: user._id, username: user.username, firstName: user.firstName,
          lastName: user.lastName, email: user.email, role: user.role,
          lastLogin: user.lastLogin, status: user.status,
        },
        trustedDevice: true,
      });
    }

    // ── Unknown device — send OTP ────────────────────────────────────────────
    await markCredentialsVerified(emailNorm);
    const otp = await generateAndStoreOtp(emailNorm);
    await sendOtpEmail(emailNorm, otp, user.firstName ?? user.username);

    logger.info('OTP sent after credential verification', { userId: user._id, ip: currentIP });
    await createAuditLog({
      user: user._id, action: 'login_otp_sent', resourceType: 'User', resourceId: user._id,
      ip: currentIP, userAgent: currentUA,
      meta: { note: 'Credentials verified, awaiting OTP', ...geoMeta },
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return res.status(200).json({
      message: 'Credentials verified. OTP sent to your email.',
      otpRequired: true,
    });

  } catch (err) {
    logger.error('[loginUser] Unhandled error', { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Server error.' });
  }
};
import bcrypt from 'bcryptjs';

import { MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS } from '#controllers/auth/constants/auth';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const lockAccount = async (user) => {
  user.status    = 'locked';
  user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  await user.save();
};

const buildAttemptsMessage = (attemptsLeft) => {
  if (attemptsLeft > 3) return 'Invalid email or password.';
  return `${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} remaining before account lock.`;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Verify the password. On mismatch, increment the failure counter, lock the
 * account if the threshold is reached, and return a ready-to-send response.
 *
 * @returns {Response|null} A response to send if auth failed, otherwise null.
 */
export const verifyCredentials = async (user, password, req, res, geoMeta) => {
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) return null;

  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  const attemptsLeft = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;

  // ── Max attempts reached → lock ──────────────────────────────────────────
  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    await lockAccount(user);

    logger.warn('Account locked after max failed attempts', { userId: user._id, ip: req.ip });

    await createAuditLog({
      user: user._id, action: 'account_locked', resourceType: 'User', resourceId: user._id,
      ip: req.ip, userAgent: req.headers['user-agent'],
      meta: { reason: 'Max failed attempts', failedLoginAttempts: user.failedLoginAttempts, ...geoMeta },
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return res.status(403).json({
      message:   'Account locked due to multiple failed login attempts.',
      lockUntil: user.lockUntil,
    });
  }

  // ── Wrong password, attempts remaining ───────────────────────────────────
  await user.save();

  logger.warn('Failed login attempt', { userId: user._id, attemptsLeft, ip: req.ip });

  await createAuditLog({
    user: user._id, action: 'login_failed', resourceType: 'User', resourceId: user._id,
    ip: req.ip, userAgent: req.headers['user-agent'],
    meta: { reason: 'Wrong password', failedLoginAttempts: user.failedLoginAttempts, attemptsLeft, ...geoMeta },
  }).catch((e) => logger.error('Audit log failed', { error: e.message }));

  return res.status(401).json({ message: buildAttemptsMessage(attemptsLeft), attemptsLeft });
};

/**
 * Clear the failed-attempt counter after a successful credential check.
 * Only writes to DB if there is actually something to reset.
 */
export const resetFailedAttempts = async (user) => {
  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.lockUntil           = null;
    await user.save();
  }
};
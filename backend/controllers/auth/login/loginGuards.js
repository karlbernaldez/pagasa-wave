import { getStatusError } from '../_helpers.js';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

/**
 * If the lock window has expired, clear it.
 * Mutates `user` and persists. No-op if still locked or was never locked.
 */
export const autoUnlockIfExpired = async (user) => {
  if (!user.isLocked() && user.lockUntil !== null) {
    user.lockUntil           = null;
    user.failedLoginAttempts = 0;
    if (user.status === 'locked') user.status = 'active';
    await user.save();
  }
};

/**
 * Returns a 403 response if the account is hard-locked, otherwise null.
 */
export const rejectIfLocked = async (user, req, res, geoMeta) => {
  if (!user.isLocked()) return null;

  logger.warn('Login attempt on locked account', { userId: user._id, ip: req.ip });

  await createAuditLog({
    user: user._id, action: 'login_blocked', resourceType: 'User', resourceId: user._id,
    ip: req.ip, userAgent: req.headers['user-agent'],
    meta: { reason: 'Account locked', lockUntil: user.lockUntil, ...geoMeta },
  }).catch((e) => logger.error('Audit log failed', { error: e.message }));

  return res.status(403).json({
    message:   'Account locked. Try again later.',
    lockUntil: user.lockUntil,
  });
};

/**
 * Returns a 403 response if the account status is not active, otherwise null.
 */
export const rejectIfBadStatus = async (user, req, res, geoMeta) => {
  const statusError = getStatusError(user.status);
  if (!statusError) return null;

  logger.warn('Login attempt on non-active account', {
    userId: user._id, status: user.status, ip: req.ip,
  });

  await createAuditLog({
    user: user._id, action: 'login_blocked', resourceType: 'User', resourceId: user._id,
    ip: req.ip, userAgent: req.headers['user-agent'],
    meta: { reason: 'Account status gate', status: user.status, ...geoMeta },
  }).catch((e) => logger.error('Audit log failed', { error: e.message }));

  return res.status(403).json({ message: statusError });
};

/**
 * Returns a 403 response if the user's email is not verified, otherwise null.
 */
export const rejectIfEmailUnverified = async (user, req, res, geoMeta) => {
  if (user.emailVerified) return null;

  logger.warn('Login attempt with unverified email', { userId: user._id, ip: req.ip });

  await createAuditLog({
    user: user._id, action: 'login_blocked', resourceType: 'User', resourceId: user._id,
    ip: req.ip, userAgent: req.headers['user-agent'],
    meta: { reason: 'Email not verified', ...geoMeta },
  }).catch((e) => logger.error('Audit log failed', { error: e.message }));

  return res.status(403).json({ message: 'Please verify your email before logging in.' });
};

/**
 * Run all pre-credential guards in sequence.
 * Returns the first non-null response object, or null if all pass.
 */
export const runLoginGuards = async (user, req, res, geoMeta) => {
  await autoUnlockIfExpired(user);

  return (
    (await rejectIfLocked(user, req, res, geoMeta)) ??
    (await rejectIfBadStatus(user, req, res, geoMeta)) ??
    (await rejectIfEmailUnverified(user, req, res, geoMeta))
  );
};
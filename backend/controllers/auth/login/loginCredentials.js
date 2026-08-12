import bcrypt from 'bcryptjs';

import { MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS } from '#controllers/auth/constants/auth';
import User from '#models/User';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildAttemptsMessage = (attemptsLeft) => {
  if (attemptsLeft > 3) return 'Invalid email or password.';
  return `${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} remaining before account lock.`;
};

export const recordFailedLogin = async (userId) => {
  const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);

  return User.findOneAndUpdate(
    { _id: userId, deletedAt: null },
    [
      {
        $set: {
          failedLoginAttempts: {
            $cond: [
              { $eq: ['$status', 'active'] },
              { $add: [{ $ifNull: ['$failedLoginAttempts', 0] }, 1] },
              '$failedLoginAttempts',
            ],
          },
        },
      },
      {
        $set: {
          status: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gte: ['$failedLoginAttempts', MAX_FAILED_ATTEMPTS] },
                ],
              },
              'locked',
              '$status',
            ],
          },
          lockUntil: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gte: ['$failedLoginAttempts', MAX_FAILED_ATTEMPTS] },
                ],
              },
              lockUntil,
              '$lockUntil',
            ],
          },
          sessionVersion: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gte: ['$failedLoginAttempts', MAX_FAILED_ATTEMPTS] },
                ],
              },
              { $add: [{ $ifNull: ['$sessionVersion', 0] }, 1] },
              '$sessionVersion',
            ],
          },
        },
      },
    ],
    { new: true }
  );
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Verify the password. On mismatch, atomically increment the failure counter,
 * lock the account if the threshold is reached, and return a ready-to-send response.
 *
 * @returns {Response|null} A response to send if auth failed, otherwise null.
 */
export const verifyCredentials = async (user, password, req, res, geoMeta) => {
  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) return null;

  const failedUser = await recordFailedLogin(user._id);

  if (!failedUser) {
    logger.warn('Failed login could not update account state', { userId: user._id, ip: req.ip });
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const failedLoginAttempts = failedUser.failedLoginAttempts || 0;
  const attemptsLeft = Math.max(MAX_FAILED_ATTEMPTS - failedLoginAttempts, 0);

  if (failedUser.status === 'locked') {
    logger.warn('Account locked after max failed attempts', { userId: user._id, ip: req.ip });

    await createAuditLog({
      user: user._id,
      action: 'account_locked',
      resourceType: 'User',
      resourceId: user._id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { reason: 'Max failed attempts', failedLoginAttempts, ...geoMeta },
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return res.status(403).json({
      message: 'Account locked due to multiple failed login attempts.',
      lockUntil: failedUser.lockUntil,
    });
  }

  if (failedUser.status !== 'active') {
    logger.warn('Failed login raced with account status change', {
      userId: user._id,
      status: failedUser.status,
      ip: req.ip,
    });
    return res.status(403).json({ message: 'Account is not available for login.' });
  }

  logger.warn('Failed login attempt', { userId: user._id, attemptsLeft, ip: req.ip });

  await createAuditLog({
    user: user._id,
    action: 'login_failed',
    resourceType: 'User',
    resourceId: user._id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    meta: { reason: 'Wrong password', failedLoginAttempts, attemptsLeft, ...geoMeta },
  }).catch((e) => logger.error('Audit log failed', { error: e.message }));

  return res.status(401).json({ message: buildAttemptsMessage(attemptsLeft), attemptsLeft });
};

/**
 * Clear stale failure metadata after a correct password without saving the
 * caller's whole User snapshot. A concurrent lock/suspension wins the race.
 */
export const resetFailedAttempts = async (user) => {
  if (user.failedLoginAttempts <= 0 && user.lockUntil === null) return;

  await User.updateOne(
    {
      _id: user._id,
      deletedAt: null,
      status: 'active',
    },
    {
      $set: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    }
  );

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
};

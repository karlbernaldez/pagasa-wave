import bcrypt from 'bcryptjs';

import User from '#models/User';
import { normalizeEmail } from '#controllers/auth/utils/validators';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

import { parseCoordinates } from './utils/parseCoordinates.js';
import { autoUnlockIfExpired, runLoginGuards } from './loginGuards.js';
import { verifyCredentials, resetFailedAttempts } from './loginCredentials.js';
import { handleSession } from './loginSession.js';

const USER_FIELDS =
  '+password +sessionVersion status role emailVerified lockUntil failedLoginAttempts ' +
  'firstName username lastLoginIP lastLoginUserAgent';

const dummyPasswordHashPromise = bcrypt.hash('wavelab-invalid-login-placeholder', 10);

export const loginUser = async (req, res) => {
  try {
    const emailNorm = normalizeEmail(req.body.email);
    const password = req.body.password || '';
    const coordinates = parseCoordinates(req.body.coordinates);

    if (!emailNorm || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const geoMeta = coordinates ? { geo: coordinates } : {};

    const user = await User.findOne({ email: emailNorm, deletedAt: null }).select(USER_FIELDS);

    if (!user) {
      // Perform a real bcrypt comparison so unknown-email and wrong-password
      // requests have similar computational cost and are harder to enumerate by timing.
      const dummyPasswordHash = await dummyPasswordHashPromise;
      await bcrypt.compare(password, dummyPasswordHash);

      logger.warn('Login attempt for unknown email', { email: emailNorm, ip: req.ip });

      await createAuditLog({
        user: null,
        action: 'login_failed',
        resourceType: 'User',
        resourceId: null,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { reason: 'Unknown email', email: emailNorm, ...geoMeta },
      }).catch((e) => logger.error('Audit log failed', { error: e.message }));

      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    await autoUnlockIfExpired(user);

    const credError = await verifyCredentials(user, password, req, res, geoMeta);
    if (credError) return credError;

    const guardResponse = await runLoginGuards(user, req, res, geoMeta);
    if (guardResponse) return guardResponse;

    await resetFailedAttempts(user);
    return await handleSession(user, emailNorm, coordinates, req, res, geoMeta);
  } catch (err) {
    logger.error('[loginUser] Unhandled error', { error: err.message, stack: err.stack });
    return res.status(500).json({ message: 'Server error.' });
  }
};

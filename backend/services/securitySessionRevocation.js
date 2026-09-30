import Session from '#models/Session';
import TrustedDevice from '#models/TrustedDevice';
import { disconnectUserSockets } from '#socket/sessionControl';
import { logger } from '#utils/logger';

const revokeActiveSessions = (userId, reason, revokedAt) =>
  Session.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt, revokedReason: reason } }
  );

const revokeActiveTrustedDevices = (userId, reason, revokedAt) =>
  TrustedDevice.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt, revokedReason: reason } }
  );

export const revokeUserSecurityState = async (userId, reason) => {
  const revokedAt = new Date();

  const results = await Promise.allSettled([
    revokeActiveSessions(userId, reason, revokedAt),
    revokeActiveTrustedDevices(userId, reason, revokedAt),
  ]);

  disconnectUserSockets(userId);

  results.forEach((result, index) => {
    if (result.status !== 'rejected') return;

    logger.error('Security credential revocation cleanup failed', {
      userId: String(userId),
      credentialType: index === 0 ? 'refresh_session' : 'trusted_device',
      reason,
      error: result.reason?.message || String(result.reason),
    });
  });

  return {
    refreshSessionsRevoked: results[0].status === 'fulfilled',
    trustedDevicesRevoked: results[1].status === 'fulfilled',
  };
};

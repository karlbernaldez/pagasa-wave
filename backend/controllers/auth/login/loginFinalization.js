import User from '#models/User';

/**
 * Persist successful-login metadata only if the account is still eligible to
 * receive a session. Returns the freshly persisted user state used for token
 * issuance, including sessionVersion.
 */
export const finalizeLoginUser = ({ userId, ip, userAgent, coordinates = null }) => {
  const set = {
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: new Date(),
    lastLoginIP: ip,
    lastLoginUserAgent: userAgent,
  };

  if (coordinates) set.lastLoginLocation = coordinates;

  return User.findOneAndUpdate(
    {
      _id: userId,
      deletedAt: null,
      status: 'active',
      emailVerified: true,
    },
    { $set: set },
    { new: true }
  ).select('+sessionVersion');
};

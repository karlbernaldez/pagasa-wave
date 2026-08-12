import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Session from '#models/Session';

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const buildAuthPayload = ({ _id, email, username, role, sessionVersion = 0 }) => ({
  id: _id,
  email,
  username,
  role,
  sessionVersion,
});

export const createSession = async ({ refreshToken, userId, jti, req, familyId = jti }) => {
  const decoded = jwt.decode(refreshToken);
  if (!decoded?.exp) throw new Error('Invalid refresh token: missing expiry claim.');

  return Session.create({
    user: userId,
    jti,
    familyId,
    tokenHash: hashToken(refreshToken),
    userAgent: req.get('user-agent') || '',
    ip: req.ip || '',
    expiresAt: new Date(decoded.exp * 1000),
    revokedAt: null,
  });
};

export const revokeSession = (session, reason = 'revoked') => {
  session.revokedAt = new Date();
  session.revokedReason = reason;
  return session.save();
};

export const revokeSessionByJti = (userId, jti, reason = 'logout') =>
  Session.updateOne(
    { user: userId, jti, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );

export const revokeSessionFamily = (userId, familyId, reason = 'refresh_token_reuse') =>
  Session.updateMany(
    { user: userId, familyId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );

export const markRefreshFamilyCompromised = async (
  userId,
  familyId,
  reason = 'refresh_token_reuse'
) => {
  const compromisedAt = new Date();

  await Session.updateMany(
    { user: userId, familyId },
    { $set: { familyCompromisedAt: compromisedAt } }
  );

  await Session.updateMany(
    { user: userId, familyId, revokedAt: null },
    { $set: { revokedAt: compromisedAt, revokedReason: reason } }
  );

  return compromisedAt;
};

export const isRefreshFamilyCompromised = (userId, familyId) =>
  Session.exists({
    user: userId,
    familyId,
    familyCompromisedAt: { $ne: null },
  });

export const revokeAllUserSessions = (userId, reason = 'logout_all') =>
  Session.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );

export const consumeRefreshSession = async ({ userId, jti, refreshToken, replacementJti }) =>
  Session.findOneAndUpdate(
    {
      user: userId,
      jti,
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: 'rotated',
        replacedByJti: replacementJti,
      },
    },
    { new: false }
  );

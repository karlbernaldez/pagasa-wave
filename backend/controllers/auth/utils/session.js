import crypto from 'crypto';
import jwt    from 'jsonwebtoken';
import Session from '#models/Session';

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

/** One-way hash used for token binding in the Session document. */
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/** Builds the minimal JWT payload from a user document. */
export const buildAuthPayload = ({ _id, email, username, role }) => ({
  id: _id,
  email,
  username,
  role,
});

// ─────────────────────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persists a new Session document tied to the given refresh token.
 *
 * @param {object} opts
 * @param {string}  opts.refreshToken - Raw (signed) refresh JWT
 * @param {*}       opts.userId       - MongoDB ObjectId of the owner
 * @param {string}  opts.jti          - UUID used as the JWT ID
 * @param {Request} opts.req          - Express request (for IP / user-agent)
 */
export const createSession = async ({ refreshToken, userId, jti, req }) => {
  const decoded = jwt.decode(refreshToken);

  if (!decoded?.exp) {
    throw new Error('Invalid refresh token: missing expiry claim.');
  }

  return Session.create({
    user:      userId,
    jti,
    tokenHash: hashToken(refreshToken),
    userAgent: req.get('user-agent') || '',
    ip:        req.ip || '',
    expiresAt: new Date(decoded.exp * 1000),
    revokedAt: null,
  });
};

/**
 * Revokes a single session by setting revokedAt = now.
 * Returns the result of the update operation.
 */
export const revokeSession = (session) => {
  session.revokedAt = new Date();
  return session.save();
};

/**
 * Revokes a session by user + jti without requiring the document to be
 * fetched first (fire-and-forget safe for logout).
 */
export const revokeSessionByJti = (userId, jti) =>
  Session.updateOne(
    { user: userId, jti, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
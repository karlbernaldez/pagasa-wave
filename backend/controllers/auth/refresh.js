import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import User from '../../models/User.js';
import Session from '../../models/Session.js';
import { clearAuthCookies, setAuthCookies } from '#controllers/auth/utils/cookies';
import {
  buildAuthPayload,
  consumeRefreshSession,
  createSession,
  isRefreshFamilyCompromised,
  markRefreshFamilyCompromised,
  revokeSessionFamily,
} from '#controllers/auth/utils/session';
import { getStatusError } from './_helpers.js';
import { generateAccessToken, generateRefreshToken } from '#controllers/auth/utils/jwtUtils';

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    algorithms: ['HS512'],
    clockTolerance: 5,
  });

const JWT_CREDENTIAL_ERROR_NAMES = new Set([
  'JsonWebTokenError',
  'NotBeforeError',
  'TokenExpiredError',
]);

const isJwtCredentialError = (error) => JWT_CREDENTIAL_ERROR_NAMES.has(error?.name);

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required.' });
  }

  let refreshMayBeConsumed = false;

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const { id: userId, jti } = decoded ?? {};

    if (!userId || !jti) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const existingSession = await Session.findOne({ user: userId, jti });

    if (!existingSession) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Refresh session not found.' });
    }

    const familyId = existingSession.familyId || existingSession.jti;

    if (existingSession.revokedAt) {
      refreshMayBeConsumed = true;
      await markRefreshFamilyCompromised(userId, familyId, 'refresh_token_reuse');
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ message: 'Refresh token reuse detected. Session family revoked.' });
    }

    const user = await User.findOne({ _id: userId, deletedAt: null }).select('+sessionVersion');
    const statusError = user ? getStatusError(user.status) : 'User not found.';

    if (statusError) {
      refreshMayBeConsumed = true;
      await revokeSessionFamily(userId, familyId, 'account_unavailable');
      clearAuthCookies(res);
      return res.status(403).json({ message: statusError });
    }

    if ((decoded.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
      refreshMayBeConsumed = true;
      await revokeSessionFamily(userId, familyId, 'session_version_changed');
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session has been revoked.' });
    }

    if (
      decoded.iat &&
      user.passwordChangedAt &&
      decoded.iat * 1000 < user.passwordChangedAt.getTime()
    ) {
      refreshMayBeConsumed = true;
      await revokeSessionFamily(userId, familyId, 'password_changed');
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session expired after password change.' });
    }

    const payload = buildAuthPayload(user);
    const replacementJti = crypto.randomUUID();
    const accessToken = generateAccessToken(payload);
    const replacementRefreshToken = generateRefreshToken(payload, { jwtid: replacementJti });

    refreshMayBeConsumed = true;
    const consumed = await consumeRefreshSession({
      userId,
      jti,
      refreshToken,
      replacementJti,
    });

    if (!consumed) {
      await markRefreshFamilyCompromised(userId, familyId, 'refresh_token_reuse');
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Refresh token already used or expired.' });
    }

    await createSession({
      refreshToken: replacementRefreshToken,
      userId,
      jti: replacementJti,
      familyId,
      req,
    });

    if (await isRefreshFamilyCompromised(userId, familyId)) {
      await Session.updateOne(
        { user: userId, jti: replacementJti, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: 'refresh_token_reuse' } }
      );
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ message: 'Refresh token reuse detected. Session family revoked.' });
    }

    setAuthCookies(res, accessToken, replacementRefreshToken);
    return res.status(200).json({ message: 'Session refreshed.' });
  } catch (error) {
    if (isJwtCredentialError(error)) {
      clearAuthCookies(res);
      return res.status(401).json({
        message:
          error?.name === 'TokenExpiredError' ? 'Refresh token expired.' : 'Invalid refresh token.',
      });
    }

    console.error('[refreshAccessToken] Operational failure:', error);

    if (refreshMayBeConsumed) {
      clearAuthCookies(res);
    }

    return res.status(503).json({
      message: 'Unable to refresh the session right now. Please try again.',
    });
  }
};

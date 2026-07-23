import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import User from '../../models/User.js';
import Session from '../../models/Session.js';
import { clearAuthCookies, setAuthCookies } from '#controllers/auth/utils/cookies';
import {
  buildAuthPayload,
  consumeRefreshSession,
  createSession,
  revokeSessionFamily,
} from '#controllers/auth/utils/session';
import { getStatusError } from './_helpers.js';
import { generateAccessToken, generateRefreshToken } from '#controllers/auth/utils/jwtUtils';

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
  algorithms: ['HS512'],
  clockTolerance: 5,
});

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required.' });
  }

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
      await revokeSessionFamily(userId, familyId, 'refresh_token_reuse');
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Refresh token reuse detected. Session family revoked.' });
    }

    const user = await User.findOne({ _id: userId, deletedAt: null });
    const statusError = user ? getStatusError(user.status) : 'User not found.';

    if (statusError) {
      await revokeSessionFamily(userId, familyId, 'account_unavailable');
      clearAuthCookies(res);
      return res.status(403).json({ message: statusError });
    }

    if (decoded.iat && user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      await revokeSessionFamily(userId, familyId, 'password_changed');
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session expired after password change.' });
    }

    const payload = buildAuthPayload(user);
    const replacementJti = crypto.randomUUID();
    const accessToken = generateAccessToken(payload);
    const replacementRefreshToken = generateRefreshToken(payload, { jwtid: replacementJti });

    const consumed = await consumeRefreshSession({
      userId,
      jti,
      refreshToken,
      replacementJti,
    });

    if (!consumed) {
      await revokeSessionFamily(userId, familyId, 'refresh_token_reuse');
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

    setAuthCookies(res, accessToken, replacementRefreshToken);
    return res.status(200).json({ message: 'Session refreshed.' });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({
      message: error?.name === 'TokenExpiredError'
        ? 'Refresh token expired.'
        : 'Invalid refresh token.',
    });
  }
};

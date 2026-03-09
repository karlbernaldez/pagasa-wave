import jwt from 'jsonwebtoken';

import User    from '../../models/User.js';
import Session from '../../models/Session.js';
import { clearAuthCookies }                from '#controllers/auth/utils/cookies';
import { hashToken, revokeSession }        from '#controllers/auth/utils/session';
import { getStatusError, issueTokens }     from './_helpers.js';

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token found.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { id: userId, jti } = decoded ?? {};

    if (!userId || !jti) {
      return res.status(403).json({ message: 'Invalid refresh token payload.' });
    }

    const session = await Session.findOne({ user: userId, jti, revokedAt: null });

    if (!session) {
      return res.status(403).json({ message: 'Refresh session not found or revoked.' });
    }

    // Token-binding check — revoke immediately on mismatch (token theft signal)
    if (session.tokenHash !== hashToken(refreshToken)) {
      await revokeSession(session);
      return res.status(403).json({ message: 'Refresh token mismatch. Session revoked.' });
    }

    if (session.expiresAt && session.expiresAt <= new Date()) {
      await revokeSession(session);
      return res.status(403).json({ message: 'Refresh session expired.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      await revokeSession(session);
      return res.status(403).json({ message: 'User not found.' });
    }

    const statusError = getStatusError(user.status);
    if (statusError) {
      await revokeSession(session);
      clearAuthCookies(res);
      return res.status(403).json({ message: statusError });
    }

    // Rotate: revoke old session, issue new tokens
    await revokeSession(session);
    const { accessToken } = await issueTokens(user, req, res);

    return res.status(200).json({ accessToken });

  } catch (err) {
    console.error('[refreshAccessToken]', err);
    return res.status(403).json({ message: 'Failed to refresh token.' });
  }
};
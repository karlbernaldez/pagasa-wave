import jwt from 'jsonwebtoken';

import { clearAuthCookies }      from '#controllers/auth/utils/cookies';
import { revokeSessionByJti }    from '#controllers/auth/utils/session';

export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      try {
        const { id, jti } = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (id && jti) await revokeSessionByJti(id, jti);
      } catch {
        // Expired / tampered token: nothing to revoke, proceed with logout
      }
    }

    clearAuthCookies(res);
    return res.status(200).json({ message: 'Logged out successfully.' });

  } catch (err) {
    console.error('[logoutUser]', err);
    return res.status(500).json({ message: 'Failed to log out.' });
  }
};
import jwt from 'jsonwebtoken';

import User from '#models/User';
import { clearAuthCookies } from '#controllers/auth/utils/cookies';
import { revokeAllUserSessions, revokeSessionByJti } from '#controllers/auth/utils/session';

export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const { id, jti } = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
          algorithms: ['HS512'],
          clockTolerance: 5,
        });
        if (id && jti) await revokeSessionByJti(id, jti);
      } catch {
        // Invalid or expired cookies are still cleared locally.
      }
    }

    clearAuthCookies(res);
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch {
    clearAuthCookies(res);
    return res.status(500).json({ message: 'Failed to log out.' });
  }
};

export const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      { $inc: { sessionVersion: 1 } },
      { new: true }
    ).select('+sessionVersion');

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Authentication session is no longer valid.' });
    }

    await revokeAllUserSessions(userId, 'logout_all');
    clearAuthCookies(res);

    return res.status(200).json({ message: 'Logged out from all devices.' });
  } catch {
    clearAuthCookies(res);
    return res.status(500).json({ message: 'Failed to log out from all devices.' });
  }
};

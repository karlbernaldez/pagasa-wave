import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

import User from '#models/User';
import { logger } from '#utils/logger';

const ACCESS_TOKEN_ALGORITHMS = ['HS512'];
const SOCKET_USER_FIELDS = '_id role status passwordChangedAt deletedAt +sessionVersion';

const tokenWasIssuedBeforePasswordChange = (decoded, passwordChangedAt) => {
  if (!decoded?.iat || !passwordChangedAt) return false;
  return decoded.iat * 1000 < new Date(passwordChangedAt).getTime();
};

export const verifySocketSession = async (socket, next) => {
  try {
    const rawCookies = socket.request.headers.cookie ?? '';
    const cookies = parse(rawCookies);
    const token = cookies.accessToken;

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ACCESS_TOKEN_ALGORITHMS,
      clockTolerance: 5,
    });

    if (!decoded?.id) {
      return next(new Error('Unauthorized'));
    }

    const user = await User.findOne({
      _id: decoded.id,
      deletedAt: null,
    }).select(SOCKET_USER_FIELDS);

    if (!user || user.status !== 'active') {
      return next(new Error('Unauthorized'));
    }

    if (tokenWasIssuedBeforePasswordChange(decoded, user.passwordChangedAt)) {
      return next(new Error('Unauthorized'));
    }

    if ((decoded.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
      return next(new Error('Unauthorized'));
    }

    socket.data.userId = String(user._id);
    socket.data.role = user.role;
    socket.data.sessionVersion = user.sessionVersion ?? 0;

    return next();
  } catch (err) {
    logger.warn('[socketAuth] rejected socket session', {
      error: err?.name || err?.message || 'Unauthorized',
    });
    return next(new Error('Unauthorized'));
  }
};

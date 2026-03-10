import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import User from '#models/User';
import { logger } from '#utils/logger';

export const verifySocketSession = async (socket, next) => {
  try {

    const rawCookies = socket.request.headers.cookie ?? '';
    const cookies    = parse(rawCookies);
    const token      = cookies.accessToken;

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('_id role');

    if (!user) {
      return next(new Error('Unauthorized'));
    }

    socket.data.userId = String(user._id);
    socket.data.role   = user.role;

    next();

  } catch (err) {
    logger.error('[socketAuth]', { error: err.message });
    next(new Error('Unauthorized'));
  }
};
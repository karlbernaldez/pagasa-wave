import { logger } from './logger.js';

export const requestLogger = (req, res, next) => {

  logger.info('API Request', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    user: req.user?._id || null,
    userAgent: req.headers['user-agent']
  });

  next();
};
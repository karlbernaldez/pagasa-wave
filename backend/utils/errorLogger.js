import { logger } from './logger.js';

export const errorLogger = (err, req, res, next) => {

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  next(err);
};
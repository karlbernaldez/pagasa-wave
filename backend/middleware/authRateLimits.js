import rateLimit from 'express-rate-limit';

const createLimiter = ({ windowMs, max, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    skipSuccessfulRequests,
    message: { message },
  });

export const loginLimiter = createLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Try again later.',
});

export const registrationLimiter = createLimiter({
  windowMs: 60 * 60_000,
  max: 5,
  message: 'Too many registration attempts. Try again later.',
});

export const otpSendLimiter = createLimiter({
  windowMs: 15 * 60_000,
  max: 5,
  message: 'Too many OTP requests. Try again later.',
});

export const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many invalid OTP attempts. Try again later.',
});

export const refreshLimiter = createLimiter({
  windowMs: 5 * 60_000,
  max: 30,
  message: 'Too many session refresh attempts. Try again later.',
});

export const verificationEmailLimiter = createLimiter({
  windowMs: 60 * 60_000,
  max: 5,
  message: 'Too many verification email requests. Try again later.',
});

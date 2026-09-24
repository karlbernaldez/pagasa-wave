import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_COOKIE_NAME = 'wavelabCsrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';

const secureCookie =
  process.env.NODE_ENV === 'production' ? true : process.env.COOKIE_SECURE === 'true';
const sameSite = String(process.env.COOKIE_SAME_SITE || 'strict').toLowerCase();

if (!['strict', 'lax', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAME_SITE must be strict, lax, or none.');
}

if (sameSite === 'none' && !secureCookie) {
  throw new Error('COOKIE_SAME_SITE=none requires secure cookies.');
}

const csrfCookieOptions = {
  httpOnly: false,
  secure: secureCookie,
  sameSite,
  path: '/',
};

const getCsrfSecret = () => {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CSRF_SECRET or JWT_SECRET must be configured.');
  }
  return secret;
};

const signNonce = (nonce) =>
  createHmac('sha256', getCsrfSecret()).update(nonce).digest('base64url');

const createCsrfToken = () => {
  const nonce = randomBytes(32).toString('base64url');
  return `${nonce}.${signNonce(nonce)}`;
};

const verifySignedCsrfToken = (token) => {
  if (typeof token !== 'string') return false;
  const separator = token.lastIndexOf('.');
  if (separator <= 0 || separator === token.length - 1) return false;

  const nonce = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signNonce(nonce);

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
};

const allowedOrigins = () =>
  process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

const ensureCsrfCookie = (req, res) => {
  const existing = req.cookies?.wavelabCsrfToken;
  if (existing && verifySignedCsrfToken(existing)) return existing;

  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  return token;
};

export const csrfProtection = (req, res, next) => {
  const method = req.method.toUpperCase();

  if (SAFE_METHODS.has(method)) {
    ensureCsrfCookie(req, res);
    return next();
  }

  const origin = req.headers.origin;
  const origins = allowedOrigins();

  if (!origin) {
    return res.status(403).json({ message: 'Origin header required' });
  }

  if (origins.length > 0 && !origins.includes(origin)) {
    return res.status(403).json({ message: 'CSRF protection blocked request' });
  }

  const usesAuthenticatedCookies = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
  if (!usesAuthenticatedCookies) {
    ensureCsrfCookie(req, res);
    return next();
  }

  const csrfCookie = req.cookies?.wavelabCsrfToken;
  const csrfHeader = String(req.headers[CSRF_HEADER_NAME] || '');

  if (
    !csrfCookie ||
    !csrfHeader ||
    req.cookies.wavelabCsrfToken !== csrfHeader ||
    !verifySignedCsrfToken(csrfCookie)
  ) {
    return res.status(403).json({ message: 'Invalid or missing CSRF token' });
  }

  return next();
};

export const CSRF_COOKIE = CSRF_COOKIE_NAME;
export const CSRF_HEADER = CSRF_HEADER_NAME;

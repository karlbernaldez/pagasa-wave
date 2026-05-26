import crypto from 'crypto';

const CSRF_COOKIE = 'csrfToken';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATH_PREFIXES = [
  '/status',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh-token',
  '/api/auth/verify-email',
  '/api/auth/resend-verification'
];

const cookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  path: '/',
};

const ensureToken = (req, res) => {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, cookieOptions);
  }
  return token;
};

export const issueCsrfToken = (req, res) => {
  const token = ensureToken(req, res);
  res.status(200).json({ csrfToken: token });
};

export const csrfProtection = (req, res, next) => {
  ensureToken(req, res);

  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PATH_PREFIXES.some((prefix) => req.path.startsWith(prefix))) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ message: 'CSRF token missing.' });
  }

  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);

  if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
    return res.status(403).json({ message: 'Invalid CSRF token.' });
  }

  next();
};

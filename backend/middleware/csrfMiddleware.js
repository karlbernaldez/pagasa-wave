export const csrfProtection = (req, res, next) => {
  const method = req.method.toUpperCase();
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  if (safeMethods.has(method)) {
    return next();
  }

  const origin = req.headers.origin;
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (!origin) {
    return res.status(403).json({ message: 'Origin header required' });
  }

  if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: 'CSRF protection blocked request' });
  }

  next();
};

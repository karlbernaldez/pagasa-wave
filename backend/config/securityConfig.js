const MIN_SECRET_LENGTH = 32;
const PLACEHOLDER_PATTERNS = [
  /change[-_ ]?me/i,
  /replace[-_ ]?me/i,
  /your[-_ ]?(jwt|secret)/i,
  /example/i,
  /default/i,
  /password/i,
];

const requireStrongSecret = (name, value) => {
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters.`);
  }

  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new Error(`${name} must not use a placeholder or default value.`);
  }
};

const validateCorsOrigin = (origin) => {
  let parsed;

  try {
    parsed = new URL(origin);
  } catch {
    throw new Error(`Invalid CORS origin: ${origin}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`CORS origin must use http or https: ${origin}`);
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`CORS origin must contain only scheme, host, and optional port: ${origin}`);
  }
};

export const validateSecurityConfig = (env = process.env) => {
  requireStrongSecret('JWT_SECRET', env.JWT_SECRET);
  requireStrongSecret('JWT_REFRESH_SECRET', env.JWT_REFRESH_SECRET);

  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different.');
  }

  if (env.NODE_ENV === 'production') {
    requireStrongSecret('CSRF_SECRET', env.CSRF_SECRET);

    if (env.CSRF_SECRET === env.JWT_SECRET || env.CSRF_SECRET === env.JWT_REFRESH_SECRET) {
      throw new Error('CSRF_SECRET must be different from JWT secrets.');
    }

    if (env.COOKIE_SECURE !== 'true') {
      throw new Error('COOKIE_SECURE must be true in production.');
    }

    const allowedOrigins = String(env.CORS_ALLOWED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (allowedOrigins.length === 0) {
      throw new Error('CORS_ALLOWED_ORIGINS is required in production.');
    }

    if (allowedOrigins.some((origin) => origin === '*')) {
      throw new Error('CORS_ALLOWED_ORIGINS must not contain * in production.');
    }

    allowedOrigins.forEach(validateCorsOrigin);
  }
};

export { MIN_SECRET_LENGTH };

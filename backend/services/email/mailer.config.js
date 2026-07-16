import nodemailer from 'nodemailer';

export const {
  EMAIL_HOST    = 'smtp.hostinger.com',
  EMAIL_PORT    = '465',
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  APP_NAME      = 'WaveLab',
  APP_URL,
  SUPPORT_EMAIL = 'support@adovelopers.com',
  NODE_ENV,
} = process.env;

if (NODE_ENV === 'production' && (!EMAIL_USER || !EMAIL_PASS)) {
  throw new Error('[Mailer] EMAIL_USER and EMAIL_PASS must be set in production.');
}

if (NODE_ENV === 'production' && !APP_URL) {
  throw new Error('[Mailer] APP_URL must be set in production.');
}

// If credentials are missing (e.g. local dev without .env), mark the mailer as
// not ready so every send function skips gracefully instead of throwing
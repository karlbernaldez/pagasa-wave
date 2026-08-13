import nodemailer from 'nodemailer';

export const {
  EMAIL_HOST = 'smtp.hostinger.com',
  EMAIL_PORT = '465',
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  APP_NAME = 'WaveLab',
  APP_URL,
  SUPPORT_EMAIL = 'support@adovelopers.com',
  NODE_ENV,
} = process.env;

if (NODE_ENV === 'production' && (!EMAIL_USER || !EMAIL_PASS)) {
  throw new Error('[Mailer] EMAIL_USER and EMAIL_PASS must be set in production.');
}

// If credentials are missing (e.g. local dev without .env), mark the mailer as
// not ready so every send function skips gracefully instead of throwing.
export const IS_MAILER_READY = Boolean(EMAIL_USER && EMAIL_PASS);

if (IS_MAILER_READY && !APP_URL) {
  throw new Error('[Mailer] APP_URL must be set when email delivery is enabled.');
}

if (!IS_MAILER_READY) {
  console.warn(
    '[Mailer] EMAIL_USER / EMAIL_PASS not set — all emails will be skipped in this environment.'
  );
}

export const FROM_ADDRESS = EMAIL_FROM ?? `${APP_NAME} <${EMAIL_USER}>`;

export const transporter = IS_MAILER_READY
  ? nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT, 10),
      secure: true,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    })
  : null;

export const checkMailerHealth = async () => {
  if (!IS_MAILER_READY)
    return console.warn('[Mailer] Skipping health check — transporter not configured.');
  await transporter.verify();
  console.info('[Mailer] SMTP connection verified');
};

const trimTrailingSlashes = (value) => value.replace(/\/+$/, '');

export const buildVerificationUrl = (appUrl, token) => {
  const baseUrl = trimTrailingSlashes(String(appUrl ?? '').trim());

  if (!baseUrl) {
    throw new Error('[Mailer] APP_URL must be set to the public WaveLab frontend URL.');
  }

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error('[Mailer] APP_URL must be a valid absolute URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('[Mailer] APP_URL must use http or https.');
  }

  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

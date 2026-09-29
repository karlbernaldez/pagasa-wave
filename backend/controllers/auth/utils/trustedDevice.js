import crypto from 'node:crypto';

import TrustedDevice from '#models/TrustedDevice';

const TRUSTED_DEVICE_COOKIE = 'wavelabTrustedDevice';
const TRUSTED_DEVICE_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

const secure =
  process.env.NODE_ENV === 'production' ? true : process.env.COOKIE_SECURE === 'true';
const sameSite = String(process.env.COOKIE_SAME_SITE || 'strict').toLowerCase();

const cookieOptions = {
  httpOnly: true,
  secure,
  sameSite,
  path: '/api/auth',
};

export const hashTrustedDeviceToken = (token) =>
  crypto.createHash('sha256').update(String(token || '')).digest('hex');

export const hashTrustedDeviceUserAgent = (userAgent) =>
  crypto.createHash('sha256').update(String(userAgent || '')).digest('hex');

const createRawToken = () => crypto.randomBytes(32).toString('base64url');

export const clearTrustedDeviceCookie = (res) => {
  res.clearCookie(TRUSTED_DEVICE_COOKIE, cookieOptions);
};

export const issueTrustedDevice = async (user, req, res) => {
  const token = createRawToken();
  const userAgentHash = hashTrustedDeviceUserAgent(req.headers['user-agent'] ?? '');
  const sessionVersion = user.sessionVersion ?? 0;

  await TrustedDevice.create({
    user: user._id,
    tokenHash: hashTrustedDeviceToken(token),
    userAgentHash,
    sessionVersion,
    expiresAt: new Date(Date.now() + TRUSTED_DEVICE_TTL_MS),
  });

  res.cookie(TRUSTED_DEVICE_COOKIE, token, {
    ...cookieOptions,
    maxAge: TRUSTED_DEVICE_TTL_MS,
  });

  return token;
};

export const consumeTrustedDevice = async (user, req, res) => {
  const token = req.cookies?.[TRUSTED_DEVICE_COOKIE];
  if (!token) return false;

  const now = new Date();
  const userAgentHash = hashTrustedDeviceUserAgent(req.headers['user-agent'] ?? '');

  const trustedDevice = await TrustedDevice.findOneAndUpdate(
    {
      user: user._id,
      tokenHash: hashTrustedDeviceToken(token),
      userAgentHash,
      sessionVersion: user.sessionVersion ?? 0,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        revokedAt: now,
        revokedReason: 'rotated',
        lastUsedAt: now,
      },
    },
    { new: false }
  );

  if (!trustedDevice) {
    clearTrustedDeviceCookie(res);
    return false;
  }

  return true;
};

export const revokeAllTrustedDevices = (userId, reason = 'logout_all') =>
  TrustedDevice.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );

export { TRUSTED_DEVICE_COOKIE, TRUSTED_DEVICE_TTL_MS };

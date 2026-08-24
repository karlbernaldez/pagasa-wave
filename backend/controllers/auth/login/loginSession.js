import { isTrustedDevice, markCredentialsVerified, generateAndStoreOtp } from '../otp.js';
import { issueTokens } from '../_helpers.js';
import { sendOtpEmail } from '#services/email/sendOtpEmail';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

import { finalizeLoginUser } from './loginFinalization.js';

const isOtpDebugLoggingEnabled = () =>
  process.env.LOG_OTP_FOR_TESTING === 'true' && process.env.NODE_ENV !== 'production';

const isOtpRequired = () => process.env.OTP_REQUIRED !== 'false';

const buildOtpLogMeta = (user, ip, otp) => {
  const otpDebugEnabled = isOtpDebugLoggingEnabled();
  return {
    userId: user._id,
    ip,
    otpDebugEnabled,
    ...(otpDebugEnabled ? { otp } : {}),
  };
};

export const handleTrustedDevice = async (user, coordinates, req, res, geoMeta) => {
  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? '';
  const loginUser = await finalizeLoginUser({
    userId: user._id,
    ip,
    userAgent: ua,
    coordinates,
  });

  if (!loginUser) {
    logger.warn('Trusted-device login blocked by concurrent account state change', {
      userId: user._id,
      ip,
    });
    return res.status(403).json({ message: 'Account is not available for login.' });
  }

  logger.info('Login completed without OTP challenge', {
    userId: loginUser._id,
    ip,
    otpRequired: isOtpRequired(),
  });
  await createAuditLog({
    user: loginUser._id,
    action: 'login_success',
    resourceType: 'User',
    resourceId: loginUser._id,
    ip,
    userAgent: ua,
    meta: {
      note: isOtpRequired()
        ? 'OTP skipped — trusted device'
        : 'OTP disabled by server configuration',
      ...geoMeta,
    },
  }).catch((e) => logger.error('Audit log failed', { error: e.message }));
  await issueTokens(loginUser, req, res);
  return res.status(200).json({
    user: {
      id: loginUser._id,
      username: loginUser.username,
      firstName: loginUser.firstName,
      lastName: loginUser.lastName,
      email: loginUser.email,
      role: loginUser.role,
      lastLogin: loginUser.lastLogin,
      status: loginUser.status,
    },
    trustedDevice: true,
    otpRequired: false,
  });
};

export const handleOtpChallenge = async (user, emailNorm, req, res, geoMeta) => {
  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? '';
  await markCredentialsVerified(emailNorm);
  const otp = await generateAndStoreOtp(emailNorm);
  await sendOtpEmail(emailNorm, otp, user.firstName ?? user.username);

  const otpLogMeta = buildOtpLogMeta(user, ip, otp);
  if (otpLogMeta.otpDebugEnabled) {
    logger.warn('OTP sent after credential verification', otpLogMeta);
  } else {
    logger.info('OTP sent after credential verification', otpLogMeta);
  }

  await createAuditLog({
    user: user._id,
    action: 'login_otp_sent',
    resourceType: 'User',
    resourceId: user._id,
    ip,
    userAgent: ua,
    meta: { note: 'Credentials verified, awaiting OTP', ...geoMeta },
  }).catch((e) => logger.error('Audit log failed', { error: e.message }));
  return res.status(200).json({
    message: 'Credentials verified. OTP sent to your email.',
    otpRequired: true,
  });
};

export const handleSession = (user, emailNorm, coordinates, req, res, geoMeta) => {
  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? '';

  if (!isOtpRequired()) {
    return handleTrustedDevice(user, coordinates, req, res, geoMeta);
  }

  return isTrustedDevice(ip, ua, user.lastLoginIP, user.lastLoginUserAgent)
    ? handleTrustedDevice(user, coordinates, req, res, geoMeta)
    : handleOtpChallenge(user, emailNorm, req, res, geoMeta);
};

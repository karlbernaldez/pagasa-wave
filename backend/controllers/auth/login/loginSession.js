import { isTrustedDevice, markCredentialsVerified, generateAndStoreOtp } from '../otp.js';
import { issueTokens } from '../_helpers.js';
import { sendOtpEmail } from '#services/email/sendOtpEmail';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

export const handleTrustedDevice = async (user, coordinates, req, res, geoMeta) => {
  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? '';
  user.lastLogin = new Date();
  user.lastLoginIP = ip;
  user.lastLoginUserAgent = ua;
  if (coordinates) user.lastLoginLocation = coordinates;
  await user.save();
  logger.info('Trusted device detected — skipping OTP', { userId: user._id, ip });
  await createAuditLog({ user: user._id, action: 'login_success', resourceType: 'User', resourceId: user._id, ip, userAgent: ua, meta: { note: 'OTP skipped — trusted device', ...geoMeta } }).catch((e) => logger.error('Audit log failed', { error: e.message }));
  await issueTokens(user, req, res);
  return res.status(200).json({ user: { id: user._id, username: user.username, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, lastLogin: user.lastLogin, status: user.status }, trustedDevice: true });
};

export const handleOtpChallenge = async (user, emailNorm, req, res, geoMeta) => {
  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? '';
  await markCredentialsVerified(emailNorm);
  const otp = await generateAndStoreOtp(emailNorm);
  await sendOtpEmail(emailNorm, otp, user.firstName ?? user.username);
  logger.info('OTP sent after credential verification', { userId: user._id, ip });
  await createAuditLog({ user: user._id, action: 'login_otp_sent', resourceType: 'User', resourceId: user._id, ip, userAgent: ua, meta: { note: 'Credentials verified, awaiting OTP', ...geoMeta } }).catch((e) => logger.error('Audit log failed', { error: e.message }));
  return res.status(200).json({ message: 'Credentials verified. OTP sent to your email.', otpRequired: true });
};

export const handleSession = (user, emailNorm, coordinates, req, res, geoMeta) => {
  const ip = req.ip;
  const ua = req.headers['user-agent'] ?? '';
  return isTrustedDevice(ip, ua, user.lastLoginIP, user.lastLoginUserAgent)
    ? handleTrustedDevice(user, coordinates, req, res, geoMeta)
    : handleOtpChallenge(user, emailNorm, req, res, geoMeta);
};

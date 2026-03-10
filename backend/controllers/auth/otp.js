import crypto from 'crypto';

import User from '../../models/User.js';
import { normalizeEmail } from '#controllers/auth/utils/validators';
import { issueTokens } from './_helpers.js';
import { sendOtpEmail } from '#services/email/sendOtpEmail';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Storage abstraction
// ─────────────────────────────────────────────────────────────────────────────

class MemoryStore {
  #map = new Map();

  async get(key)        { return this.#map.get(key); }
  async set(key, value) { this.#map.set(key, value); }
  async delete(key)     { this.#map.delete(key); }

  async incrementAttempts(key) {
    const record = this.#map.get(key);
    if (!record) return null;
    const updated = { ...record, attempts: (record.attempts ?? 0) + 1 };
    this.#map.set(key, updated);
    return updated;
  }
}

let pendingAuthStore = new MemoryStore();
let otpStore         = new MemoryStore();

export const setStore = (pending, otp) => {
  pendingAuthStore = pending;
  otpStore         = otp;
};

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const PENDING_EXPIRY_MS   = 10 * 60 * 1_000;
const OTP_EXPIRY_MS       =  5 * 60 * 1_000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SEND_PER_WINDOW = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Trusted device detection
//
// A device is considered "trusted" when BOTH of the following match:
//   1. Same /24 subnet (first 3 octets of IPv4) — tolerates minor ISP changes
//      while still blocking logins from a different network entirely.
//   2. Identical User-Agent string — same browser + OS combination.
//
// This is a lightweight heuristic, not cryptographic proof.  For stricter
// requirements, replace with a signed device-fingerprint cookie.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the /24 prefix of an IPv4 address, or the full string for IPv6.
 * "192.168.1.42" → "192.168.1"
 */
const ipPrefix = (ip = '') => {
  const parts = ip.split('.');
  return parts.length === 4 ? parts.slice(0, 3).join('.') : ip;
};

/**
 * Returns true when the current request looks like the same device that last
 * logged in successfully.
 *
 * @param {string} currentIP
 * @param {string} currentUA
 * @param {string|null} storedIP   - user.lastLoginIP from DB
 * @param {string|null} storedUA   - user.lastLoginUserAgent from DB
 */
export const isTrustedDevice = (currentIP, currentUA, storedIP, storedUA) => {
  if (!storedIP || !storedUA) return false; // no prior login recorded

  const sameSubnet = ipPrefix(currentIP) === ipPrefix(storedIP);
  const sameAgent  = currentUA === storedUA;

  return sameSubnet && sameAgent;
};

// ─────────────────────────────────────────────────────────────────────────────
// Crypto helpers
// ─────────────────────────────────────────────────────────────────────────────

const hashOtp = (otp) =>
  crypto.createHash('sha256').update(otp).digest('hex');

const safeCompareOtp = (candidate, storedHash) => {
  const a = Buffer.from(hashOtp(candidate), 'hex');
  const b = Buffer.from(storedHash,         'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers (exported for loginUser.js)
// ─────────────────────────────────────────────────────────────────────────────

export const markCredentialsVerified = async (email) => {
  await pendingAuthStore.set(email, { expiresAt: Date.now() + PENDING_EXPIRY_MS });
};

export const generateAndStoreOtp = async (email) => {
  const existing = await otpStore.get(email);

  if (existing && Date.now() < existing.expiresAt) {
    const sends = existing.sends ?? 1;
    if (sends >= MAX_SEND_PER_WINDOW) {
      throw Object.assign(new Error('Too many OTP requests.'), { code: 'RATE_LIMITED' });
    }
    const otp = crypto.randomInt(100_000, 999_999).toString();
    await otpStore.set(email, {
      otpHash:   hashOtp(otp),
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts:  0,
      sends:     sends + 1,
    });
    return otp;
  }

  const otp = crypto.randomInt(100_000, 999_999).toString();
  await otpStore.set(email, {
    otpHash:   hashOtp(otp),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts:  0,
    sends:     1,
  });
  return otp;
};

// ─────────────────────────────────────────────────────────────────────────────
// Guards
// ─────────────────────────────────────────────────────────────────────────────

const isCredentialsVerified = async (email) => {
  const record = await pendingAuthStore.get(email);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    await pendingAuthStore.delete(email);
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/otp/send
// ─────────────────────────────────────────────────────────────────────────────

export const sendOtp = async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  if (!await isCredentialsVerified(email)) {
    return res.status(403).json({ message: 'Unauthorized. Please log in first.' });
  }

  try {
    const otp = await generateAndStoreOtp(email);
    await sendOtpEmail(email, otp);

    logger.info('[OTP] Sent', { email, ip: req.ip });

    return res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (err) {
    if (err.code === 'RATE_LIMITED') {
      return res.status(429).json({ message: 'Too many requests. Please wait before requesting a new code.' });
    }
    logger.error('[sendOtp] Unexpected error', { email, error: err.message });
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/otp/verify
// ─────────────────────────────────────────────────────────────────────────────

export const verifyOtp = async (req, res) => {
  const email   = normalizeEmail(req.body?.email);
  const { otp } = req.body ?? {};

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  if (!await isCredentialsVerified(email)) {
    return res.status(403).json({ message: 'Unauthorized. Please log in first.' });
  }

  const record = await otpStore.get(email);

  if (!record) {
    return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    await otpStore.delete(email);

    await createAuditLog({
      user:         null,
      action:       'otp_expired',
      resourceType: 'User',
      resourceId:   null,
      ip:           req.ip,
      userAgent:    req.headers['user-agent'],
      meta:         { email },
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  // ── Brute-force guard ──────────────────────────────────────────────────────
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await Promise.all([otpStore.delete(email), pendingAuthStore.delete(email)]);

    logger.warn('[OTP] Locked — too many attempts', { email, ip: req.ip });

    await createAuditLog({
      user:         null,
      action:       'otp_locked',
      resourceType: 'User',
      resourceId:   null,
      ip:           req.ip,
      userAgent:    req.headers['user-agent'],
      meta:         { email, reason: 'Max OTP attempts exceeded' },
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return res.status(429).json({
      message: 'Too many failed attempts. Please log in again to request a new code.',
    });
  }

  // ── Timing-safe compare ────────────────────────────────────────────────────
  if (!safeCompareOtp(otp, record.otpHash)) {
    const updated   = await otpStore.incrementAttempts(email);
    const remaining = MAX_VERIFY_ATTEMPTS - (updated?.attempts ?? MAX_VERIFY_ATTEMPTS);

    logger.warn('[OTP] Invalid attempt', { email, remaining, ip: req.ip });

    await createAuditLog({
      user:         null,
      action:       'otp_failed',
      resourceType: 'User',
      resourceId:   null,
      ip:           req.ip,
      userAgent:    req.headers['user-agent'],
      meta:         { email, remaining },
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return res.status(400).json({
      message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
    });
  }

  // ── OTP valid — purge both stores before any DB work ─────────────────────
  await Promise.all([otpStore.delete(email), pendingAuthStore.delete(email)]);

  try {
    const user = await User.findOne({ email, deletedAt: null });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentIP = req.ip;
    const currentUA = req.headers['user-agent'] ?? '';

    // Persist all login metadata in one save
    user.failedLoginAttempts = 0;
    user.lockUntil           = null;
    user.lastLogin           = new Date();
    user.lastLoginIP         = currentIP;  // ← stored for trusted device future checks
    user.lastLoginUserAgent  = currentUA;  // ← stored for trusted device future checks
    await user.save();

    await issueTokens(user, req, res);

    logger.info('[OTP] Login success', { userId: user._id, email, ip: currentIP });

    // ── Audit log for successful login ────────────────────────────────────────
    await createAuditLog({
      user:         user._id,
      action:       'login_success',
      resourceType: 'User',
      resourceId:   user._id,
      ip:           currentIP,
      userAgent:    currentUA,
      meta:         { note: 'OTP verified, session issued' },
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return res.status(200).json({
      user: {
        id:        user._id,
        username:  user.username,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        role:      user.role,
        lastLogin: user.lastLogin,
        status:    user.status,
      },
    });

  } catch (err) {
    logger.error('[verifyOtp] DB error', { email, error: err.message });
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
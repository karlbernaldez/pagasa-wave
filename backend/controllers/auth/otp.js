import crypto from 'crypto';

import User from '../../models/User.js';
import { normalizeEmail } from '#controllers/auth/utils/validators';
import { issueTokens } from './_helpers.js';
import { sendOtpEmail } from '#controllers/auth/sendOtpEmail';

// ─────────────────────────────────────────────────────────────────────────────
// Storage abstraction
//
// Default: in-process MemoryStore (dev / single-instance only).
// Production: call setStore() at app bootstrap with Redis-backed instances.
//
// All store methods are async so the interface is compatible with both
// synchronous (MemoryStore) and I/O-bound (RedisStore) implementations.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StoreRecord
 * @property {string} [otpHash]   - SHA-256 hex of the OTP (otpStore only)
 * @property {number} expiresAt   - Unix-ms expiry timestamp
 * @property {number} [attempts]  - Failed verify counter (otpStore only)
 * @property {number} [sends]     - Resend counter within current window (otpStore only)
 */

class MemoryStore {
  #map = new Map();

  async get(key)        { return this.#map.get(key); }
  async set(key, value) { this.#map.set(key, value); }
  async delete(key)     { this.#map.delete(key); }

  /** Atomic attempt increment — mirrors RedisOtpStore.incrementAttempts API. */
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

/**
 * Swap both stores at app bootstrap.
 *
 * Example (app.js):
 *   import { RedisPendingAuthStore, RedisOtpStore } from '#lib/redisOtpStore.js';
 *   setStore(new RedisPendingAuthStore(), new RedisOtpStore());
 */
export const setStore = (pending, otp) => {
  pendingAuthStore = pending;
  otpStore         = otp;
};

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const PENDING_EXPIRY_MS   = 10 * 60 * 1_000; //  10 min — OTP step window
const OTP_EXPIRY_MS       =  5 * 60 * 1_000; //   5 min — code validity
const MAX_VERIFY_ATTEMPTS = 5;                //  lock after N wrong guesses
const MAX_SEND_PER_WINDOW = 3;                //  max resends per OTP window

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

/**
 * Called by loginUser immediately after credentials pass.
 * Opens a short window allowing this email to proceed to the OTP step.
 *
 * @param {string} email - Already-normalised
 */
export const markCredentialsVerified = async (email) => {
  await pendingAuthStore.set(email, { expiresAt: Date.now() + PENDING_EXPIRY_MS });
};

/**
 * Generates a 6-digit OTP, stores its hash, returns the plaintext.
 * Enforces MAX_SEND_PER_WINDOW within the active OTP window.
 *
 * @param   {string} email
 * @returns {Promise<string>} Plaintext OTP — pass directly to sendOtpEmail
 * @throws  {{ code: 'RATE_LIMITED' }} when resend cap is hit
 */
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
// Route handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/otp/send
 */
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
    console.info(`[OTP] Sent to ${email}`);
    return res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (err) {
    if (err.code === 'RATE_LIMITED') {
      return res.status(429).json({ message: 'Too many requests. Please wait before requesting a new code.' });
    }
    console.error('[sendOtp] unexpected error', { email, err });
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

/**
 * POST /api/auth/otp/verify
 */
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
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  // ── Brute-force guard ──────────────────────────────────────────────────────
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await Promise.all([otpStore.delete(email), pendingAuthStore.delete(email)]);
    console.warn(`[OTP] Locked — too many attempts for ${email}`);
    return res.status(429).json({
      message: 'Too many failed attempts. Please log in again to request a new code.',
    });
  }

  // ── Timing-safe compare ────────────────────────────────────────────────────
  if (!safeCompareOtp(otp, record.otpHash)) {
    const updated   = await otpStore.incrementAttempts(email);
    const remaining = MAX_VERIFY_ATTEMPTS - (updated?.attempts ?? MAX_VERIFY_ATTEMPTS);
    console.warn(`[OTP] Invalid attempt for ${email}, ${remaining} remaining`);
    return res.status(400).json({
      message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
    });
  }

  // ── Success — purge both stores before any DB work ────────────────────────
  await Promise.all([otpStore.delete(email), pendingAuthStore.delete(email)]);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil           = null;
    user.lastLogin           = new Date();
    await user.save();

    await issueTokens(user, req, res);

    console.info(`[OTP] Login success for ${email} (userId: ${user._id})`);

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
    console.error('[verifyOtp] DB error', { email, err });
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
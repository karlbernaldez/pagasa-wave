import redis from '#lib/redis';

// ─────────────────────────────────────────────────────────────────────────────
// TTLs (seconds — Redis native)
// Keep in sync with otp.js constants.
// ─────────────────────────────────────────────────────────────────────────────

const PENDING_TTL_S = 10 * 60; // 10 min
const OTP_TTL_S     =  5 * 60; //  5 min

// ─────────────────────────────────────────────────────────────────────────────
// RedisPendingAuthStore
//
// Stores:  pending:<email> → JSON { expiresAt }
// TTL is managed by Redis natively — no manual expiry check needed.
// ─────────────────────────────────────────────────────────────────────────────

export class RedisPendingAuthStore {
  #prefix = 'pending:';

  #key(email) {
    return this.#prefix + email;
  }

  async get(email) {
    const raw = await redis.get(this.#key(email));
    return raw ? JSON.parse(raw) : undefined;
  }

  async set(email, value) {
    // EX sets TTL in seconds; key auto-deletes when it expires.
    await redis.set(this.#key(email), JSON.stringify(value), 'EX', PENDING_TTL_S);
  }

  async delete(email) {
    await redis.del(this.#key(email));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RedisOtpStore
//
// Stores:  otp:<email> → JSON { otpHash, expiresAt, attempts, sends }
//
// Attempt increment uses a Lua script executed atomically on the Redis server
// so concurrent verify requests can't race and skip the lockout.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atomic increment of the `attempts` field inside a JSON value.
 * Returns the updated record, or null if the key doesn't exist.
 *
 * Lua runs atomically inside Redis — no WATCH/MULTI needed.
 */
const incrementAttemptsScript = `
local raw = redis.call('GET', KEYS[1])
if not raw then return nil end
local rec = cjson.decode(raw)
rec.attempts = (rec.attempts or 0) + 1
local ttl = redis.call('TTL', KEYS[1])
redis.call('SET', KEYS[1], cjson.encode(rec), 'EX', math.max(ttl, 1))
return cjson.encode(rec)
`;

export class RedisOtpStore {
  #prefix = 'otp:';

  #key(email) {
    return this.#prefix + email;
  }

  async get(email) {
    const raw = await redis.get(this.#key(email));
    return raw ? JSON.parse(raw) : undefined;
  }

  async set(email, value) {
    await redis.set(this.#key(email), JSON.stringify(value), 'EX', OTP_TTL_S);
  }

  async delete(email) {
    await redis.del(this.#key(email));
  }

  /**
   * Atomically increment `attempts` for an existing OTP record.
   * Preserves the remaining TTL so a wrong guess can't reset the expiry.
   *
   * @param   {string} email
   * @returns {Promise<object|null>} Updated record, or null if key is gone
   */
  async incrementAttempts(email) {
    const raw = await redis.eval(incrementAttemptsScript, 1, this.#key(email));
    return raw ? JSON.parse(raw) : null;
  }
}
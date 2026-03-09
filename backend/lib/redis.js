import Redis from 'ioredis';

// ─────────────────────────────────────────────────────────────────────────────
// Redis client — singleton, shared across the process.
//
// Config priority:
//   1. REDIS_URL  — full connection string (redis:// or rediss:// for TLS)
//   2. REDIS_HOST / REDIS_PORT / REDIS_PASSWORD / REDIS_DB
//   3. Defaults   — localhost:6379, no auth, db 0
// ─────────────────────────────────────────────────────────────────────────────

const {
  REDIS_URL,
  REDIS_HOST     = '127.0.0.1',
  REDIS_PORT     = '6379',
  REDIS_PASSWORD,
  REDIS_DB       = '0',
  NODE_ENV,
} = process.env;

const sharedOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck:     true,

  // Don't attempt to connect until the first command is issued.
  // Prevents connection-refused spam on import; checkRedisHealth() is the
  // single explicit fail-fast gate during app startup.
  lazyConnect: true,

  retryStrategy(times) {
    if (times > 10) return null; // stop retrying after 10 attempts
    return Math.min(times * 200, 10_000); // exponential back-off, max 10 s
  },
};

const client = REDIS_URL
  ? new Redis(REDIS_URL, {
      ...sharedOptions,
      tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    })
  : new Redis({
      ...sharedOptions,
      host:     REDIS_HOST,
      port:     parseInt(REDIS_PORT, 10),
      password: REDIS_PASSWORD,
      db:       parseInt(REDIS_DB, 10),
    });

client.on('connect', () => console.info('[Redis] Connected'));
client.on('ready',   () => console.info('[Redis] Ready'));
client.on('close',   () => {
  if (NODE_ENV !== 'test') console.warn('[Redis] Connection closed');
});
client.on('error',   (err) => {
  // Log but don't crash — retryStrategy handles reconnection.
  console.error('[Redis] Error:', err.message);
});

/**
 * Explicitly open the connection and verify Redis is reachable.
 * Call once at app startup so misconfiguration fails loudly before
 * the first request arrives, rather than silently at runtime.
 *
 * @returns {Promise<void>}
 * @throws  {Error} if Redis doesn't respond within 5 s
 */
export const checkRedisHealth = async () => {
  await client.connect(); // no-op if already connected (lazyConnect)
  const pong = await Promise.race([
    client.ping(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis health check timed out after 5 s')), 5_000),
    ),
  ]);
  if (pong !== 'PONG') throw new Error(`Unexpected Redis PING response: ${pong}`);
};

export default client;
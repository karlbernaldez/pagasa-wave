import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

import { verifySocketSession } from './socketAuth.js';
import { logger } from '#utils/logger';

// ─── Redis clients ────────────────────────────────────────────────────────────
// Socket.io's Redis adapter requires two dedicated clients: one to publish,
// one to subscribe. They must NOT be shared with other parts of the app.

const createRedisClients = async () => {
  const opts = { url: process.env.REDIS_URL };

  const pub = createClient(opts);
  const sub = pub.duplicate();

  pub.on('error', (err) => logger.error('[Redis pub]', { error: err.message }));
  sub.on('error', (err) => logger.error('[Redis sub]', { error: err.message }));

  await Promise.all([pub.connect(), sub.connect()]);
  logger.info('[Socket.io] Redis adapter connected');

  return { pub, sub };
};

// ─── Room helpers ──────────────────────────────────────────────────────────────
// Each connected socket joins three deterministic rooms so that any server
// instance can target the right clients without knowing which instance they
// connected to.

export const roomFor = {
  user: (userId) => `user:${userId}`,
  role: (role) => `role:${role}`,
  broadcast: () => 'broadcast',
};

// ─── Initialise ───────────────────────────────────────────────────────────────

/**
 * Attach Socket.io to an existing HTTP server.
 * Returns the `io` instance so other modules (e.g. notificationService) can
 * emit events without importing the full server.
 *
 * @param {import('http').Server} httpServer
 * @returns {Promise<import('socket.io').Server>}
 */
export const initSocket = async (httpServer) => {

  const { pub, sub } = await createRedisClients();

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.adapter(createAdapter(pub, sub));

  io.use(verifySocketSession);

  io.on('connection', (socket) => {

    const { userId, role } = socket.data;

    socket.join([
      roomFor.user(userId),
      roomFor.role(role),
      roomFor.broadcast(),
    ]);

    logger.info('[Socket.io] client connected', {
      userId,
      role,
      socketId: socket.id
    });

    socket.on('disconnect', (reason) => {
      logger.info('[Socket.io] client disconnected', {
        userId,
        reason
      });
    });

  });

  return io;
};
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

import { verifySocketSession } from './socketAuth.js';
import { logger } from '#utils/logger';

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

export const roomFor = {
  user: (userId) => `user:${userId}`,
  role: (role) => `role:${role}`,
  broadcast: () => 'broadcast',
  forecastChartProject: (projectId) => `forecast-chart-project:${projectId}`,
};

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

    socket.on('forecast:join_project', (projectId) => {
      if (!projectId) return;
      socket.join(roomFor.forecastChartProject(String(projectId)));
    });

    socket.on('forecast:leave_project', (projectId) => {
      if (!projectId) return;
      socket.leave(roomFor.forecastChartProject(String(projectId)));
    });

    logger.info('[Socket.io] client connected', {
      userId,
      role,
      socketId: socket.id,
    });

    socket.on('disconnect', (reason) => {
      logger.info('[Socket.io] client disconnected', {
        userId,
        reason,
      });
    });
  });

  return io;
};

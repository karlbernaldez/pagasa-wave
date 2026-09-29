import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import mongoose from 'mongoose';

import Project from '#models/Project';
import { canAccessProject } from '#utils/forecastPackageAccess';
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
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
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
    const { userId, role, permissions = [], tokenExpiresAt } = socket.data;

    socket.join([roomFor.user(userId), roomFor.role(role), roomFor.broadcast()]);

    let expiryTimer = null;
    if (tokenExpiresAt) {
      const remainingMs = Math.max(0, tokenExpiresAt - Date.now());
      expiryTimer = setTimeout(() => {
        logger.info('[Socket.io] access token expired; disconnecting client', {
          userId,
          socketId: socket.id,
        });
        socket.disconnect(true);
      }, remainingMs);
      expiryTimer.unref?.();
    }

    socket.on('forecast:join_project', async (projectId, acknowledge) => {
      const id = String(projectId || '');
      if (!mongoose.Types.ObjectId.isValid(id)) {
        acknowledge?.({ ok: false });
        return;
      }

      try {
        const project = await Project.findById(id).select('_id owner forecastPackage').lean();
        const allowed = await canAccessProject({ id: userId, role }, project, permissions);

        if (!allowed) {
          logger.warn('[Socket.io] project room access denied', {
            userId,
            projectId: id,
          });
          acknowledge?.({ ok: false });
          return;
        }

        await socket.join(roomFor.forecastChartProject(id));
        acknowledge?.({ ok: true });
      } catch (error) {
        logger.error('[Socket.io] project room authorization failed', {
          userId,
          projectId: id,
          error: error.message,
        });
        acknowledge?.({ ok: false });
      }
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
      if (expiryTimer) clearTimeout(expiryTimer);
      logger.info('[Socket.io] client disconnected', {
        userId,
        reason,
      });
    });
  });

  return io;
};

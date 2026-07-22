import 'dotenv/config';

import dns from 'node:dns';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

import connectDB from './config/db.js';
import { setStore } from '#controllers/auth/otp';
import { checkRedisHealth } from '#lib/redis';
import {
  RedisOtpStore,
  RedisPendingAuthStore,
} from '#lib/redisOtpStore';
import { csrfProtection } from './middleware/csrfMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import featureRoutes from './routes/featureRoutes.js';
import forecastPackageRoutes from './routes/forecastPackageRoutes.js';
import notificationRoutes from './routes/notificationRouter.js';
import pdfRoutes from './routes/pdfRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { initSocket } from './socket/index.js';
import { setIo } from './socket/socketEmitter.js';
import { errorLogger } from './utils/errorLogger.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

const parseCsv = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Overrides Node's resolver only when explicitly configured locally.
 *
 * Production remains on the operating system's configured DNS because
 * DEV_DNS_SERVERS is ignored when NODE_ENV=production.
 */
const configureRuntimeDns = () => {
  const developmentDnsServers = parseCsv(process.env.DEV_DNS_SERVERS);

  if (isProduction || developmentDnsServers.length === 0) {
    return;
  }

  dns.setServers(developmentDnsServers);

  logger.info('Development DNS override enabled', {
    servers: dns.getServers(),
  });
};

const createCorsOptions = () => {
  const allowedOrigins = parseCsv(process.env.CORS_ALLOWED_ORIGINS);

  return {
    credentials: true,

    origin(origin, callback) {
      // Allow same-origin, health checks, CLI tools, and server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Preserve the current permissive local-development behavior.
      if (!isProduction && allowedOrigins.length === 0) {
        return callback(null, true);
      }

      return callback(null, false);
    },
  };
};

const createGlobalLimiter = () =>
  rateLimit({
    windowMs: 60_000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: {
      message: 'Too many requests, slow down.',
    },
  });

const createAuthLimiter = () =>
  rateLimit({
    windowMs: 15 * 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: {
      message: 'Too many login attempts. Try again later.',
    },
  });

const createApp = () => {
  const app = express();
  const corsOptions = createCorsOptions();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
  app.use(createGlobalLimiter());

  app.use(express.json({ limit: '5mb' }));
  app.use(
    express.urlencoded({
      limit: '5mb',
      extended: true,
    }),
  );
  app.use(cookieParser());
  app.use(csrfProtection);

  app.use((req, _res, next) => {
    mongoSanitize.sanitize(req.body, {
      replaceWith: '_',
    });

    mongoSanitize.sanitize(req.params, {
      replaceWith: '_',
    });

    next();
  });

  app.get('/status', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'WaveLab API is running',
    });
  });

  app.use('/api/settings', settingsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/features', featureRoutes);
  app.use('/api/auth', createAuthLimiter(), authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/forecast-packages', forecastPackageRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/pdf', pdfRoutes);

  // Preserved for compatibility with the current application.
  app.use('/api/chat', chatRoutes);

  app.use(
    '/api/public',
    express.static(path.join(__dirname, 'public')),
  );

  app.use(
    '/api/frames',
    express.static(path.join(__dirname, 'frames')),
  );

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  app.use(errorLogger);

  app.use((err, _req, res, _next) => {
    const status = Number.isInteger(err.status)
      ? err.status
      : 500;

    res.status(status).json({
      success: false,
      message: err.message || 'Internal Server Error',
      ...(isProduction ? {} : { stack: err.stack }),
    });
  });

  return app;
};

const getPort = () => {
  const rawPort = process.env.PORT ?? '5000';
  const port = Number.parseInt(rawPort, 10);

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535
  ) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return port;
};

const listen = (server, port) =>
  new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };

    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port);
  });

const startServer = async () => {
  // This runs before Mongoose performs its SRV DNS query.
  configureRuntimeDns();

  await connectDB();

  setStore(
    new RedisPendingAuthStore(),
    new RedisOtpStore(),
  );

  await checkRedisHealth();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = await initSocket(httpServer);
  setIo(io);

  const port = getPort();

  await listen(httpServer, port);

  logger.info('WaveLab API started', {
    port,
    environment: process.env.NODE_ENV ?? 'development',
    dnsServers: isProduction ? undefined : dns.getServers(),
  });

  let shuttingDown = false;

  const shutdown = (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    logger.info('WaveLab API shutdown requested', {
      signal,
    });

    const forceShutdownTimer = setTimeout(() => {
      logger.error('WaveLab API shutdown timed out');
      process.exit(1);
    }, 10_000);

    forceShutdownTimer.unref();

    httpServer.close((error) => {
      clearTimeout(forceShutdownTimer);

      if (error) {
        logger.error('WaveLab API shutdown failed', {
          message: error.message,
          stack: error.stack,
        });

        process.exit(1);
      }

      logger.info('WaveLab API stopped');
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((error) => {
  logger.error('WaveLab API startup failed', {
    message: error.message,
    code: error.code,
    syscall: error.syscall,
    hostname: error.hostname,
    stack: error.stack,
  });

  process.exit(1);
});
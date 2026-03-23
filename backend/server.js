import http          from 'http';
import express        from 'express';
import path           from 'path';
import cors           from 'cors';
import cookieParser   from 'cookie-parser';
import helmet         from 'helmet';
import rateLimit      from 'express-rate-limit';
import mongoSanitize  from 'express-mongo-sanitize';

import connectDB                               from './config/db.js';
import { checkRedisHealth }                    from '#lib/redis';
import { RedisPendingAuthStore, RedisOtpStore } from '#lib/redisOtpStore';
import { setStore }                             from '#controllers/auth/otp';

import { initSocket } from './socket/index.js';
import { setIo }      from './socket/socketEmitter.js';

import settingsRoutes     from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRouter.js';
import featureRoutes      from './routes/featureRoutes.js';
import authRoutes         from './routes/authRoutes.js';
import userRoutes         from './routes/userRoutes.js';
import projectRoutes      from './routes/projectRoutes.js';
import chartRoutes        from './routes/chartRoutes.js';
import pdfRoutes          from './routes/pdfRoutes.js';

import { fileURLToPath } from 'url';
import 'module-alias/register';

const app = express();

/* ======================================================
   CONNECT DATABASE
====================================================== */
try {
  await connectDB();
} catch (err) {
  console.error('DB connection failed:', err);
  process.exit(1);
}

setStore(new RedisPendingAuthStore(), new RedisOtpStore());
await checkRedisHealth();
console.info('[App] Redis OTP store ready');

/* ======================================================
   TRUST PROXY (needed for correct IPs behind proxies)
====================================================== */
app.set('trust proxy', 1);

/* ======================================================
   SECURITY HEADERS
====================================================== */
app.use(helmet());

/* ======================================================
   GLOBAL RATE LIMITER
====================================================== */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, slow down.' },
});

app.use(globalLimiter);

/* ======================================================
   AUTH ROUTE LIMITER (anti brute-force)
====================================================== */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again later.' },
});

/* ======================================================
   CORS
====================================================== */
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

console.log('Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0) {
      if (process.env.NODE_ENV === 'production') return callback(null, false);
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.warn('Blocked CORS:', origin);
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

/* ======================================================
   BODY PARSING
====================================================== */
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(cookieParser());

/* ======================================================
   SANITIZATION
====================================================== */
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body,   { replaceWith: '_' });
  mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  next();
});

/* ======================================================
   PATH HELPERS (ESM)
====================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* ======================================================
   HEALTH CHECK
====================================================== */
app.get('/status', (req, res) => {
  res.status(200).json({
    status:    'OK',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    message:   'Votewave API is running',
  });
});

/* ======================================================
   ROUTES
====================================================== */
app.use('/api/settings',      settingsRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/features',       featureRoutes);
app.use('/api/auth',           authLimiter, authRoutes);
app.use('/api/projects',       projectRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/charts',         chartRoutes);
app.use('/api/pdf',            pdfRoutes);

/* ======================================================
   STATIC FILES
====================================================== */
app.use('/api/public', express.static(path.join(__dirname, 'public')));
app.use('/api/frames', express.static(path.join(__dirname, 'frames')));

console.log(`📂 Serving static files from: ${path.join(__dirname, 'public')}`);

/* ======================================================
   404 HANDLER
====================================================== */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

/* ======================================================
   ERROR HANDLER
====================================================== */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isProd ? {} : { stack: err.stack }),
  });
});

/* ======================================================
   HTTP SERVER + SOCKET.IO
   Wrap Express in http.Server so Socket.io can share
   the same port — no second port, no proxy config.
====================================================== */
const httpServer = http.createServer(app);

initSocket(httpServer)
  .then((io) => {
    setIo(io);
    console.info('[App] Socket.io ready');
  })
  .catch((err) => {
    // Non-fatal: REST API still works, real-time just unavailable
    console.error('[App] Socket.io failed to initialise:', err.message);
  });

/* ======================================================
   START SERVER
====================================================== */
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* ======================================================
   GRACEFUL SHUTDOWN
====================================================== */
function shutdown() {
  console.log('🛑 Shutting down server...');

  // httpServer.close() stops new connections and waits for
  // existing ones — including WebSocket connections — to finish.
  httpServer.close(() => {
    console.log('✅ HTTP + WebSocket server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('❌ Force shutdown');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
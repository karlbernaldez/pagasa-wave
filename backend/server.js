import express from 'express';
import path from "path";
import { fileURLToPath } from "url";
import connectDB from './config/db.js';
import featureRoutes from './routes/featureRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import satelliteRoutes from './routes/satelliteRoutes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { startScheduler } from './services/satelliteServices.js';

const app = express();
try {
  await connectDB();
} catch (err) {
  console.error("DB connection failed:", err);
  process.exit(1);
}

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : [];

console.log("Allowed CORS origins:", allowedOrigins);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS middleware
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Votewave API is running',
  });
});

// API routes
app.use('/api/features', featureRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/satellite', satelliteRoutes);

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

//Static files (himawari.gif, etc.)
app.use('/api/public', express.static(path.join(__dirname, 'public')));
app.use('/api/frames', express.static(path.join(__dirname, 'frames')));

// For Satellite image
startScheduler();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

console.log(`📂 Serving static files from: ${path.join(__dirname, 'public')}`);

function shutdown() {
  console.log("🛑 Shutting down server...");

  server.close(() => {
    console.log("✅ HTTP server closed");

    // If you have DB connection, close it here too
    mongoose.connection.close(false, () => {
      console.log("✅ MongoDB connection closed");
      process.exit(0);
    });

    process.exit(0);
  });

  // Force shutdown if stuck
  setTimeout(() => {
    console.error("❌ Could not close connections in time, force exit");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
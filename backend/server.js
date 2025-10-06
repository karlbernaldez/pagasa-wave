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
connectDB();

const allowedOrigins = [
  'http://10.8.0.2:3000',
  'http://34.122.153.132:8080',
  'http://34.172.63.27:3030',
  'http://34.172.63.27:3001',
  'http://localhost:3001',
  'http://localhost:3000',
  'http://192.168.5.1:3000',
  'http://34.172.63.27:5173',
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS middleware
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

// ✅ API routes
app.use('/api/features', featureRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/satellite', satelliteRoutes);

// ✅ Static files (himawari.gif, etc.)
app.use('/api/public', express.static(path.join(__dirname, 'public')));
app.use('/api/frames', express.static(path.join(__dirname, 'frames')));

// ✅ Start background job (scheduler runs every CRON_EXPR)
startScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

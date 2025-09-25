import express from 'express';
import connectDB from './config/db.js';
import featureRoutes from './routes/featureRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import chartRoutes from './routes/chartRoutes.js'
import cors from 'cors';
import cookieParser from 'cookie-parser';

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
  'http://10.8.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Define routes
app.use('/api/features', featureRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/charts', chartRoutes)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

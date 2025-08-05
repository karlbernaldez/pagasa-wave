import express from 'express';
import connectDB from './config/db.js';
import featureRoutes from './routes/featureRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
connectDB();

// Define CORS options for credentials and specific origin
const corsOptions = {
  origin: ['http://10.8.0.2:3000', 'http://34.132.59.27:8080', 'http://localhost:3000'], // Allow multiple origins
  credentials: true, // Allow cookies
};

app.use(cors(corsOptions)); // Use CORS with custom options first
app.use(express.json());
app.use(cookieParser());

// Define routes
app.use('/api/features', featureRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

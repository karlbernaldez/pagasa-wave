import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { validateSecurityConfig } from './securityConfig.js';

dotenv.config();

const connectDB = async () => {
  try {
    validateSecurityConfig();
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;

import express from 'express';
import rateLimit from 'express-rate-limit';

import { proxyChatCompletion } from '../controllers/chatController.js';

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many chat requests. Please slow down.' },
});

router.post('/completions', chatLimiter, proxyChatCompletion);

export default router;

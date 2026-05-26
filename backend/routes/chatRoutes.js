import express from 'express';
import rateLimit from 'express-rate-limit';
import { proxyChatCompletion } from '../controllers/chatController.js';
import protect from '../middleware/authMiddleware.js';
const router = express.Router();
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many chat requests. Please slow down.' }, keyGenerator: (req) => req.user?.id || req.ip });
router.post('/completions', protect, chatLimiter, proxyChatCompletion);
export default router;

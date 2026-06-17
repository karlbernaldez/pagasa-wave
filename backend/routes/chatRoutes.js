import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { proxyChatCompletion } from '../controllers/chatController.js';
import protect from '../middleware/authMiddleware.js';
import { requireInternalChatAccess } from '../middleware/internalChatMiddleware.js';

const router = express.Router();

const publicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Public chat rate limit exceeded.' },
});

const internalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  message: { message: 'Chat rate limit exceeded.' },
});

router.post('/public', publicLimiter, proxyChatCompletion);
router.post('/internal', protect, requireInternalChatAccess, internalLimiter, proxyChatCompletion);

export default router;

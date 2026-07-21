import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { isChatbotEnabled } from '../config/featureFlags.js';
import protect from '../middleware/authMiddleware.js';
import { requireInternalChatAccess } from '../middleware/internalChatMiddleware.js';

const router = express.Router();

const requireChatbotEnabled = (req, res, next) => {
  if (!isChatbotEnabled()) {
    return res.status(404).json({ message: 'Route not found' });
  }
  return next();
};

const proxyChatCompletion = async (req, res, next) => {
  try {
    const { proxyChatCompletion: handleChatCompletion } = await import(
      '../controllers/chatController.js'
    );
    return handleChatCompletion(req, res, next);
  } catch (error) {
    return next(error);
  }
};

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

router.use(requireChatbotEnabled);

router.post('/public', publicLimiter, proxyChatCompletion);
router.post('/internal', protect, requireInternalChatAccess, internalLimiter, proxyChatCompletion);

export default router;

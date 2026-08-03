import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import authenticate from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/adminMiddleware.js';
import { createStyledPdfBuffer } from '../utils/pdfGenerator.js';

const router = express.Router();

const pdfGenerationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  message: { message: 'Too many PDF generation requests. Try again later.' },
});

router.use(authenticate);
router.use(requireRole('forecaster', 'admin'));

router.get('/generate', pdfGenerationLimiter, async (req, res, next) => {
  try {
    const pdfBuffer = await createStyledPdfBuffer({
      reportTitle: req.query.reportTitle || req.query.title || 'Wave Charts Report',
      reportDateText: req.query.reportDateText || req.query.date || '1100000UTC FEB 2026 - WW3',
      preparedByName: req.query.preparedByName || 'KARL SANTIAGO B. BERNALDEZ',
      preparedByTitle: req.query.preparedByTitle || 'Technical Specialist I',
      certifiedByName: req.query.certifiedByName || 'JEHAN FE S. PANTI',
      certifiedByTitle: req.query.certifiedByTitle || 'Weather Specialist II',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="wave-charts-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;

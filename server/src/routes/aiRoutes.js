import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  parseVisit,
  suggestSlots,
  getWeeklySummary,
  handoverNote,
} from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Rate limiter for AI routes to ensure sensible usage and safety
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a moment before trying again.',
  },
});

router.use(aiRateLimiter);

router.post('/parse-visit', parseVisit);
router.post('/suggest-slots', suggestSlots);
router.get('/weekly-summary', getWeeklySummary);
router.post('/weekly-summary/regenerate', getWeeklySummary);
router.post('/handover-note', handoverNote);

export default router;

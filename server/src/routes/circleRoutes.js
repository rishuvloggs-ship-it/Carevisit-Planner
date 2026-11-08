import express from 'express';
import {
  createCircle,
  getMyCircles,
  getCircleById,
  updateCircle,
  addMember,
  removeMember,
} from '../controllers/circleController.js';
import { getCircleVisits, createVisit } from '../controllers/visitController.js';
import { getCircleTimeline } from '../controllers/timelineController.js';
import { getCircleDashboard } from '../controllers/dashboardController.js';
import { getWeeklySummary } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/auth.js';
import { circleAuthMiddleware, requireCircleRole } from '../middleware/circleAuth.js';
import {
  validateRequest,
  createCircleSchema,
  addMemberSchema,
  visitSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.use(authMiddleware);

// Circle list & creation
router.get('/', getMyCircles);
router.post('/', validateRequest(createCircleSchema), createCircle);

// Circle-scoped routes (guarded by circle membership)
router.get('/:id', circleAuthMiddleware, getCircleById);
router.put('/:id', circleAuthMiddleware, requireCircleRole(['Family Admin']), updateCircle);

// Members management
router.post(
  '/:id/members',
  circleAuthMiddleware,
  requireCircleRole(['Family Admin']),
  validateRequest(addMemberSchema),
  addMember
);
router.delete(
  '/:id/members/:userId',
  circleAuthMiddleware,
  requireCircleRole(['Family Admin']),
  removeMember
);

// Visits in circle
router.get('/:id/visits', circleAuthMiddleware, getCircleVisits);
router.post(
  '/:id/visits',
  circleAuthMiddleware,
  requireCircleRole(['Family Admin', 'Caregiver']),
  validateRequest(visitSchema),
  createVisit
);

// Timeline & Dashboard
router.get('/:id/timeline', circleAuthMiddleware, getCircleTimeline);
router.get('/:id/dashboard', circleAuthMiddleware, getCircleDashboard);

// AI Summary for Circle
router.get('/:id/ai/weekly-summary', circleAuthMiddleware, getWeeklySummary);

export default router;

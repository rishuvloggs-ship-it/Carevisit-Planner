import express from 'express';
import {
  checkConflictsEndpoint,
  getVisitById,
  updateVisit,
  deleteVisit,
} from '../controllers/visitController.js';
import { addTaskToVisit } from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.js';
import { circleAuthMiddleware, requireCircleRole } from '../middleware/circleAuth.js';
import {
  validateRequest,
  checkConflictsSchema,
  taskSchema,
} from '../middleware/validate.js';

const router = express.Router();

router.use(authMiddleware);

// Preview/Check conflicts endpoint (no visitId required yet)
router.post('/check-conflicts', validateRequest(checkConflictsSchema), checkConflictsEndpoint);

// Single visit operations
router.get('/:id', circleAuthMiddleware, getVisitById);
router.put(
  '/:id',
  circleAuthMiddleware,
  requireCircleRole(['Family Admin', 'Caregiver']),
  updateVisit
);
router.delete(
  '/:id',
  circleAuthMiddleware,
  requireCircleRole(['Family Admin', 'Caregiver']),
  deleteVisit
);

// Tasks under a visit
router.post(
  '/:id/tasks',
  circleAuthMiddleware,
  requireCircleRole(['Family Admin', 'Caregiver']),
  validateRequest(taskSchema),
  addTaskToVisit
);

export default router;

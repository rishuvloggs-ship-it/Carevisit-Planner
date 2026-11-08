import express from 'express';
import { toggleCompleteTask, deleteTask } from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.patch('/:id/complete', toggleCompleteTask);
router.delete('/:id', deleteTask);

export default router;

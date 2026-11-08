import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, registerSchema, loginSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', authMiddleware, getMe);

export default router;

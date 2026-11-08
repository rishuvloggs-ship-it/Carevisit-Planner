import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import circleRoutes from './routes/circleRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Security and utility middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health Check (handles both /api/health and /health)
app.get(['/api/health', '/health', '/api', '/'], (req, res) => {
  res.json({
    status: 'ok',
    app: 'CareVisit Planner API',
    time: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
  });
});

// Mount Routes supporting both with and without '/api' prefix (handles any Vercel rewrite variation)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/circles', '/circles'], circleRoutes);
app.use(['/api/visits', '/visits'], visitRoutes);
app.use(['/api/tasks', '/tasks'], taskRoutes);
app.use(['/api/ai', '/ai'], aiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

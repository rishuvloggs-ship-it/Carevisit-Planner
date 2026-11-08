import app from './app.js';
import { connectDB, isDBConnected } from './config/db.js';
import { User } from './models/User.js';
import { seedDatabase } from './seed.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Auto-seed only if MongoDB is actually connected and empty
    if (isDBConnected()) {
      try {
        const userCount = await User.countDocuments().maxTimeMS(1500);
        if (userCount === 0) {
          console.log('[Server] MongoDB is empty, seeding demo data automatically...');
          await seedDatabase();
        }
      } catch (err) {
        console.warn('[Server] DB count check bypassed:', err.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`[Server] CareVisit Planner backend running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[Server] Startup error:', err);
    // Continue running app even on DB init error
    app.listen(PORT, () => {
      console.log(`[Server] Backend listening in resilient fallback mode on port ${PORT}`);
    });
  }
};

startServer();

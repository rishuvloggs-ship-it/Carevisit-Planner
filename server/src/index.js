import app from './app.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { seedDatabase } from './seed.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Auto-seed if database is currently empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty, seeding demo data automatically...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`[Server] CareVisit Planner backend running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
};

startServer();

import mongoose from 'mongoose';

let memoryServer = null;

// Prevent 10,000ms buffering hang when disconnected
mongoose.set('bufferTimeoutMS', 2500);

export const isDBConnected = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
  if (isDBConnected()) return;

  const uri = process.env.MONGODB_URI;

  // If no cloud MONGODB_URI is provided or if in serverless environment without mongod
  if (!uri && process.env.VERCEL) {
    console.log('[Database] Running on Vercel Serverless without MONGODB_URI. Using resilient in-memory data store.');
    return;
  }

  const targetUri = uri || 'mongodb://127.0.0.1:27017/carevisit_planner';

  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] MongoDB connected successfully to: ${targetUri}`);
  } catch (err) {
    console.warn(`[Database] Standard MongoDB connection failed (${err.message}).`);
    
    // Only attempt memoryServer if not in serverless environment
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri();
        await mongoose.connect(memoryUri);
        console.log(`[Database] In-memory MongoDB connected successfully at: ${memoryUri}`);
      } catch (memErr) {
        console.warn('[Database] In-memory MongoDB daemon not available. Falling back to internal mock data store.');
      }
    } else {
      console.log('[Database] Cloud serverless environment detected. Using resilient in-memory data store.');
    }
  }
};

export const disconnectDB = async () => {
  try {
    if (isDBConnected()) {
      await mongoose.disconnect();
    }
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (err) {
    console.error('[Database] Error disconnecting DB:', err);
  }
};

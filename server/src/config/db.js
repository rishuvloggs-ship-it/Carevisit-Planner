import mongoose from 'mongoose';

let memoryServer = null;

// COMPLETELY DISABLE QUERY BUFFERING: Mongoose will NEVER hang for 10000ms
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 1500);

export const isDBConnected = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
  if (isDBConnected()) return;

  const uri = process.env.MONGODB_URI;

  // In Vercel serverless without an external MongoDB Atlas cluster
  if (!uri && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
    console.log('[Database] Cloud serverless environment detected without external MONGODB_URI. Using resilient in-memory data store.');
    return;
  }

  const targetUri = uri || 'mongodb://127.0.0.1:27017/carevisit_planner';

  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 2000,
      bufferCommands: false,
    });
    console.log(`[Database] MongoDB connected successfully to: ${targetUri}`);
  } catch (err) {
    console.warn(`[Database] Standard MongoDB connection failed (${err.message}).`);
    
    // In local non-serverless mode, attempt in-memory server
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri();
        await mongoose.connect(memoryUri, {
          serverSelectionTimeoutMS: 2000,
          bufferCommands: false,
        });
        console.log(`[Database] In-memory MongoDB connected successfully at: ${memoryUri}`);
      } catch (memErr) {
        console.warn('[Database] In-memory MongoDB daemon not available. Falling back to internal mock data store.');
      }
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

import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

let isConnecting = false;

export default async function handler(req, res) {
  if (!isConnecting) {
    isConnecting = true;
    connectDB().catch((err) => {
      console.warn('[Vercel Serverless] DB connection notice:', err.message);
    });
  }
  return app(req, res);
}

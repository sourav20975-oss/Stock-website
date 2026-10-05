import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[MongoDB] No MONGO_URI specified in environment. Running with local fallback store.');
    return false;
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB Atlas cluster...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to Atlas: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.warn('[MongoDB] Warning: Failed to connect to MongoDB Atlas:', err.message);
    console.warn('[MongoDB] Server will continue running using in-memory store so development remains uninterrupted.');
    return false;
  }
}

export function isDbConnected() {
  return isConnected;
}

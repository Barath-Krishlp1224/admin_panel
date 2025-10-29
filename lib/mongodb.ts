import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/employeetasks";

if (!MONGODB_URI) {
  throw new Error("❌ Missing environment variable: MONGODB_URI");
}

// Global caching to prevent multiple connections in dev/hot reload
let cached = (global as any)._mongooseCache;

if (!cached) {
  cached = (global as any)._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        dbName: process.env.DB_NAME || "employeetasks",
      })
      .then((mongooseInstance) => {
        console.log("✅ MongoDB Connected");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
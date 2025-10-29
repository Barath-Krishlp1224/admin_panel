import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/employeetasks";

if (!MONGODB_URI) throw new Error("Please define MONGODB_URI");

let cached = (global as any).mongoose;

if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  console.log("✅ MongoDB Connected");
  return cached.conn;
}

// Named exports
export { connectDB, mongoose };

// Optional default export
export default connectDB;
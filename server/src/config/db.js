const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  try {
    if (!cached.promise) {
      cached.promise = mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/marketplace"
      );
    }

    const conn = await cached.promise;
    cached.conn = conn;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;

import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas (or local fallback if MONGODB_URI points locally)
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';
    
    // Mask credentials in console for security and privacy
    const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[Database] Connecting to MongoDB: ${maskedUri}`);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] Connected successfully: Host ${conn.connection.host}, Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // Don't exit process in tests or dev to allow inspection
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
  } catch (error) {
    console.error(`[Database Error] Error closing connection: ${error.message}`);
  }
};

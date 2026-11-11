import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas (or local fallback if MONGODB_URI points locally)
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_allergy_detection';

  // Mask credentials in console for security and privacy
  const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`[Database] Connecting to MongoDB: ${maskedUri}`);

  // Helpful diagnostic check for common Atlas placeholder issues
  if (mongoUri.includes('@cluster0.mongodb.net')) {
    console.warn(
      '[Database Warning] The hostname "cluster0.mongodb.net" is likely a placeholder. ' +
        'Real MongoDB Atlas hostnames include a unique cluster shard ID (e.g. cluster0.abcde.mongodb.net). ' +
        'Please verify your MONGODB_URI in Render environment variables.'
    );
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'food_allergy_detection',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `[Database] Connected successfully: Host ${conn.connection.host}, Database: ${conn.connection.name}`
    );
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // Do not call process.exit(1); keep server alive to serve diagnostic health checks
    return null;
  }
};

// Monitor connection lifecycle events
mongoose.connection.on('connected', () => {
  console.log('[Database Event] Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Event] Mongoose error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database Event] Mongoose connection lost.');
});

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
  } catch (error) {
    console.error(`[Database Error] Error closing connection: ${error.message}`);
  }
};

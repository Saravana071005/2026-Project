import mongoose from 'mongoose';

/**
 * Middleware to verify database connectivity before executing database-dependent operations.
 * Prevents requests from hanging indefinitely on Mongoose query buffers when Atlas is unreachable.
 */
export const requireDbConnection = (req, res, next) => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    const isConnecting = mongoose.connection.readyState === 2;
    return res.status(503).json({
      success: false,
      message: isConnecting
        ? 'Database connection is currently initializing. Please try again in a few moments.'
        : 'Database service is temporarily unavailable. Please verify the MongoDB Atlas connection string and network access (IP whitelist) in Render settings.',
    });
  }
  next();
};

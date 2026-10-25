import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import allergyRoutes from './routes/allergyRoutes.js';
import medicalTestRoutes from './routes/medicalTestRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// CORS configuration - support local dev and production client URL (strip trailing slashes)
const configuredClientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredClientUrls])];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.indexOf(normalizedOrigin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check handler for Render and load balancers
const healthCheckHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbState = dbStatusMap[mongoose.connection.readyState] || 'unknown';

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    service: 'Food Allergy Detection System API',
    database: `MongoDB (${dbState})`,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/allergies', allergyRoutes);
app.use('/api/medical-tests', medicalTestRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID format.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Food Allergy Detection Backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

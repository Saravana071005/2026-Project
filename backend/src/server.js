import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import { requireDbConnection } from './middleware/dbCheckMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import allergyRoutes from './routes/allergyRoutes.js';
import medicalTestRoutes from './routes/medicalTestRoutes.js';
import medicalReportRoutes from './routes/medicalReportRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking)
connectDB();

// CORS configuration - support local dev and production client URL (strip trailing slashes)
const configuredClientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
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
      // Allow requests with no origin (mobile apps, curl, server-to-server, Render health checks)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Allow if explicitly configured, in development mode, or matching Render domains
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        process.env.NODE_ENV !== 'production' ||
        normalizedOrigin.endsWith('.onrender.com');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check handler for Render and monitoring
const healthCheckHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbState = dbStatusMap[mongoose.connection.readyState] || 'unknown';

  // Return HTTP 200 so Render health check probes succeed while exposing exact state
  res.status(200).json({
    status: isDbConnected ? 'ok' : 'degraded',
    service: 'Food Allergy Detection System API',
    database: `MongoDB (${dbState})`,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// API Routes protected by database readiness check
app.use('/api/auth', requireDbConnection, authRoutes);
app.use('/api/user', requireDbConnection, userRoutes);
app.use('/api/allergies', requireDbConnection, allergyRoutes);
app.use('/api/medical-tests', requireDbConnection, medicalTestRoutes);
app.use('/api/medical-reports', requireDbConnection, medicalReportRoutes);

// Serve static frontend files if built (for monolithic or production single-service hosting)
const candidateDistPaths = [
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist'),
];
const distPath = candidateDistPaths.find((p) => fs.existsSync(p));

if (distPath) {
  console.log(`[Static Serving] Serving production frontend build from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback: All non-API GET requests serve frontend index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler for unknown routes (strictly for unhandled API or non-GET requests)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err, req, res, _next) => {
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

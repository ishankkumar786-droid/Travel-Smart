const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { clerkMiddleware } = require('@clerk/express');

const connectDB = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

// Import routes
const authRoutes = require('./routes/auth');
const itineraryRoutes = require('./routes/itinerary');
const tripRoutes = require('./routes/trips');
const chatRoutes = require('./routes/chat');
const nearbyRoutes = require('./routes/nearby');
const contributionRoutes = require('./routes/contributions');
const journalRoutes = require('./routes/journal');
const uploadRoutes = require('./routes/upload');

const app = express();

// --------------- Middleware ---------------

// Global Clerk Middleware
app.use(clerkMiddleware());

// Security headers
app.use(helmet());

// CORS — allow all origins in development
app.use(
  cors({
    origin: NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    credentials: true,
  })
);

// Request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
// app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});

// --------------- Routes ---------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Travel Companion API is running! 🚀',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Auth routes
app.use('/api/auth', authLimiter, authRoutes);

// Itinerary generation
app.use('/api/itinerary', itineraryRoutes);

// Journal entries (nested under trips) — Must be above tripRoutes to avoid shadowing
app.use('/api/trips', journalRoutes);

// Trip CRUD (save/load)
app.use('/api/trips', tripRoutes);

// Contextual chat
app.use('/api/chat', chatRoutes);

// Nearby places
app.use('/api/nearby', nearbyRoutes);

// User contributions
app.use('/api/contributions', contributionRoutes);

// Image uploads
app.use('/api/upload', uploadRoutes);

// --------------- Error Handling ---------------

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong',
  });
});

// --------------- Start Server ---------------

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${NODE_ENV}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;

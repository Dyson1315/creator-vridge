import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { DatabaseService } from './services/databaseService';
import recommendationRoutes from './routes/recommendations';
import batchRoutes from './routes/batch';

const app = express();
const PORT = process.env.PORT || 8000;

// Database service
const db = new DatabaseService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://creatorvridge.com']
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS violation: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Basic JSON bomb protection
    if (buf && buf.length > 0) {
      const jsonString = buf.toString();
      const openBraces = (jsonString.match(/\\{/g) || []).length;
      const closeBraces = (jsonString.match(/\\}/g) || []).length;
      
      if (openBraces > 1000 || closeBraces > 1000 || openBraces !== closeBraces) {
        throw new Error('Potentially malicious JSON structure');
      }
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'ai-recommendation-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: 'disconnected'
  };

  // Check database connection
  try {
    await db.connect();
    health.database = 'connected';
  } catch (error) {
    health.database = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CreatorVridge AI Recommendation Service',
    version: '1.0.0',
    description: 'Unified AI service for real-time recommendations and batch processing',
    endpoints: {
      '/': 'Service information',
      '/health': 'Health check',
      '/api': 'API routes',
      '/batch': 'Batch processing management'
    },
    documentation: '/api/info',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', recommendationRoutes);
app.use('/batch', batchRoutes);

// Compatibility routes (for external systems)
app.use('/recommendations', recommendationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    service: 'ai-recommendation-service'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Rate limit errors
  if (err.message?.includes('Too many requests')) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later'
    });
  }
  
  // JSON parsing errors
  if (err.name === 'SyntaxError' && err.message?.includes('JSON')) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }
  
  // CORS errors
  if (err.message?.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    service: 'ai-recommendation-service',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down AI service gracefully...');
  
  try {
    await db.disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error during database disconnection:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      // Initialize database connection
      await db.connect();
      console.log('✅ Database connected successfully');
      
      app.listen(PORT, () => {
        console.log(`🚀 CreatorVridge AI Service running on port ${PORT}`);
        console.log(`📚 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        console.log(`📖 API info: http://localhost:${PORT}/api/info`);
        console.log(`⚙️ Batch management: http://localhost:${PORT}/batch/info`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔑 API Key required: X-API-Key header');
          console.log(`🔑 Current API Key: ${process.env.AI_API_KEY}`);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to start AI service:', error);
      process.exit(1);
    }
  })();
}

export default app;
export { db };
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import matchRoutes from './routes/matches';

// Import security middleware
import { apiRateLimit } from './middleware/rateLimiter';
import { 
  securityHeaders, 
  sanitizeRequest, 
  bruteForceProtection,
  pathTraversalProtection,
  csrfProtection,
  requestSizeLimiter
} from './middleware/security';
import { auditMiddleware, AuditLogger } from './utils/auditLogger';

// Load environment variables
dotenv.config();

const app = express();
let prisma: PrismaClient | null = null;

// Initialize Prisma client only if database is available
try {
  prisma = new PrismaClient();
  console.log('✅ Database connection initialized');
} catch (error) {
  console.log('⚠️ Database not available - running in API-only mode');
}

const PORT = process.env.PORT || 3001;

// Log system startup
AuditLogger.logSystem('SERVER_START', `CreatorVridge API starting on port ${PORT}`, 'INFO', {
  nodeEnv: process.env.NODE_ENV,
  nodeVersion: process.version,
  port: PORT
});

// Trust proxy for accurate IP addresses (if behind reverse proxy)
app.set('trust proxy', 1);

// Early security middleware
app.use(bruteForceProtection);
app.use(pathTraversalProtection);
app.use(requestSizeLimiter(50 * 1024 * 1024)); // 50MB max request size
app.use(securityHeaders);

// Enhanced Helmet configuration
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
    reportOnly: false
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration with enhanced security
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://creatorvridge.com']
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log CORS violation without request object to avoid errors
      console.warn(`🚫 CORS violation: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
}));

// Request sanitization and CSRF protection
app.use(sanitizeRequest);
app.use(csrfProtection);

// Rate limiting
app.use(apiRateLimit);

// Body parsing middleware with security limits
app.use(express.json({ 
  limit: process.env.MAX_JSON_SIZE || '10mb',
  verify: (req, res, buf, encoding) => {
    // Check for JSON bomb attacks
    if (buf && buf.length > 0) {
      const jsonString = buf.toString();
      // Check for excessive nesting or repetition
      const openBraces = (jsonString.match(/\{/g) || []).length;
      const closeBraces = (jsonString.match(/\}/g) || []).length;
      
      if (openBraces > 1000 || closeBraces > 1000 || openBraces !== closeBraces) {
        throw new Error('Potentially malicious JSON structure');
      }
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_URL_ENCODED_SIZE || '10mb' 
}));

// Audit logging middleware (before routes)
app.use(auditMiddleware);

// Enhanced logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => {
        AuditLogger.logSystem('HTTP_REQUEST', message.trim(), 'INFO');
      }
    }
  }));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: 'disconnected'
  };

  // Check database connection if available
  if (prisma) {
    try {
      await prisma.$connect();
      health.database = 'connected';
    } catch (error) {
      health.database = 'error';
    }
  }

  res.status(200).json(health);
});

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/matches', matchRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CreatorVridge API',
    version: '1.0.0',
    docs: '/api/v1/docs',
    health: '/health'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists'
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 CreatorVridge API Server running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
export { prisma };
// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

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

const app = express();
const PORT = process.env.PORT || 3001;

// Backend service configuration
const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:3002';

// Log system startup
AuditLogger.logSystem('GATEWAY_START', `CreatorVridge API Gateway starting on port ${PORT}`, 'INFO', {
  nodeEnv: process.env.NODE_ENV,
  nodeVersion: process.version,
  port: PORT,
  backendService: BACKEND_SERVICE_URL
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
  : ['http://localhost:3000', 'http://localhost:3002', 'http://127.0.0.1:3000', 'http://127.0.0.1:3002'];

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

// Health check endpoint (standalone)
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    backend: 'checking'
  };

  // Check backend service connection
  try {
    const fetch = await import('node-fetch');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch.default(`${BACKEND_SERVICE_URL}/health`, { 
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      health.backend = 'connected';
    } else {
      health.backend = 'error';
      health.status = 'degraded';
    }
  } catch (error) {
    health.backend = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CreatorVridge API Gateway',
    version: '1.0.0',
    description: 'Routes requests to backend services',
    backend: BACKEND_SERVICE_URL,
    health: '/health'
  });
});

// Proxy middleware configuration
const backendProxy = createProxyMiddleware({
  target: BACKEND_SERVICE_URL,
  changeOrigin: true,
  secure: false
} as any);

// API Routes - proxy all /api requests to backend
app.use('/api', backendProxy);

// Static file requests - proxy to backend
app.use('/uploads', backendProxy);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    service: 'api-gateway'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway Error:', err);
  
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
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down API Gateway gracefully...');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 CreatorVridge API Gateway running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🎯 Backend service: ${BACKEND_SERVICE_URL}`);
  });
}

export default app;
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiting configuration from environment variables
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const RATE_LIMIT_MAX_AUTH = parseInt(process.env.RATE_LIMIT_MAX_AUTH || '5');
const RATE_LIMIT_MAX_API = parseInt(process.env.RATE_LIMIT_MAX_API || '100');

// Custom rate limiter message
const rateLimitMessage = {
  error: 'Rate limit exceeded',
  message: 'Too many requests from this IP, please try again later.'
};

// Authentication endpoints rate limiter (stricter) - IPv6 compatible
export const authRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (IPv6 compatible)
  skipSuccessfulRequests: true,
  // Additional security headers
  handler: (req: Request, res: Response) => {
    console.warn(`Authentication rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    
    // Log potential brute force attempt
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      type: 'AUTH_RATE_LIMIT_EXCEEDED'
    };
    console.log('SECURITY_EVENT:', JSON.stringify(logData));
    
    return res.status(429).json(rateLimitMessage);
  }
});

// General API rate limiter - IPv6 compatible
export const apiRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_API,
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (IPv6 compatible)
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    console.warn(`API rate limit exceeded for IP: ${req.ip}`);
    
    // Log high usage pattern
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      type: 'API_RATE_LIMIT_EXCEEDED'
    };
    console.log('SECURITY_EVENT:', JSON.stringify(logData));
    
    return res.status(429).json(rateLimitMessage);
  }
});

// Strict rate limiter for sensitive operations - IPv6 compatible
export const strictRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 3, // Very low limit for sensitive operations
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (IPv6 compatible)
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    console.error(`Strict rate limit exceeded for IP: ${req.ip} on sensitive endpoint: ${req.originalUrl}`);
    
    // Log critical security event
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      type: 'STRICT_RATE_LIMIT_EXCEEDED',
      severity: 'HIGH'
    };
    console.error('CRITICAL_SECURITY_EVENT:', JSON.stringify(logData));
    
    return res.status(429).json(rateLimitMessage);
  }
});

// File upload rate limiter - IPv6 compatible
export const uploadRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10, // Limited file uploads
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (IPv6 compatible)
  skipSuccessfulRequests: false,
  handler: (req: Request, res: Response) => {
    return res.status(429).json(rateLimitMessage);
  }
});

// Export rate limit configuration for monitoring
export const rateLimitConfig = {
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxAuth: RATE_LIMIT_MAX_AUTH,
  maxApi: RATE_LIMIT_MAX_API
};
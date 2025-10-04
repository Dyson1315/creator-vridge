import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

// Enhanced security middleware collection
export class SecurityMiddleware {
  
  // IP whitelist for admin operations
  private static adminWhitelist: string[] = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
  
  // Suspicious IP tracking (in production, use Redis or database)
  private static suspiciousIPs = new Map<string, { attempts: number; lastAttempt: Date; blocked: boolean }>();
  
  // Security headers middleware
  static securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none'"
    );
    
    // Additional security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Remove server fingerprinting
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'CreatorVridge-API');
    
    next();
  };
  
  // Request sanitization middleware
  static sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize query parameters
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = validator.escape(req.query[key] as string);
      }
    }
    
    // Sanitize URL parameters
    for (const key in req.params) {
      req.params[key] = validator.escape(req.params[key]);
    }
    
    // Log suspicious user agents
    const userAgent = req.get('User-Agent') || '';
    const suspiciousAgents = ['sqlmap', 'nmap', 'burp', 'nikto', 'dirbuster'];
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      this.logSecurityEvent(req, 'SUSPICIOUS_USER_AGENT', { userAgent });
    }
    
    next();
  };
  
  // Brute force protection
  static bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = new Date();
    
    // Check if IP is in suspicious list
    const suspiciousData = this.suspiciousIPs.get(ip);
    
    if (suspiciousData) {
      // If blocked and not expired (24 hours), deny access
      if (suspiciousData.blocked && 
          (now.getTime() - suspiciousData.lastAttempt.getTime()) < 24 * 60 * 60 * 1000) {
        this.logSecurityEvent(req, 'BLOCKED_IP_ATTEMPT', { ip, attempts: suspiciousData.attempts });
        return res.status(429).json({
          error: 'Access Denied',
          message: 'IP temporarily blocked due to suspicious activity'
        });
      }
      
      // Reset if expired
      if ((now.getTime() - suspiciousData.lastAttempt.getTime()) > 24 * 60 * 60 * 1000) {
        this.suspiciousIPs.delete(ip);
      }
    }
    
    next();
  };
  
  // Admin IP restriction
  static restrictToAdminIPs = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || '';
    
    if (this.adminWhitelist.length > 0 && !this.adminWhitelist.includes(ip)) {
      this.logSecurityEvent(req, 'UNAUTHORIZED_ADMIN_ACCESS', { ip });
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Admin access restricted to authorized IPs'
      });
    }
    
    next();
  };
  
  // Record failed authentication attempt
  static recordFailedAuth = (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = new Date();
    
    const currentData = this.suspiciousIPs.get(ip) || { attempts: 0, lastAttempt: now, blocked: false };
    currentData.attempts += 1;
    currentData.lastAttempt = now;
    
    // Block after 10 failed attempts
    if (currentData.attempts >= 10) {
      currentData.blocked = true;
      this.logSecurityEvent(req, 'IP_BLOCKED_BRUTE_FORCE', { 
        ip, 
        attempts: currentData.attempts 
      });
    }
    
    this.suspiciousIPs.set(ip, currentData);
  };
  
  // Log security events
  private static logSecurityEvent = (req: Request, eventType: string, details: any) => {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      eventType,
      details,
      headers: {
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-real-ip': req.get('X-Real-IP'),
        'authorization': req.get('Authorization') ? 'PRESENT' : 'MISSING'
      }
    };
    console.warn('SECURITY_EVENT:', JSON.stringify(logData));
  };
  
  // Request size limiter
  static requestSizeLimiter = (maxSize: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = parseInt(req.get('content-length') || '0');
      
      if (contentLength > maxSize) {
        this.logSecurityEvent(req, 'REQUEST_TOO_LARGE', { 
          size: contentLength, 
          maxAllowed: maxSize 
        });
        return res.status(413).json({
          error: 'Payload Too Large',
          message: `Request size ${contentLength} exceeds maximum allowed ${maxSize}`
        });
      }
      
      next();
    };
  };
  
  // Path traversal protection
  static pathTraversalProtection = (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl || req.url;
    const pathTraversalPatterns = [
      '../', '..\\', '..%2f', '..%2F', '..%5c', '..%5C',
      '%2e%2e%2f', '%2e%2e%5c', '%2e%2e/', '%2e%2e\\',
      'etc/passwd', 'windows/system32', 'boot.ini'
    ];
    
    const hasPathTraversal = pathTraversalPatterns.some(pattern => 
      url.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (hasPathTraversal) {
      this.logSecurityEvent(req, 'PATH_TRAVERSAL_ATTEMPT', { url });
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'Path traversal attempt detected'
      });
    }
    
    next();
  };
  
  // CSRF protection for state-changing operations
  static csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.get('Origin');
      const referer = req.get('Referer');
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
      
      if (!origin && !referer) {
        this.logSecurityEvent(req, 'MISSING_ORIGIN_REFERER', {});
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Origin or Referer header required'
        });
      }
      
      const sourceOrigin = origin || (referer ? new URL(referer).origin : '');
      if (!allowedOrigins.includes(sourceOrigin)) {
        this.logSecurityEvent(req, 'INVALID_ORIGIN', { origin: sourceOrigin });
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid request origin'
        });
      }
    }
    
    next();
  };
}

// Export individual middleware functions for convenience
export const {
  securityHeaders,
  sanitizeRequest,
  bruteForceProtection,
  restrictToAdminIPs,
  pathTraversalProtection,
  csrfProtection,
  requestSizeLimiter
} = SecurityMiddleware;
import { Request } from 'express';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { IPAnonymizer } from './ipAnonymizer';

export interface AuditLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  category: string;
  action: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  message: string;
  metadata?: Record<string, any>;
  requestId?: string;
}

export class AuditLogger {
  private static logDir = process.env.AUDIT_LOG_DIR || './logs';
  private static maxLogSize = parseInt(process.env.MAX_LOG_SIZE || '10485760'); // 10MB
  private static maxLogFiles = parseInt(process.env.MAX_LOG_FILES || '30');
  
  static {
    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  /**
   * Log authentication events
   */
  static logAuth(action: string, req: Request, userId?: string, userEmail?: string, success = true, metadata?: Record<string, any>) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: success ? 'INFO' : 'WARN',
      category: 'AUTHENTICATION',
      action,
      userId,
      userEmail,
      ip: IPAnonymizer.getAnonymizedIP(req, true),
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      message: `Authentication ${action} ${success ? 'succeeded' : 'failed'}`,
      metadata: {
        ...metadata,
        session: (req as any).sessionID || 'no-session',
        headers: {
          'x-forwarded-for': req.get('X-Forwarded-For'),
          'x-real-ip': req.get('X-Real-IP')
        }
      }
    };
    
    this.writeLog('auth', entry);
  }
  
  /**
   * Log data access events
   */
  static logDataAccess(action: string, resource: string, req: Request, userId?: string, success = true, metadata?: Record<string, any>) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: success ? 'INFO' : 'WARN',
      category: 'DATA_ACCESS',
      action,
      userId,
      ip: IPAnonymizer.getAnonymizedIP(req, true),
      endpoint: req.originalUrl,
      method: req.method,
      message: `Data access: ${action} on ${resource}`,
      metadata: {
        ...metadata,
        resource,
        queryParams: req.query,
        bodySize: req.get('content-length')
      }
    };
    
    this.writeLog('data', entry);
  }
  
  /**
   * Log security events
   */
  static logSecurity(eventType: string, req: Request, level: 'WARN' | 'ERROR' | 'CRITICAL' = 'WARN', metadata?: Record<string, any>) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: 'SECURITY',
      action: eventType,
      ip: IPAnonymizer.getAnonymizedIP(req, true),
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      message: `Security event: ${eventType}`,
      metadata: {
        ...metadata,
        headers: {
          'authorization': req.get('Authorization') ? 'PRESENT' : 'MISSING',
          'x-forwarded-for': req.get('X-Forwarded-For'),
          'x-real-ip': req.get('X-Real-IP'),
          'referer': req.get('Referer'),
          'origin': req.get('Origin')
        },
        requestBody: level === 'CRITICAL' ? req.body : undefined
      }
    };
    
    this.writeLog('security', entry);
    
    // For critical events, also log to console
    if (level === 'CRITICAL') {
      console.error('CRITICAL_SECURITY_EVENT:', JSON.stringify(entry));
    }
  }
  
  /**
   * Log system events
   */
  static logSystem(action: string, message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', metadata?: Record<string, any>) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: 'SYSTEM',
      action,
      message,
      metadata
    };
    
    this.writeLog('system', entry);
  }
  
  /**
   * Log API requests (for compliance and monitoring)
   */
  static logApiRequest(req: Request, res: any, responseTime: number, userId?: string) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'WARN' : 'INFO',
      category: 'API_REQUEST',
      action: 'REQUEST',
      userId,
      ip: IPAnonymizer.getAnonymizedIP(req, true),
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      message: `API ${req.method} ${req.originalUrl} - ${res.statusCode}`,
      metadata: {
        responseTime,
        contentLength: res.get('content-length'),
        queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
        bodySize: req.get('content-length')
      }
    };
    
    this.writeLog('api', entry);
  }
  
  /**
   * Write log entry to appropriate log file
   */
  private static writeLog(category: string, entry: AuditLogEntry) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${category}-${date}.log`;
    const filepath = join(this.logDir, filename);
    
    try {
      const logLine = JSON.stringify(entry) + '\n';
      
      // Check if log rotation is needed
      if (existsSync(filepath)) {
        const stats = require('fs').statSync(filepath);
        if (stats.size > this.maxLogSize) {
          this.rotateLog(filepath);
        }
      }
      
      appendFileSync(filepath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Fallback to console logging
      console.log('AUDIT_LOG:', JSON.stringify(entry));
    }
  }
  
  /**
   * Rotate log files when they exceed size limit
   */
  private static rotateLog(filepath: string) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = filepath.replace('.log', `-${timestamp}.log`);
      
      require('fs').renameSync(filepath, rotatedPath);
      
      // Clean up old log files
      this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }
  
  /**
   * Clean up old log files
   */
  private static cleanupOldLogs() {
    try {
      const fs = require('fs');
      const files = fs.readdirSync(this.logDir)
        .filter((file: string) => file.endsWith('.log'))
        .map((file: string) => ({
          name: file,
          path: join(this.logDir, file),
          time: fs.statSync(join(this.logDir, file)).mtime
        }))
        .sort((a: any, b: any) => b.time - a.time);
      
      // Remove files exceeding the maximum count
      if (files.length > this.maxLogFiles) {
        const filesToDelete = files.slice(this.maxLogFiles);
        filesToDelete.forEach((file: any) => {
          fs.unlinkSync(file.path);
          console.log(`Deleted old log file: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
  
  /**
   * Get client IP address considering proxies
   */
  private static getClientIP(req: Request): string {
    // Safety check: ensure req has the get method
    if (!req || typeof req.get !== 'function') {
      return req?.ip || 'unknown';
    }
    
    return (
      req.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.get('x-real-ip') ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
  
  /**
   * Search logs for security analysis
   */
  static searchLogs(criteria: {
    category?: string;
    action?: string;
    ip?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    level?: string;
  }): Promise<AuditLogEntry[]> {
    return new Promise((resolve, reject) => {
      try {
        const fs = require('fs');
        const results: AuditLogEntry[] = [];
        
        const logFiles = fs.readdirSync(this.logDir)
          .filter((file: any) => file.endsWith('.log'))
          .map((file: any) => join(this.logDir, file));
        
        for (const logFile of logFiles) {
          const content = fs.readFileSync(logFile, 'utf8');
          const lines = content.split('\n').filter((line: any) => line.trim());
          
          for (const line of lines) {
            try {
              const entry: AuditLogEntry = JSON.parse(line);
              
              // Apply filters
              if (criteria.category && entry.category !== criteria.category) continue;
              if (criteria.action && entry.action !== criteria.action) continue;
              if (criteria.ip && entry.ip !== criteria.ip) continue;
              if (criteria.userId && entry.userId !== criteria.userId) continue;
              if (criteria.level && entry.level !== criteria.level) continue;
              
              if (criteria.dateFrom && new Date(entry.timestamp) < criteria.dateFrom) continue;
              if (criteria.dateTo && new Date(entry.timestamp) > criteria.dateTo) continue;
              
              results.push(entry);
            } catch (parseError) {
              // Skip invalid log lines
              continue;
            }
          }
        }
        
        resolve(results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Middleware to automatically log API requests
export const auditMiddleware = (req: Request, res: any, next: any) => {
  const startTime = Date.now();
  
  // Capture the original res.end function
  const originalEnd = res.end;
  
  res.end = function(chunk: any, encoding: any) {
    const responseTime = Date.now() - startTime;
    const userId = (req as any).user?.userId;
    
    // Log the API request
    AuditLogger.logApiRequest(req, res, responseTime, userId);
    
    // Call the original end function
    originalEnd.call(res, chunk, encoding);
  };
  
  next();
};
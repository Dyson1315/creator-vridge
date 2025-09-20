/**
 * Security Configuration
 * Central configuration for all security-related settings
 */

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
    algorithm: string;
  };
  rateLimit: {
    windowMs: number;
    maxAuth: number;
    maxApi: number;
    maxStrict: number;
    maxUpload: number;
  };
  encryption: {
    bcryptRounds: number;
  };
  headers: {
    enabled: boolean;
    csp: {
      defaultSrc: string[];
      scriptSrc: string[];
      styleSrc: string[];
      imgSrc: string[];
      connectSrc: string[];
      fontSrc: string[];
      objectSrc: string[];
      mediaSrc: string[];
      frameSrc: string[];
    };
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  cors: {
    allowedOrigins: string[];
    allowCredentials: boolean;
    allowedMethods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
  };
  audit: {
    enabled: boolean;
    logDir: string;
    maxLogSize: number;
    maxLogFiles: number;
  };
  bruteForce: {
    maxAttempts: number;
    blockDurationMs: number;
    cleanupIntervalMs: number;
  };
  fileUpload: {
    maxSize: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
  };
  request: {
    maxJsonSize: string;
    maxUrlEncodedSize: string;
    maxRequestSize: number;
  };
}

// Default security configuration
const defaultConfig: SecurityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'creatorvridge-api',
    audience: process.env.JWT_AUDIENCE || 'creatorvridge-app',
    algorithm: 'HS256'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxAuth: parseInt(process.env.RATE_LIMIT_MAX_AUTH || '5'),
    maxApi: parseInt(process.env.RATE_LIMIT_MAX_API || '100'),
    maxStrict: 3,
    maxUpload: 10
  },
  encryption: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12')
  },
  headers: {
    enabled: process.env.SECURITY_HEADERS_ENABLED === 'true',
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  },
  cors: {
    allowedOrigins: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://creatorvridge.com'])
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowCredentials: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400 // 24 hours
  },
  audit: {
    enabled: process.env.AUDIT_LOGGING_ENABLED !== 'false',
    logDir: process.env.AUDIT_LOG_DIR || './logs',
    maxLogSize: parseInt(process.env.MAX_LOG_SIZE || '10485760'), // 10MB
    maxLogFiles: parseInt(process.env.MAX_LOG_FILES || '30')
  },
  bruteForce: {
    maxAttempts: parseInt(process.env.BRUTE_FORCE_MAX_ATTEMPTS || '10'),
    blockDurationMs: parseInt(process.env.BRUTE_FORCE_BLOCK_DURATION || '86400000'), // 24 hours
    cleanupIntervalMs: parseInt(process.env.BRUTE_FORCE_CLEANUP_INTERVAL || '3600000') // 1 hour
  },
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
    allowedExtensions: (process.env.ALLOWED_FILE_EXTENSIONS || 'jpg,jpeg,png,gif,pdf,doc,docx').split(','),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',')
  },
  request: {
    maxJsonSize: process.env.MAX_JSON_SIZE || '10mb',
    maxUrlEncodedSize: process.env.MAX_URL_ENCODED_SIZE || '10mb',
    maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '52428800') // 50MB
  }
};

/**
 * Security configuration validation
 */
export function validateSecurityConfig(config: SecurityConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate JWT secret
  if (config.jwt.secret === 'fallback-secret-key' && process.env.NODE_ENV === 'production') {
    errors.push('JWT_SECRET must be set in production environment');
  }

  if (config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long');
  }

  // Validate bcrypt rounds
  if (config.encryption.bcryptRounds < 10 || config.encryption.bcryptRounds > 15) {
    errors.push('BCRYPT_ROUNDS should be between 10 and 15');
  }

  // Validate rate limits
  if (config.rateLimit.maxAuth < 1 || config.rateLimit.maxAuth > 100) {
    errors.push('Auth rate limit should be between 1 and 100');
  }

  if (config.rateLimit.maxApi < 10 || config.rateLimit.maxApi > 10000) {
    errors.push('API rate limit should be between 10 and 10000');
  }

  // Validate CORS origins
  if (process.env.NODE_ENV === 'production' && config.cors.allowedOrigins.includes('http://localhost:3000')) {
    errors.push('Localhost origins should not be allowed in production');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get security configuration with validation
 */
export function getSecurityConfig(): SecurityConfig {
  const config = { ...defaultConfig };
  
  // Validate configuration
  const validation = validateSecurityConfig(config);
  
  if (!validation.valid) {
    console.error('Security configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid security configuration in production');
    } else {
      console.warn('Continuing with potentially insecure configuration in development mode');
    }
  }

  return config;
}

/**
 * Security headers configuration
 */
export function getSecurityHeaders() {
  const config = getSecurityConfig();
  
  return {
    contentSecurityPolicy: {
      directives: config.headers.csp,
      reportOnly: false
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: config.headers.hsts,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  };
}

/**
 * CORS configuration
 */
export function getCorsConfig() {
  const config = getSecurityConfig();
  
  return {
    origin: config.cors.allowedOrigins,
    credentials: config.cors.allowCredentials,
    methods: config.cors.allowedMethods,
    allowedHeaders: config.cors.allowedHeaders,
    exposedHeaders: config.cors.exposedHeaders,
    maxAge: config.cors.maxAge
  };
}

/**
 * Rate limiting configuration
 */
export function getRateLimitConfig() {
  const config = getSecurityConfig();
  
  return {
    windowMs: config.rateLimit.windowMs,
    auth: config.rateLimit.maxAuth,
    api: config.rateLimit.maxApi,
    strict: config.rateLimit.maxStrict,
    upload: config.rateLimit.maxUpload
  };
}

// Export the configuration
export const securityConfig = getSecurityConfig();

// Export validation function for runtime checks
export { validateSecurityConfig as validate };

/**
 * Security monitoring configuration
 */
export interface SecurityMonitoringConfig {
  suspiciousPatterns: string[];
  blockedUserAgents: string[];
  trustedProxies: string[];
  adminIpWhitelist: string[];
}

export const securityMonitoring: SecurityMonitoringConfig = {
  suspiciousPatterns: [
    'script', 'javascript:', 'onload', 'onerror', 'eval(',
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION',
    '../', '..\\', 'etc/passwd', 'cmd.exe', 'powershell',
    '<script', '</script>', 'document.cookie', 'window.location'
  ],
  blockedUserAgents: [
    'sqlmap', 'nmap', 'burp', 'nikto', 'dirbuster', 'gobuster',
    'dirb', 'wfuzz', 'w3af', 'skipfish', 'wpscan'
  ],
  trustedProxies: process.env.TRUSTED_PROXIES?.split(',') || [],
  adminIpWhitelist: process.env.ADMIN_IP_WHITELIST?.split(',') || []
};
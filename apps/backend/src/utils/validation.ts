import Joi from 'joi';
import { UserType } from '@prisma/client';
import validator from 'validator';
import xss from 'xss';
import { Request, Response, NextFunction } from 'express';

// Custom validators
const customValidators = {
  // Email validation with additional checks
  email: Joi.string()
    .custom((value, helpers) => {
      // Normalize and validate email
      if (!validator.isEmail(value)) {
        return helpers.error('any.invalid');
      }
      // Check for disposable email domains
      const disposableDomains = ['tempmail.org', '10minutemail.org', 'guerrillamail.com'];
      const domain = value.split('@')[1].toLowerCase();
      if (disposableDomains.includes(domain)) {
        return helpers.error('any.invalid');
      }
      return validator.normalizeEmail(value, { 
        gmail_remove_dots: false,
        gmail_remove_subaddress: false 
      });
    })
    .messages({
      'any.invalid': 'Please provide a valid email address from a permanent email provider'
    }),

  // Sanitized string validator
  sanitizedString: (min = 1, max = 255) => Joi.string()
    .min(min)
    .max(max)
    .custom((value, helpers) => {
      // Remove XSS attempts and normalize
      const sanitized = xss(value.trim(), {
        whiteList: {}, // No HTML tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
      });
      
      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
        /(\'|\"|;|--|\*|\|)/,
        /(\bOR\b|\bAND\b).*?(\=|\>|\<)/i
      ];
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(sanitized)) {
          return helpers.error('any.invalid');
        }
      }
      
      return sanitized;
    })
    .messages({
      'any.invalid': 'Invalid characters detected in input'
    })
};

// User registration validation
export const registerSchema = Joi.object({
  email: customValidators.email
    .required()
    .messages({
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128) // Prevent DoS attacks with extremely long passwords
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .custom((value, helpers) => {
      // Check for common weak passwords
      const weakPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
      if (weakPasswords.some(weak => value.toLowerCase().includes(weak.toLowerCase()))) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
      'any.invalid': 'Password is too weak or commonly used'
    }),
  
  userType: Joi.string()
    .valid(...Object.values(UserType))
    .required()
    .messages({
      'any.only': 'User type must be either VTUBER or ARTIST',
      'any.required': 'User type is required'
    }),
  
  displayName: customValidators.sanitizedString(2, 50)
    .optional()
    .messages({
      'string.min': 'Display name must be at least 2 characters',
      'string.max': 'Display name cannot exceed 50 characters'
    })
});

// User login validation
export const loginSchema = Joi.object({
  email: customValidators.email
    .required()
    .messages({
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .max(128) // Prevent DoS attacks
    .required()
    .messages({
      'any.required': 'Password is required',
      'string.max': 'Password is too long'
    })
});

// Profile update validation
export const profileUpdateSchema = Joi.object({
  displayName: customValidators.sanitizedString(2, 50)
    .optional()
    .messages({
      'string.min': 'Display name must be at least 2 characters',
      'string.max': 'Display name cannot exceed 50 characters'
    }),
  
  bio: customValidators.sanitizedString(0, 500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Bio cannot exceed 500 characters'
    }),
  
  skills: Joi.array()
    .items(customValidators.sanitizedString(1, 50))
    .max(20)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 20 skills'
    }),
  
  priceRangeMin: Joi.number()
    .min(1000)
    .max(1000000)
    .optional()
    .messages({
      'number.min': 'Minimum price must be at least ¥1,000',
      'number.max': 'Minimum price cannot exceed ¥1,000,000'
    }),
  
  priceRangeMax: Joi.number()
    .min(1000)
    .max(1000000)
    .when('priceRangeMin', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('priceRangeMin'))
    })
    .optional()
    .messages({
      'number.min': 'Maximum price must be at least ¥1,000',
      'number.max': 'Maximum price cannot exceed ¥1,000,000',
      'number.greater': 'Maximum price must be greater than minimum price'
    }),
  
  availability: Joi.string()
    .valid('AVAILABLE', 'BUSY', 'UNAVAILABLE')
    .optional()
    .messages({
      'any.only': 'Availability must be AVAILABLE, BUSY, or UNAVAILABLE'
    }),
  
  timezone: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Timezone cannot exceed 50 characters'
    }),
  
  preferredCommStyle: customValidators.sanitizedString(0, 200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Communication style preference cannot exceed 200 characters'
    }),
  
  experience: Joi.number()
    .min(0)
    .max(50)
    .optional()
    .messages({
      'number.min': 'Experience cannot be negative',
      'number.max': 'Experience cannot exceed 50 years'
    }),
  
  portfolioUrls: Joi.array()
    .items(Joi.string().uri().max(500))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 portfolio URLs',
      'string.uri': 'Portfolio URLs must be valid URLs',
      'string.max': 'Portfolio URL cannot exceed 500 characters'
    })
});

// Security logging function
const logSecurityEvent = (req: Request, eventType: string, details: any) => {
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
      'x-real-ip': req.get('X-Real-IP')
    }
  };
  console.warn('SECURITY_EVENT:', JSON.stringify(logData));
};

// Enhanced validation middleware with security logging
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log large payloads (potential DoS)
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 10000000) { // 10MB
      logSecurityEvent(req, 'LARGE_PAYLOAD_DETECTED', { size: contentLength });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });
    
    if (error) {
      // Log validation failures for security monitoring
      const suspiciousPatterns = [
        'script', 'javascript:', 'onload', 'onerror', 'eval(',
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION',
        '../', '..\\', 'etc/passwd', 'cmd.exe'
      ];
      
      const errorMessages = error.details.map(detail => detail.message).join(' ');
      const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
        errorMessages.toLowerCase().includes(pattern.toLowerCase()) ||
        JSON.stringify(req.body).toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (hasSuspiciousContent) {
        logSecurityEvent(req, 'SUSPICIOUS_INPUT_DETECTED', {
          validationErrors: error.details.map(detail => detail.message),
          payload: req.body
        });
      }
      
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details
      });
    }
    
    req.body = value;
    next();
  };
};

// Additional utility functions for security
export const sanitizeHtml = (input: string): string => {
  return xss(input, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  });
};

export const validateFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
};

export const sanitizeFilename = (filename: string): string => {
  // Remove dangerous characters and paths
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.\.+/g, '.')
    .replace(/^\.+/, '')
    .substring(0, 255);
};
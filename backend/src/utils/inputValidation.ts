import { z } from 'zod';
import { Request } from 'express';

/**
 * Comprehensive input validation utility for AI recommendation system
 * Provides strict validation, sanitization, and security checks
 */
export class InputValidation {
  
  // Maximum limits for security
  private static readonly MAX_LIMIT = 100;
  private static readonly MAX_STRING_LENGTH = 1000;
  private static readonly MAX_ARRAY_SIZE = 50;
  
  // Allowed values for enum-like fields
  private static readonly ALLOWED_CATEGORIES = [
    'illustration', 'character_design', 'logo', 'banner', 'poster', 
    'avatar', 'emote', 'overlay', 'background', 'icon', 'concept_art'
  ];
  
  private static readonly ALLOWED_STYLES = [
    'anime', 'realistic', 'cartoon', 'chibi', 'pixel', 'vector',
    'watercolor', 'digital', 'traditional', 'minimal', 'detailed'
  ];
  
  private static readonly ALLOWED_FEEDBACK_TYPES = [
    'like', 'dislike', 'click', 'view', 'share', 'bookmark'
  ];

  private static readonly ALLOWED_USER_TYPES = [
    'VTUBER', 'ARTIST', 'AI'
  ];

  /**
   * Validate and sanitize limit parameter
   */
  static validateLimit(limit: any): number {
    if (limit === undefined || limit === null || limit === '') {
      return 10; // Default
    }

    const parsed = parseInt(String(limit), 10);
    
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error('Limit must be a positive integer');
    }
    
    if (parsed > this.MAX_LIMIT) {
      throw new Error(`Limit cannot exceed ${this.MAX_LIMIT}`);
    }
    
    return parsed;
  }

  /**
   * Validate and sanitize string input
   */
  static validateString(input: any, fieldName: string, maxLength = this.MAX_STRING_LENGTH, required = false): string | undefined {
    if (input === undefined || input === null || input === '') {
      if (required) {
        throw new Error(`${fieldName} is required`);
      }
      return undefined;
    }

    const str = String(input).trim();
    
    if (str.length === 0 && required) {
      throw new Error(`${fieldName} cannot be empty`);
    }
    
    if (str.length > maxLength) {
      throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
    }

    // Check for potential injection attempts
    if (this.containsSuspiciousPatterns(str)) {
      throw new Error(`${fieldName} contains invalid characters`);
    }

    return str.length > 0 ? str : undefined;
  }

  /**
   * Validate category parameter
   */
  static validateCategory(category: any): string | undefined {
    if (!category) return undefined;
    
    const sanitized = this.validateString(category, 'category', 100);
    if (!sanitized) return undefined;
    
    const normalized = sanitized.toLowerCase();
    
    if (!this.ALLOWED_CATEGORIES.includes(normalized)) {
      throw new Error(`Invalid category. Allowed values: ${this.ALLOWED_CATEGORIES.join(', ')}`);
    }
    
    return normalized;
  }

  /**
   * Validate style parameter
   */
  static validateStyle(style: any): string | undefined {
    if (!style) return undefined;
    
    const sanitized = this.validateString(style, 'style', 100);
    if (!sanitized) return undefined;
    
    const normalized = sanitized.toLowerCase();
    
    if (!this.ALLOWED_STYLES.includes(normalized)) {
      throw new Error(`Invalid style. Allowed values: ${this.ALLOWED_STYLES.join(', ')}`);
    }
    
    return normalized;
  }

  /**
   * Validate feedback type
   */
  static validateFeedbackType(feedbackType: any): string {
    const sanitized = this.validateString(feedbackType, 'feedbackType', 50, true);
    if (!sanitized) {
      throw new Error('Feedback type is required');
    }
    
    const normalized = sanitized.toLowerCase();
    
    if (!this.ALLOWED_FEEDBACK_TYPES.includes(normalized)) {
      throw new Error(`Invalid feedback type. Allowed values: ${this.ALLOWED_FEEDBACK_TYPES.join(', ')}`);
    }
    
    return normalized;
  }

  /**
   * Validate UUID format
   */
  static validateUUID(id: any, fieldName: string): string {
    const str = this.validateString(id, fieldName, 100, true);
    if (!str) {
      throw new Error(`${fieldName} is required`);
    }
    
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(str)) {
      throw new Error(`${fieldName} must be a valid UUID`);
    }
    
    return str;
  }

  /**
   * Validate boolean parameter
   */
  static validateBoolean(value: any, defaultValue = false): boolean {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    const str = String(value).toLowerCase().trim();
    
    if (['true', '1', 'yes', 'on'].includes(str)) {
      return true;
    }
    
    if (['false', '0', 'no', 'off'].includes(str)) {
      return false;
    }
    
    return defaultValue;
  }

  /**
   * Validate array input with size limits
   */
  static validateArray(arr: any, fieldName: string, maxSize = this.MAX_ARRAY_SIZE): string[] | undefined {
    if (!arr) return undefined;
    
    let arrayToValidate: any[];
    
    if (typeof arr === 'string') {
      // Handle comma-separated strings
      arrayToValidate = arr.split(',').map((item: string) => item.trim()).filter((item: string) => item.length > 0);
    } else if (Array.isArray(arr)) {
      arrayToValidate = arr;
    } else {
      throw new Error(`${fieldName} must be an array or comma-separated string`);
    }
    
    if (arrayToValidate.length > maxSize) {
      throw new Error(`${fieldName} cannot have more than ${maxSize} items`);
    }
    
    // Validate each item
    const validatedItems = arrayToValidate.map((item, index) => {
      const validated = this.validateString(item, `${fieldName}[${index}]`, 200);
      if (!validated) {
        throw new Error(`${fieldName}[${index}] cannot be empty`);
      }
      return validated;
    });
    
    return validatedItems.length > 0 ? validatedItems : undefined;
  }

  /**
   * Validate user type authorization
   */
  static validateUserType(userType: string, allowedTypes: string[] = ['VTUBER', 'AI']): void {
    if (!this.ALLOWED_USER_TYPES.includes(userType)) {
      throw new Error('Invalid user type');
    }
    
    if (!allowedTypes.includes(userType)) {
      throw new Error(`Access denied. Allowed user types: ${allowedTypes.join(', ')}`);
    }
  }

  /**
   * Validate JSON context object
   */
  static validateContext(context: any): Record<string, any> | undefined {
    if (!context) return undefined;
    
    if (typeof context === 'string') {
      try {
        context = JSON.parse(context);
      } catch {
        throw new Error('Context must be valid JSON');
      }
    }
    
    if (typeof context !== 'object' || Array.isArray(context)) {
      throw new Error('Context must be an object');
    }
    
    // Limit context size to prevent abuse
    const contextStr = JSON.stringify(context);
    if (contextStr.length > 10000) {
      throw new Error('Context size too large (max 10KB)');
    }
    
    // Sanitize context values
    const sanitizedContext: Record<string, any> = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof key !== 'string' || key.length > 100) {
        throw new Error('Invalid context key');
      }
      
      // Basic sanitization for values
      if (typeof value === 'string' && value.length > 1000) {
        throw new Error('Context value too long');
      }
      
      sanitizedContext[key] = value;
    }
    
    return sanitizedContext;
  }

  /**
   * Check for suspicious patterns that might indicate injection attempts
   */
  private static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(['";]|--|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
      
      // NoSQL injection patterns
      /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists)/i,
      
      // Script injection patterns
      /<script[\s\S]*?>/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      
      // Command injection patterns
      /[;&|`$(){}[\]\\]/,
      
      // Path traversal patterns
      /\.\.[\/\\]/,
      
      // Null bytes and control characters
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate complete recommendation request
   */
  static validateRecommendationRequest(req: Request): {
    userId: string;
    limit: number;
    category?: string;
    style?: string;
    useAI: boolean;
    includeReason: boolean;
  } {
    const { user, query } = req;
    
    if (!user || !user.userId) {
      throw new Error('User authentication required');
    }
    
    // Validate user authorization
    this.validateUserType(user.userType, ['VTUBER', 'AI']);
    
    const userId = this.validateUUID(user.userId, 'userId');
    const limit = this.validateLimit(query.limit);
    const category = this.validateCategory(query.category);
    const style = this.validateStyle(query.style);
    const useAI = this.validateBoolean(query.useAI, true);
    const includeReason = this.validateBoolean(query.includeReason, true);
    
    return {
      userId,
      limit,
      category,
      style,
      useAI,
      includeReason
    };
  }

  /**
   * Validate feedback request
   */
  static validateFeedbackRequest(req: Request): {
    userId: string;
    artworkId: string;
    feedbackType: string;
    context?: Record<string, any>;
  } {
    const { user, body } = req;
    
    if (!user || !user.userId) {
      throw new Error('User authentication required');
    }
    
    const userId = this.validateUUID(user.userId, 'userId');
    const artworkId = this.validateUUID(body.artworkId, 'artworkId');
    const feedbackType = this.validateFeedbackType(body.feedbackType);
    const context = this.validateContext(body.context);
    
    return {
      userId,
      artworkId,
      feedbackType,
      context
    };
  }

  /**
   * Rate limiting validation - check if user is making too many requests
   */
  static validateRateLimit(userId: string, endpoint: string): void {
    // This is a placeholder - in production, you would implement actual rate limiting
    // using Redis or similar store to track request counts per user per time window
    
    // Example rate limits:
    // - Recommendations: 100 requests per hour
    // - Feedback: 1000 requests per hour
    // - Search: 200 requests per hour
    
    // For now, we'll just log the request for monitoring
    console.log(`Rate limit check: ${userId} accessing ${endpoint} at ${new Date().toISOString()}`);
  }

  /**
   * Sanitize output to prevent information leakage
   */
  static sanitizeOutput<T>(data: T, sensitiveFields: string[] = []): T {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeOutput(item, sensitiveFields)) as unknown as T;
    }
    
    const sanitized = { ...data } as any;
    
    // Remove sensitive fields
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }
    
    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeOutput(value, sensitiveFields);
      }
    }
    
    return sanitized;
  }
}

/**
 * Validation schemas using Zod for complex validation
 */
export const recommendationSchemas = {
  artworkQuery: z.object({
    limit: z.string().optional().transform(val => InputValidation.validateLimit(val)),
    category: z.string().optional().transform(val => InputValidation.validateCategory(val)),
    style: z.string().optional().transform(val => InputValidation.validateStyle(val)),
    useAI: z.string().optional().transform(val => InputValidation.validateBoolean(val)),
    includeReason: z.string().optional().transform(val => InputValidation.validateBoolean(val))
  }),
  
  feedbackBody: z.object({
    artworkId: z.string().transform(val => InputValidation.validateUUID(val, 'artworkId')),
    feedbackType: z.string().transform(val => InputValidation.validateFeedbackType(val)),
    context: z.any().optional().transform(val => InputValidation.validateContext(val))
  }),
  
  searchQuery: z.object({
    query: z.string().max(500, 'Search query too long').optional(),
    limit: z.string().optional().transform(val => InputValidation.validateLimit(val)),
    category: z.string().optional().transform(val => InputValidation.validateCategory(val)),
    style: z.string().optional().transform(val => InputValidation.validateStyle(val)),
    tags: z.any().optional().transform(val => InputValidation.validateArray(val, 'tags', 20))
  })
};
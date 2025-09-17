import Joi from 'joi';
import { UserType } from '@prisma/client';

// User registration validation
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  userType: Joi.string()
    .valid(...Object.values(UserType))
    .required()
    .messages({
      'any.only': 'User type must be either VTUBER or ARTIST',
      'any.required': 'User type is required'
    }),
  
  displayName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Display name must be at least 2 characters',
      'string.max': 'Display name cannot exceed 50 characters'
    })
});

// User login validation
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Profile update validation
export const profileUpdateSchema = Joi.object({
  displayName: Joi.string()
    .min(2)
    .max(50)
    .optional(),
  
  bio: Joi.string()
    .max(500)
    .optional(),
  
  skills: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .optional(),
  
  priceRangeMin: Joi.number()
    .min(0)
    .max(10000)
    .optional(),
  
  priceRangeMax: Joi.number()
    .min(0)
    .max(10000)
    .when('priceRangeMin', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('priceRangeMin'))
    })
    .optional(),
  
  timezone: Joi.string()
    .optional(),
  
  preferredCommStyle: Joi.string()
    .valid('friendly', 'professional', 'detailed', 'casual')
    .optional(),
  
  experience: Joi.number()
    .min(0)
    .max(50)
    .optional(),
  
  portfolioUrls: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .optional()
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });
    
    if (error) {
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
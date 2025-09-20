import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { JWTPayload } from '../types/auth';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Token verification failed'
    });
  }
};

export const requireUserType = (...allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required user type: ${allowedTypes.join(' or ')}`
      });
    }

    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};
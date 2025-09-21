import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'creatorvridge-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'creatorvridge-app';

// セキュリティ: JWT_SECRET を必須とする
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// セキュリティ: 強力なJWT_SECRETを要求
if (JWT_SECRET.length < 64) {
  throw new Error('JWT_SECRET must be at least 64 characters long for security');
}

// セキュリティ: 弱いシークレットを検出
const weakSecrets = ['secret', 'password', '123456', 'fallback-secret-key', 'default'];
if (weakSecrets.some(weak => JWT_SECRET.toLowerCase().includes(weak.toLowerCase()))) {
  throw new Error('JWT_SECRET contains weak patterns. Use a cryptographically strong secret');
}

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>, customExpiresIn?: string): string => {
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: customExpiresIn || JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256'
    } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256']
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

export const getTokenExpirationDate = (token: string): Date => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token');
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    throw new Error('Failed to get token expiration');
  }
};
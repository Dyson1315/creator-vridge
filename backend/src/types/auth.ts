import { UserType } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  userType: UserType;
  email: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  userType: UserType;
  displayName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    userType: UserType;
    profile?: {
      displayName: string | null;
      avatarUrl: string | null;
    };
  };
  token: string;
  expiresAt: string;
}

export interface RequestWithUser extends Request {
  user?: JWTPayload;
}
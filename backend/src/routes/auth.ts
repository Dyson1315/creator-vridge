import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, getTokenExpirationDate } from '../utils/jwt';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import { authenticateToken } from '../middleware/auth';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth';
import { authRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { SecurityMiddleware } from '../middleware/security';
import { AuditLogger } from '../utils/auditLogger';

const router = Router();
const prisma = new PrismaClient();

// Register new user
router.post('/register', authRateLimit, validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, userType, displayName }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      AuditLogger.logAuth('REGISTER_DUPLICATE_EMAIL', req, undefined, email, false, {
        attemptedUserType: userType
      });
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        userType,
        profile: {
          create: {
            displayName: displayName || null
          }
        }
      },
      include: {
        profile: {
          select: {
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      userType: user.userType,
      email: user.email
    });

    const expiresAt = getTokenExpirationDate(token);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        profile: user.profile || undefined
      },
      token,
      expiresAt: expiresAt.toISOString()
    };

    // Log successful registration
    AuditLogger.logAuth('REGISTER_SUCCESS', req, user.id, user.email, true, {
      userType: user.userType,
      hasDisplayName: !!displayName
    });

    res.status(201).json({
      message: 'User registered successfully',
      data: response
    });

  } catch (error) {
    console.error('Registration error:', error);
    AuditLogger.logAuth('REGISTER_ERROR', req, undefined, req.body.email, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

// Login user
router.post('/login', authRateLimit, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    });

    if (!user) {
      AuditLogger.logAuth('LOGIN_USER_NOT_FOUND', req, undefined, email, false);
      SecurityMiddleware.recordFailedAuth(req);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      AuditLogger.logAuth('LOGIN_INACTIVE_ACCOUNT', req, user.id, user.email, false, {
        accountStatus: user.status
      });
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended or is pending verification'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      AuditLogger.logAuth('LOGIN_INVALID_PASSWORD', req, user.id, user.email, false);
      SecurityMiddleware.recordFailedAuth(req);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      userType: user.userType,
      email: user.email
    });

    const expiresAt = getTokenExpirationDate(token);

    // Generate avatar URL from database data if it exists
    let profile = user.profile;
    if (profile && profile.avatarData && profile.avatarMimeType) {
      profile = {
        ...profile,
        avatarUrl: `data:${profile.avatarMimeType};base64,${profile.avatarData}`,
        // Remove sensitive data from response
        avatarData: null,
        avatarMimeType: null
      };
    }

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        profile: profile || undefined
      },
      token,
      expiresAt: expiresAt.toISOString()
    };

    // Log successful login
    AuditLogger.logAuth('LOGIN_SUCCESS', req, user.id, user.email, true, {
      userType: user.userType,
      lastLoginAt: user.lastLoginAt
    });

    res.json({
      message: 'Login successful',
      data: response
    });

  } catch (error) {
    console.error('Login error:', error);
    AuditLogger.logAuth('LOGIN_ERROR', req, undefined, req.body.email, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    // Generate avatar URL from database data if it exists
    let profile = user.profile;
    if (profile && profile.avatarData && profile.avatarMimeType) {
      profile = {
        ...profile,
        avatarUrl: `data:${profile.avatarMimeType};base64,${profile.avatarData}`,
        // Remove sensitive data from response
        avatarData: null,
        avatarMimeType: null
      };
    }

    res.json({
      data: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        status: user.status,
        emailVerified: user.emailVerified,
        profile: profile || undefined,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user data',
      message: 'An error occurred while fetching user information'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        error: 'Invalid user',
        message: 'User account is no longer valid'
      });
    }

    // Generate new token
    const token = generateToken({
      userId: user.id,
      userType: user.userType,
      email: user.email
    });

    const expiresAt = getTokenExpirationDate(token);

    res.json({
      message: 'Token refreshed successfully',
      data: {
        token,
        expiresAt: expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing the token'
    });
  }
});

// Logout (client-side should remove token)
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  res.json({
    message: 'Logout successful'
  });
});

export default router;
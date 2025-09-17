import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validate, profileUpdateSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

// Get user profile by ID
router.get('/:id/profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Only return public information
    const publicProfile = {
      id: user.id,
      userType: user.userType,
      profile: user.profile ? {
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        avatarUrl: user.profile.avatarUrl,
        skills: user.profile.skills,
        priceRangeMin: user.profile.priceRangeMin,
        priceRangeMax: user.profile.priceRangeMax,
        availability: user.profile.availability,
        experience: user.profile.experience,
        rating: user.profile.rating,
        totalReviews: user.profile.totalReviews,
        portfolioUrls: user.profile.portfolioUrls
      } : null,
      createdAt: user.createdAt
    };

    res.json({
      data: publicProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: 'An error occurred while fetching the user profile'
    });
  }
});

// Update own profile
router.put('/profile', authenticateToken, validate(profileUpdateSchema), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const updateData = req.body;

    // Update or create profile
    const profile = await prisma.profile.upsert({
      where: { userId: req.user.userId },
      update: {
        ...updateData,
        updatedAt: new Date()
      },
      create: {
        userId: req.user.userId,
        ...updateData
      }
    });

    res.json({
      message: 'Profile updated successfully',
      data: profile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'An error occurred while updating your profile'
    });
  }
});

// Search users (for matching)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      userType,
      skills,
      priceMin,
      priceMax,
      availability,
      page = 1,
      limit = 20
    } = req.query;

    const where: any = {
      status: 'ACTIVE',
      profile: {
        isNot: null
      }
    };

    // Filter by user type
    if (userType) {
      where.userType = userType;
    }

    // Build profile filters
    const profileWhere: any = {};

    if (availability) {
      profileWhere.availability = availability;
    }

    if (priceMin || priceMax) {
      profileWhere.OR = [];
      
      if (priceMin) {
        profileWhere.OR.push({
          priceRangeMax: {
            gte: parseFloat(priceMin as string)
          }
        });
      }
      
      if (priceMax) {
        profileWhere.OR.push({
          priceRangeMin: {
            lte: parseFloat(priceMax as string)
          }
        });
      }
    }

    if (skills) {
      const skillsArray = (skills as string).split(',');
      profileWhere.skills = {
        array_contains: skillsArray
      };
    }

    if (Object.keys(profileWhere).length > 0) {
      where.profile = { ...where.profile, ...profileWhere };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: {
            select: {
              displayName: true,
              bio: true,
              avatarUrl: true,
              skills: true,
              priceRangeMin: true,
              priceRangeMax: true,
              availability: true,
              experience: true,
              rating: true,
              totalReviews: true,
              portfolioUrls: true
            }
          }
        },
        skip,
        take,
        orderBy: [
          { profile: { rating: 'desc' } },
          { createdAt: 'desc' }
        ]
      }),
      prisma.user.count({ where })
    ]);

    const result = users.map(user => ({
      id: user.id,
      userType: user.userType,
      profile: user.profile,
      createdAt: user.createdAt
    }));

    res.json({
      data: result,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching for users'
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const userId = req.user.userId;
    const userType = req.user.userType;

    let stats: any = {};

    if (userType === 'VTUBER') {
      // VTuber statistics
      const matches = await prisma.match.findMany({
        where: { vtuberUserId: userId },
        include: {
          transaction: true
        }
      });

      stats = {
        totalRequests: matches.length,
        acceptedMatches: matches.filter(m => m.status === 'ACCEPTED').length,
        completedProjects: matches.filter(m => m.status === 'COMPLETED').length,
        totalSpent: matches
          .filter(m => m.transaction?.status === 'COMPLETED')
          .reduce((sum, m) => sum + Number(m.transaction?.amount || 0), 0),
        averageProjectValue: matches.length > 0 
          ? matches.reduce((sum, m) => sum + Number(m.budget || 0), 0) / matches.length 
          : 0
      };
    } else {
      // Artist statistics
      const matches = await prisma.match.findMany({
        where: { artistUserId: userId },
        include: {
          transaction: true
        }
      });

      stats = {
        totalRequests: matches.length,
        acceptedMatches: matches.filter(m => m.status === 'ACCEPTED').length,
        completedProjects: matches.filter(m => m.status === 'COMPLETED').length,
        totalEarned: matches
          .filter(m => m.transaction?.status === 'COMPLETED')
          .reduce((sum, m) => sum + Number(m.transaction?.artistAmount || 0), 0),
        averageProjectValue: matches.length > 0 
          ? matches.reduce((sum, m) => sum + Number(m.budget || 0), 0) / matches.length 
          : 0
      };
    }

    res.json({
      data: stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'An error occurred while fetching user statistics'
    });
  }
});

export default router;
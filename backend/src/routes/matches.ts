import { Router, Request, Response } from 'express';
import { PrismaClient, MatchStatus } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import Joi from 'joi';
import { validate } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createMatchSchema = Joi.object({
  artistUserId: Joi.string().uuid().required(),
  description: Joi.string().max(1000).required(),
  budget: Joi.number().min(1).max(10000).required(),
  deadline: Joi.date().min('now').required()
});

const respondMatchSchema = Joi.object({
  status: Joi.string().valid('ACCEPTED', 'REJECTED').required(),
  message: Joi.string().max(500).optional()
});

// Get match suggestions for VTuber
router.get('/suggestions', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    if (req.user.userType !== 'VTUBER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only VTubers can get match suggestions'
      });
    }

    const { limit = 10, skills, priceMax } = req.query;

    // Get VTuber's profile for matching
    const vtuberProfile = await prisma.profile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!vtuberProfile) {
      return res.status(400).json({
        error: 'Profile required',
        message: 'Please complete your profile first'
      });
    }

    // Build artist search criteria
    const where: any = {
      userType: 'ARTIST',
      status: 'ACTIVE',
      profile: {
        availability: 'AVAILABLE'
      }
    };

    // Filter by skills if specified
    if (skills) {
      const skillsArray = (skills as string).split(',');
      where.profile.skills = {
        array_contains: skillsArray
      };
    }

    // Filter by price range
    if (priceMax || vtuberProfile.priceRangeMax) {
      const maxPrice = priceMax ? parseFloat(priceMax as string) : vtuberProfile.priceRangeMax;
      where.profile.priceRangeMin = {
        lte: maxPrice
      };
    }

    // Get artists
    const artists = await prisma.user.findMany({
      where,
      include: {
        profile: true
      },
      take: parseInt(limit as string),
      orderBy: [
        { profile: { rating: 'desc' } },
        { profile: { totalReviews: 'desc' } }
      ]
    });

    // Calculate basic compatibility scores
    const suggestions = artists.map(artist => {
      let score = 0.5; // Base score

      if (artist.profile) {
        // Price compatibility (25%)
        if (vtuberProfile.priceRangeMax && artist.profile.priceRangeMin) {
          const priceOverlap = Math.min(Number(vtuberProfile.priceRangeMax), Number(artist.profile.priceRangeMax || 10000)) - 
                              Math.max(Number(vtuberProfile.priceRangeMin || 0), Number(artist.profile.priceRangeMin));
          const priceRange = Number(vtuberProfile.priceRangeMax) - Number(vtuberProfile.priceRangeMin || 0);
          
          if (priceOverlap > 0 && priceRange > 0) {
            score += 0.25 * (priceOverlap / priceRange);
          }
        }

        // Experience bonus (15%)
        if (artist.profile.experience) {
          score += Math.min(0.15, artist.profile.experience * 0.02);
        }

        // Rating bonus (20%)
        if (artist.profile.rating) {
          score += 0.2 * (Number(artist.profile.rating) / 5);
        }

        // Skills matching (40% - simplified for now)
        if (vtuberProfile.skills && artist.profile.skills) {
          const vtuberSkills = Array.isArray(vtuberProfile.skills) ? vtuberProfile.skills : [];
          const artistSkills = Array.isArray(artist.profile.skills) ? artist.profile.skills : [];
          
          const commonSkills = (vtuberSkills as string[]).filter((skill: string) => 
            (artistSkills as string[]).some((artistSkill: string) => 
              artistSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(artistSkill.toLowerCase())
            )
          );
          
          if (vtuberSkills.length > 0) {
            score += 0.4 * (commonSkills.length / vtuberSkills.length);
          }
        }
      }

      return {
        artist: {
          id: artist.id,
          profile: artist.profile
        },
        matchScore: Math.min(1, score),
        compatibility: {
          priceRange: vtuberProfile.priceRangeMax && artist.profile?.priceRangeMin 
            ? Number(vtuberProfile.priceRangeMax) >= Number(artist.profile.priceRangeMin)
            : true,
          skillsMatch: true, // Simplified for now
          availability: artist.profile?.availability === 'AVAILABLE'
        }
      };
    });

    // Sort by match score
    suggestions.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      data: suggestions
    });

  } catch (error) {
    console.error('Get match suggestions error:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: 'An error occurred while fetching match suggestions'
    });
  }
});

// Create match request
router.post('/request', authenticateToken, validate(createMatchSchema), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    if (req.user.userType !== 'VTUBER') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only VTubers can create match requests'
      });
    }

    const { artistUserId, description, budget, deadline } = req.body;

    // Check if artist exists and is available
    const artist = await prisma.user.findUnique({
      where: { id: artistUserId },
      include: { profile: true }
    });

    if (!artist || artist.userType !== 'ARTIST') {
      return res.status(404).json({
        error: 'Artist not found',
        message: 'The specified artist does not exist'
      });
    }

    if (artist.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Artist unavailable',
        message: 'The artist is currently unavailable'
      });
    }

    // Check for existing match between these users
    const existingMatch = await prisma.match.findUnique({
      where: {
        vtuberUserId_artistUserId: {
          vtuberUserId: req.user.userId,
          artistUserId: artistUserId
        }
      }
    });

    if (existingMatch && existingMatch.status === 'PENDING') {
      return res.status(409).json({
        error: 'Match already exists',
        message: 'You already have a pending request with this artist'
      });
    }

    // Calculate basic match score
    let matchScore = 0.5; // Base score
    if (artist.profile) {
      if (artist.profile.rating) {
        matchScore += 0.3 * (Number(artist.profile.rating) / 5);
      }
      if (budget >= Number(artist.profile.priceRangeMin || 0) && 
          budget <= Number(artist.profile.priceRangeMax || 10000)) {
        matchScore += 0.2;
      }
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        vtuberUserId: req.user.userId,
        artistUserId,
        description,
        budget,
        deadline: new Date(deadline),
        matchScore: Math.min(1, matchScore),
        status: 'PENDING'
      },
      include: {
        vtuberUser: {
          include: {
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        artistUser: {
          include: {
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Match request created successfully',
      data: match
    });

  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({
      error: 'Failed to create match',
      message: 'An error occurred while creating the match request'
    });
  }
});

// Respond to match request
router.put('/:id/respond', authenticateToken, validate(respondMatchSchema), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Find match
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        vtuberUser: true,
        artistUser: true
      }
    });

    if (!match) {
      return res.status(404).json({
        error: 'Match not found',
        message: 'The specified match does not exist'
      });
    }

    // Check if user is the artist for this match
    if (match.artistUserId !== req.user.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only respond to your own match requests'
      });
    }

    // Check if match is still pending
    if (match.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Match not pending',
        message: 'This match has already been responded to'
      });
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        status: status as MatchStatus,
        respondedAt: new Date()
      },
      include: {
        vtuberUser: {
          include: {
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        artistUser: {
          include: {
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: `Match ${status.toLowerCase()} successfully`,
      data: updatedMatch
    });

  } catch (error) {
    console.error('Respond to match error:', error);
    res.status(500).json({
      error: 'Failed to respond to match',
      message: 'An error occurred while responding to the match'
    });
  }
});

// Get user's matches
router.get('/my-matches', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = req.user.userType === 'VTUBER' 
      ? { vtuberUserId: req.user.userId }
      : { artistUserId: req.user.userId };

    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          vtuberUser: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true
                }
              }
            }
          },
          artistUser: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true
                }
              }
            }
          },
          transaction: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.match.count({ where })
    ]);

    res.json({
      data: matches,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      error: 'Failed to fetch matches',
      message: 'An error occurred while fetching your matches'
    });
  }
});

// Get match details
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        vtuberUser: {
          include: {
            profile: true
          }
        },
        artistUser: {
          include: {
            profile: true
          }
        },
        transaction: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        error: 'Match not found',
        message: 'The specified match does not exist'
      });
    }

    // Check if user has access to this match
    if (match.vtuberUserId !== req.user.userId && match.artistUserId !== req.user.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this match'
      });
    }

    res.json({
      data: match
    });

  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({
      error: 'Failed to fetch match details',
      message: 'An error occurred while fetching match details'
    });
  }
});

export default router;
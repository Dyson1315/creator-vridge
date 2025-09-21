import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const likeSchema = z.object({
  artworkId: z.string().uuid(),
  isLike: z.boolean(),
  context: z.object({
    source: z.string().optional(),
    viewTime: z.number().optional(),
    position: z.number().optional()
  }).optional()
});

const recommendationQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  category: z.string().optional(),
  style: z.string().optional()
});

/**
 * GET /api/artworks/recommendations
 * Get artwork recommendations for VTuber users
 */
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { limit, category, style } = req.query as any;

    // Check if user is VTuber or AI
    if (req.user!.userType !== 'VTUBER' && req.user!.userType !== 'AI') {
      return res.status(403).json({ 
        error: 'Only VTuber and AI users can get recommendations' 
      });
    }

    // Build where clause for filtering
    const whereClause: any = {
      isPublic: true,
      artistUser: {
        userType: 'ARTIST'
      }
    };

    if (category) {
      whereClause.category = category;
    }

    if (style) {
      whereClause.style = style;
    }

    // Get artworks that the user hasn't liked yet (for initial recommendations)
    const userLikedArtworkIds = await prisma.userLike.findMany({
      where: { userId },
      select: { artworkId: true }
    });

    const likedIds = userLikedArtworkIds.map(like => like.artworkId);

    if (likedIds.length > 0) {
      whereClause.id = {
        notIn: likedIds
      };
    }

    // Get artworks with artist information
    const artworks = await prisma.artwork.findMany({
      where: whereClause,
      include: {
        artistUser: {
          include: {
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                rating: true
              }
            }
          }
        },
        _count: {
          select: {
            userLikes: {
              where: { isLike: true }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: parseInt(limit) || 6
    });

    // Format response
    const recommendations = artworks.map(artwork => ({
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      imageUrl: artwork.imageUrl,
      thumbnailUrl: artwork.thumbnailUrl,
      tags: artwork.tags,
      style: artwork.style,
      category: artwork.category,
      createdAt: artwork.createdAt,
      likesCount: artwork._count.userLikes,
      artist: {
        id: artwork.artistUserId,
        displayName: artwork.artistUser.profile?.displayName || 'Unknown Artist',
        avatarUrl: artwork.artistUser.profile?.avatarUrl,
        rating: artwork.artistUser.profile?.rating
      }
    }));

    // Create recommendation history record
    const recommendationId = `rec_${Date.now()}_${userId}`;
    const historyPromises = recommendations.map((artwork, index) => 
      prisma.recommendationHistory.create({
        data: {
          userId,
          artworkId: artwork.id,
          recommendationId,
          algorithmVersion: 'v1.0_simple',
          score: 0.5, // Simple algorithm for now
          position: index + 1
        }
      })
    );

    await Promise.all(historyPromises);

    res.json({
      recommendations,
      total: recommendations.length,
      recommendationId
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations' 
    });
  }
});

/**
 * POST /api/artworks/like
 * Like or dislike an artwork
 */
router.post('/like', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { artworkId, isLike, context } = req.body;

    // Check if user is VTuber
    if (req.user!.userType !== 'VTUBER') {
      return res.status(403).json({ 
        error: 'Only VTuber users can like artworks' 
      });
    }

    // Check if artwork exists
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        artistUser: {
          select: { id: true, userType: true }
        }
      }
    });

    if (!artwork) {
      return res.status(404).json({ 
        error: 'Artwork not found' 
      });
    }

    if (!artwork.isPublic) {
      return res.status(403).json({ 
        error: 'Artwork is not public' 
      });
    }

    // Create or update like record
    const likeRecord = await prisma.userLike.upsert({
      where: {
        userId_artworkId: {
          userId,
          artworkId
        }
      },
      update: {
        isLike,
        context: context || {},
        updatedAt: new Date()
      },
      create: {
        userId,
        artworkId,
        isLike,
        context: context || {}
      }
    });

    // Update recommendation history if this was from a recommendation
    if (context?.source === 'recommendation') {
      await prisma.recommendationHistory.updateMany({
        where: {
          userId,
          artworkId,
          wasClicked: false
        },
        data: {
          wasClicked: true,
          clickedAt: new Date()
        }
      });
    }

    // Get updated like count
    const likesCount = await prisma.userLike.count({
      where: {
        artworkId,
        isLike: true
      }
    });

    res.json({
      success: true,
      liked: isLike,
      likesCount,
      message: isLike ? 'Artwork liked successfully' : 'Artwork disliked'
    });

  } catch (error) {
    console.error('Error liking artwork:', error);
    res.status(500).json({ 
      error: 'Failed to like artwork' 
    });
  }
});

/**
 * GET /api/artworks/:id
 * Get single artwork details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: {
        artistUser: {
          include: {
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
                rating: true,
                totalReviews: true
              }
            }
          }
        },
        _count: {
          select: {
            userLikes: {
              where: { isLike: true }
            }
          }
        }
      }
    });

    if (!artwork) {
      return res.status(404).json({ 
        error: 'Artwork not found' 
      });
    }

    if (!artwork.isPublic) {
      return res.status(403).json({ 
        error: 'Artwork is not public' 
      });
    }

    // Track view if user is authenticated
    if (req.user && req.user.userType === 'VTUBER') {
      await prisma.recommendationHistory.updateMany({
        where: {
          userId: req.user.userId,
          artworkId: id,
          wasViewed: false
        },
        data: {
          wasViewed: true,
          viewedAt: new Date()
        }
      });
    }

    const response = {
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      imageUrl: artwork.imageUrl,
      thumbnailUrl: artwork.thumbnailUrl,
      tags: artwork.tags,
      style: artwork.style,
      category: artwork.category,
      width: artwork.width,
      height: artwork.height,
      createdAt: artwork.createdAt,
      likesCount: artwork._count.userLikes,
      artist: {
        id: artwork.artistUserId,
        displayName: artwork.artistUser.profile?.displayName || 'Unknown Artist',
        avatarUrl: artwork.artistUser.profile?.avatarUrl,
        bio: artwork.artistUser.profile?.bio,
        rating: artwork.artistUser.profile?.rating,
        totalReviews: artwork.artistUser.profile?.totalReviews
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting artwork:', error);
    res.status(500).json({ 
      error: 'Failed to get artwork' 
    });
  }
});

/**
 * GET /api/artworks/user/:userId/likes
 * Get user's liked artworks
 */
router.get('/user/:userId/likes', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only see their own likes
    if (req.user!.userId !== userId) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    const likes = await prisma.userLike.findMany({
      where: {
        userId,
        isLike: true
      },
      include: {
        artwork: {
          include: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const likedArtworks = likes.map(like => ({
      id: like.artwork.id,
      title: like.artwork.title,
      description: like.artwork.description,
      imageUrl: like.artwork.imageUrl,
      thumbnailUrl: like.artwork.thumbnailUrl,
      tags: like.artwork.tags,
      style: like.artwork.style,
      category: like.artwork.category,
      likedAt: like.createdAt,
      artist: {
        id: like.artwork.artistUserId,
        displayName: like.artwork.artistUser.profile?.displayName || 'Unknown Artist',
        avatarUrl: like.artwork.artistUser.profile?.avatarUrl
      }
    }));

    res.json({
      likes: likedArtworks,
      total: likedArtworks.length
    });

  } catch (error) {
    console.error('Error getting user likes:', error);
    res.status(500).json({ 
      error: 'Failed to get user likes' 
    });
  }
});

export default router;
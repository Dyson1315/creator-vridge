import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const artistRecommendationQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  includeReason: z.string().optional().transform(val => val === 'true')
});

/**
 * GET /api/recommendations/artists
 * Get artist recommendations for VTuber users based on their like history
 */
router.get('/artists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { limit, includeReason } = req.query as any;

    // Check if user is VTuber
    if (req.user!.userType !== 'VTUBER') {
      return res.status(403).json({ 
        error: 'Only VTuber users can get artist recommendations' 
      });
    }

    // Get user's liked artworks to understand preferences
    const userLikes = await prisma.userLike.findMany({
      where: {
        userId,
        isLike: true
      },
      include: {
        artwork: {
          include: {
            artistUser: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (userLikes.length === 0) {
      // If no likes yet, return popular artists
      const popularArtists = await getPopularArtists(limit);
      return res.json({
        recommendations: popularArtists.map(artist => ({
          ...artist,
          compatibilityScore: 0.5,
          reason: ['popular_artist'],
          reasoning: '人気の絵師です'
        })),
        total: popularArtists.length,
        algorithm: 'popular_fallback'
      });
    }

    // Analyze user preferences
    const preferences = analyzeUserPreferences(userLikes);
    
    // Get artist recommendations based on preferences
    const recommendations = await getArtistRecommendations(userId, preferences, limit);

    // Calculate compatibility scores and reasons
    const scoredRecommendations = recommendations.map(artist => {
      const score = calculateCompatibilityScore(artist, preferences);
      const reasons = generateRecommendationReasons(artist, preferences);
      
      return {
        ...artist,
        compatibilityScore: score,
        reason: reasons.codes,
        ...(includeReason && { reasoning: reasons.text })
      };
    });

    // Sort by compatibility score
    scoredRecommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({
      recommendations: scoredRecommendations.slice(0, limit),
      total: scoredRecommendations.length,
      algorithm: 'preference_based',
      userPreferences: includeReason ? preferences : undefined
    });

  } catch (error) {
    console.error('Error getting artist recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get artist recommendations' 
    });
  }
});

/**
 * Get popular artists as fallback when no user preferences available
 */
async function getPopularArtists(limit: number) {
  const artists = await prisma.user.findMany({
    where: {
      userType: 'ARTIST'
    },
    include: {
      profile: true,
      artworks: {
        where: {
          isPublic: true
        },
        include: {
          _count: {
            select: {
              userLikes: {
                where: { isLike: true }
              }
            }
          }
        }
      }
    },
    take: limit * 2
  });

  return artists
    .map((artist: any) => {
      const totalLikes = artist.artworks.reduce((sum: number, artwork: any) => sum + artwork._count.userLikes, 0);
      const artworkCount = artist.artworks.length;
      
      return {
        id: artist.id,
        displayName: artist.profile?.displayName || 'Unknown Artist',
        avatarUrl: artist.profile?.avatarUrl,
        bio: artist.profile?.bio,
        rating: artist.profile?.rating,
        totalReviews: artist.profile?.totalReviews,
        artworkCount,
        totalLikes,
        popularityScore: artworkCount > 0 ? totalLikes / artworkCount : 0,
        artworkSamples: artist.artworks.slice(0, 3).map((artwork: any) => ({
          id: artwork.id,
          title: artwork.title,
          imageUrl: artwork.imageUrl,
          thumbnailUrl: artwork.thumbnailUrl
        }))
      };
    })
    .filter(artist => artist.artworkCount > 0)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

/**
 * Analyze user preferences from liked artworks
 */
function analyzeUserPreferences(userLikes: any[]) {
  const preferences = {
    styles: new Map<string, number>(),
    categories: new Map<string, number>(),
    tags: new Map<string, number>(),
    artists: new Map<string, number>(),
    recentLikes: userLikes.slice(0, 10) // Last 10 likes for trend analysis
  };

  userLikes.forEach(like => {
    const artwork = like.artwork;
    
    // Style preferences
    if (artwork.style) {
      preferences.styles.set(artwork.style, (preferences.styles.get(artwork.style) || 0) + 1);
    }
    
    // Category preferences
    preferences.categories.set(artwork.category, (preferences.categories.get(artwork.category) || 0) + 1);
    
    // Tag preferences
    if (artwork.tags && Array.isArray(artwork.tags)) {
      artwork.tags.forEach((tag: string) => {
        preferences.tags.set(tag, (preferences.tags.get(tag) || 0) + 1);
      });
    }
    
    // Artist preferences (to avoid recommending already liked artists too heavily)
    preferences.artists.set(artwork.artistUserId, (preferences.artists.get(artwork.artistUserId) || 0) + 1);
  });

  return preferences;
}

/**
 * Get artist recommendations based on user preferences
 */
async function getArtistRecommendations(userId: string, preferences: any, limit: number) {
  // Get artists that the user hasn't interacted with much
  const likedArtistIds = Array.from(preferences.artists.keys());
  
  // Build style and category filters based on preferences
  const preferredStyles = Array.from(preferences.styles.keys()).slice(0, 3) as string[];
  const preferredCategories = Array.from(preferences.categories.keys()).slice(0, 3) as string[];

  const artists = await prisma.user.findMany({
    where: {
      userType: 'ARTIST',
      id: {
        notIn: likedArtistIds.slice(0, 5) as string[] // Exclude heavily liked artists
      }
    },
    include: {
      profile: true,
      artworks: {
        where: {
          isPublic: true,
          OR: [
            { style: { in: preferredStyles } },
            { category: { in: preferredCategories as any[] } }
          ]
        },
        include: {
          _count: {
            select: {
              userLikes: {
                where: { isLike: true }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
    },
    take: limit * 3 // Get more to have options for scoring
  });

  return artists
    .map((artist: any) => {
      const artworkCount = artist.artworks.length;
      const totalLikes = artist.artworks.reduce((sum: number, artwork: any) => sum + artwork._count.userLikes, 0);
      
      return {
        id: artist.id,
        displayName: artist.profile?.displayName || 'Unknown Artist',
        avatarUrl: artist.profile?.avatarUrl,
        bio: artist.profile?.bio,
        rating: artist.profile?.rating,
        totalReviews: artist.profile?.totalReviews,
        artworkCount,
        totalLikes,
        artworkSamples: artist.artworks.slice(0, 3).map((artwork: any) => ({
          id: artwork.id,
          title: artwork.title,
          imageUrl: artwork.imageUrl,
          thumbnailUrl: artwork.thumbnailUrl,
          style: artwork.style,
          category: artwork.category,
          tags: artwork.tags,
          likesCount: artwork._count.userLikes
        }))
      };
    })
    .filter(artist => artist.artworkCount > 0);
}

/**
 * Calculate compatibility score between artist and user preferences
 */
function calculateCompatibilityScore(artist: any, preferences: any): number {
  let score = 0;
  let factors = 0;

  // Style compatibility
  artist.artworkSamples.forEach((artwork: any) => {
    if (artwork.style && preferences.styles.has(artwork.style)) {
      score += preferences.styles.get(artwork.style)! * 0.3;
      factors += 0.3;
    }
    
    // Category compatibility
    if (preferences.categories.has(artwork.category)) {
      score += preferences.categories.get(artwork.category)! * 0.3;
      factors += 0.3;
    }
    
    // Tag compatibility
    if (artwork.tags && Array.isArray(artwork.tags)) {
      artwork.tags.forEach((tag: string) => {
        if (preferences.tags.has(tag)) {
          score += preferences.tags.get(tag)! * 0.1;
          factors += 0.1;
        }
      });
    }
  });

  // Quality factors
  if (artist.rating) {
    score += artist.rating * 0.2;
    factors += 0.2;
  }

  if (artist.totalLikes > 0) {
    score += Math.min(artist.totalLikes / 10, 0.1); // Popularity boost
    factors += 0.1;
  }

  // Normalize score
  return factors > 0 ? Math.min(score / factors, 1.0) : 0.5;
}

/**
 * Generate reasons for recommendation
 */
function generateRecommendationReasons(artist: any, preferences: any) {
  const reasons: string[] = [];
  const codes: string[] = [];

  // Check style matches
  const styleMatches = artist.artworkSamples.filter((artwork: any) => 
    artwork.style && preferences.styles.has(artwork.style)
  );
  
  if (styleMatches.length > 0) {
    codes.push('style_match');
    reasons.push(`好きな画風「${styleMatches[0].style}」の作品があります`);
  }

  // Check category matches
  const categoryMatches = artist.artworkSamples.filter((artwork: any) => 
    preferences.categories.has(artwork.category)
  );
  
  if (categoryMatches.length > 0) {
    codes.push('category_match');
    reasons.push(`好みのカテゴリ「${categoryMatches[0].category}」が得意です`);
  }

  // Check tag matches
  const tagMatches = new Set<string>();
  artist.artworkSamples.forEach((artwork: any) => {
    if (artwork.tags && Array.isArray(artwork.tags)) {
      artwork.tags.forEach((tag: string) => {
        if (preferences.tags.has(tag)) {
          tagMatches.add(tag);
        }
      });
    }
  });

  if (tagMatches.size > 0) {
    codes.push('tag_match');
    const tags = Array.from(tagMatches).slice(0, 2).join('、');
    reasons.push(`好みのタグ「${tags}」が一致しています`);
  }

  // Check quality
  if (artist.rating && artist.rating >= 4.0) {
    codes.push('high_rating');
    reasons.push(`高評価（${artist.rating}★）の絵師です`);
  }

  if (artist.totalLikes > 20) {
    codes.push('popular');
    reasons.push('人気の絵師です');
  }

  return {
    codes: codes.length > 0 ? codes : ['general_match'],
    text: reasons.length > 0 ? reasons.join('、') : 'あなたの好みに合うと思われます'
  };
}

export default router;
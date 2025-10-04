import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { z } from 'zod';
import { InputValidation, recommendationSchemas } from '../utils/inputValidation';
import { AuditLogger } from '../utils/auditLogger';
import { aiRecommendationClient } from '../utils/aiRecommendationClient';

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

    // Check if user is VTuber or AI
    if (!['VTUBER', 'AI'].includes(req.user!.userType)) {
      return res.status(403).json({ 
        error: 'Only VTuber and AI users can get artist recommendations' 
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
 * GET /api/recommendations/artworks
 * Get artwork recommendations for VTuber users using backend logic
 */
router.get('/artworks', authenticateToken, async (req, res) => {
  try {
    console.log('🎨 Artwork recommendations requested by user:', req.user?.userId);
    
    // Enhanced input validation
    const validatedRequest = InputValidation.validateRecommendationRequest(req);
    const { userId, limit, category, style, useAI, includeReason } = validatedRequest;
    
    // Rate limiting check
    InputValidation.validateRateLimit(userId, 'recommendations/artworks');
    
    // Security audit logging
    AuditLogger.logDataAccess('ARTWORK_RECOMMENDATIONS', 'recommendations', req, userId, true, {
      limit,
      category,
      style,
      useAI,
      includeReason
    });

    // Get recommendations from unified AI service
    console.log('🤖 Getting AI recommendations...');
    const aiRecommendationResult = await aiRecommendationClient.getArtworkRecommendations({
      user_id: userId,
      limit: limit,
      category,
      style: style ? [style] : undefined
    });

    // Check if AI API returned empty recommendations
    if (!aiRecommendationResult.artworkIds || aiRecommendationResult.artworkIds.length === 0) {
      console.log('🔍 AI returned empty recommendations, falling back to popular artworks');
      
      // フォールバック: 人気のアートワークを返す
      const fallbackArtworks = await prisma.artwork.findMany({
        where: {
          isPublic: true,
          ...(category && { category: category as any })
        },
        include: {
          artistUser: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  skills: true,
                  priceRangeMin: true,
                  priceRangeMax: true,
                  rating: true,
                  totalReviews: true
                }
              }
            }
          },
          _count: {
            select: {
              userLikes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      console.log(`✅ Returning ${fallbackArtworks.length} fallback artworks, algorithm: POPULAR_FALLBACK`);
      
      const formattedFallbacks = fallbackArtworks.map((artwork: any) => ({
        id: artwork.id,
        title: artwork.title,
        description: artwork.description,
        imageUrl: artwork.imageUrl,
        thumbnailUrl: artwork.thumbnailUrl,
        tags: artwork.tags,
        style: artwork.style,
        category: artwork.category,
        createdAt: artwork.createdAt.toISOString(),
        likesCount: artwork._count.userLikes,
        artist: {
          id: artwork.artistUser.id,
          displayName: artwork.artistUser.profile?.displayName || 'Unknown Artist',
          avatarUrl: artwork.artistUser.profile?.avatarUrl,
          rating: artwork.artistUser.profile?.rating
        },
        compatibilityScore: 0.5,
        reason: ['popular_fallback'],
        reasoning: includeReason ? '人気の作品です' : undefined
      }));

      return res.json({
        recommendations: formattedFallbacks,
        totalCount: formattedFallbacks.length,
        algorithm: 'POPULAR_FALLBACK',
        metadata: {
          queryTime: Date.now() - parseInt(req.headers['x-request-start'] as string || '0'),
          confidence: 0.3,
          reason: 'ユーザーデータ不足のため人気作品を表示'
        }
      });
    }

    // Get artwork details from database using the IDs returned by AI service
    const artworkRecommendations = await Promise.all(
      aiRecommendationResult.artworkIds.map(async (artworkId: string, index: number) => {
        const artwork = await prisma.artwork.findUnique({
          where: { id: artworkId },
          include: {
            artistUser: {
              include: {
                profile: true
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
          // If artwork not found in our DB, skip it
          return null;
        }

        return {
          id: artwork.id,
          title: artwork.title,
          description: artwork.description,
          imageUrl: artwork.imageUrl,
          thumbnailUrl: artwork.thumbnailUrl,
          tags: artwork.tags,
          style: artwork.style,
          category: artwork.category,
          createdAt: artwork.createdAt.toISOString(),
          likesCount: artwork._count.userLikes,
          artist: {
            id: artwork.artistUser.id,
            displayName: artwork.artistUser.profile?.displayName || 'Unknown Artist',
            avatarUrl: artwork.artistUser.profile?.avatarUrl,
            rating: artwork.artistUser.profile?.rating
          },
          compatibilityScore: aiRecommendationResult.scores[index],
          reason: ['ai_recommendation'],
          reasoning: includeReason ? `AI推薦（スコア: ${aiRecommendationResult.scores[index].toFixed(2)}）` : undefined
        };
      })
    );

    // Filter out null values (artworks not found in DB)
    const validRecommendations = artworkRecommendations.filter((rec: any) => rec !== null);

    const algorithm = `AI_POWERED_${aiRecommendationResult.algorithm}`;
    console.log('✅ AI recommendations retrieved successfully');

    console.log(`✅ Returning ${validRecommendations.length} artworks, algorithm: ${algorithm}`);
    
    // Sanitize output for security
    const sanitizedRecommendations = InputValidation.sanitizeOutput(validRecommendations, [
      'internalId', 'adminNotes', 'sensitiveData'
    ]);
    
    res.json({
      recommendations: sanitizedRecommendations,
      total: validRecommendations.length,
      algorithm: algorithm,
      metadata: aiRecommendationResult.metadata
    });

  } catch (error) {
    console.error('Error getting backend artwork recommendations:', error);
    
    // Log security event if it's a validation error
    if (error instanceof Error && error.message.includes('validation')) {
      AuditLogger.logSecurity('RECOMMENDATION_VALIDATION_ERROR', req, 'WARN', {
        userId: req.user?.userId,
        error: error.message
      });
    }
    
    // Don't expose internal error details for other errors
    const message = error instanceof Error && error.message.includes('validation') 
      ? error.message 
      : 'バックエンド推薦システムでエラーが発生しました';
    
    res.status(error instanceof Error && error.message.includes('validation') ? 400 : 500).json({ 
      error: message,
      message: 'Backend recommendation system error'
    });
  }
});

/**
 * POST /api/recommendations/feedback
 * ユーザーフィードバックを記録（ローカル）
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    // Enhanced input validation
    const validatedRequest = InputValidation.validateFeedbackRequest(req);
    const { userId, artworkId, feedbackType, context } = validatedRequest;
    
    // Rate limiting check
    InputValidation.validateRateLimit(userId, 'recommendations/feedback');
    
    // Security audit logging
    AuditLogger.logDataAccess('FEEDBACK_SUBMISSION', 'recommendations', req, userId, true, {
      artworkId,
      feedbackType,
      hasContext: !!context
    });

    // ローカルデータベースに記録
    if (feedbackType === 'like' || feedbackType === 'dislike') {
      const existingLike = await prisma.userLike.findUnique({
        where: {
          userId_artworkId: {
            userId,
            artworkId
          }
        }
      });

      if (existingLike) {
        await prisma.userLike.update({
          where: { id: existingLike.id },
          data: {
            isLike: feedbackType === 'like',
            context: context || {},
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.userLike.create({
          data: {
            userId,
            artworkId,
            isLike: feedbackType === 'like',
            context: context || {}
          }
        });
      }
    }

    // AI推薦システムにフィードバックを送信（非同期）
    aiRecommendationClient.recordFeedback({
      user_id: userId,
      artwork_id: artworkId,
      feedback_type: feedbackType as any
    }).catch((error: any) => {
      console.error('Failed to send feedback to AI system:', error);
    });

    res.json({ 
      success: true, 
      message: 'Feedback recorded successfully' 
    });

  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ 
      error: 'Failed to record feedback' 
    });
  }
});

/**
 * GET /api/recommendations/artworks/bulk
 * 大量推薦リストからランダム6個を選択（更新ボタン対応）
 */
router.get('/artworks/bulk', authenticateToken, async (req, res) => {
  try {
    console.log('🎯 大量推薦リストからランダム選択リクエスト by user:', req.user?.userId);
    
    // Enhanced input validation
    const validatedRequest = InputValidation.validateRecommendationRequest(req);
    const { userId, category, style, includeReason } = validatedRequest;
    const displayCount = 6; // 表示件数は固定6個
    const bulkSize = 50; // AIサービスから取得する大量リスト件数
    
    // Rate limiting check
    InputValidation.validateRateLimit(userId, 'recommendations/artworks/bulk');
    
    // Security audit logging
    AuditLogger.logDataAccess('BULK_ARTWORK_RECOMMENDATIONS', 'recommendations', req, userId, true, {
      displayCount,
      bulkSize,
      category,
      style,
      includeReason
    });

    // Get bulk recommendations from AI service
    console.log(`🤖 AIサービスから大量推薦リスト取得中（${bulkSize}件）...`);
    const aiRecommendationResult = await aiRecommendationClient.getBulkRecommendations({
      user_id: userId,
      target_size: bulkSize,
      category,
      style: style ? [style] : undefined
    });

    // Check if AI API returned empty recommendations
    if (!aiRecommendationResult.artworkIds || aiRecommendationResult.artworkIds.length === 0) {
      console.log('🔍 AI returned empty bulk recommendations, falling back to popular artworks');
      
      // フォールバック: 人気のアートワークを返す
      const fallbackArtworks = await prisma.artwork.findMany({
        where: {
          isPublic: true,
          ...(category && { category: category as any })
        },
        include: {
          artistUser: {
            include: {
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                  skills: true,
                  priceRangeMin: true,
                  priceRangeMax: true,
                  rating: true,
                  totalReviews: true
                }
              }
            }
          },
          _count: {
            select: {
              userLikes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: bulkSize
      });

      // ランダムに6個選択
      const randomSelection = getRandomSelection(fallbackArtworks, displayCount);
      
      console.log(`✅ フォールバック: ${randomSelection.length}件をランダム選択, algorithm: BULK_POPULAR_FALLBACK`);
      
      const formattedFallbacks = randomSelection.map((artwork: any) => ({
        id: artwork.id,
        title: artwork.title,
        description: artwork.description,
        imageUrl: artwork.imageUrl,
        thumbnailUrl: artwork.thumbnailUrl,
        tags: artwork.tags,
        style: artwork.style,
        category: artwork.category,
        createdAt: artwork.createdAt.toISOString(),
        likesCount: artwork._count.userLikes,
        artist: {
          id: artwork.artistUser.id,
          displayName: artwork.artistUser.profile?.displayName || 'Unknown Artist',
          avatarUrl: artwork.artistUser.profile?.avatarUrl,
          rating: artwork.artistUser.profile?.rating
        },
        compatibilityScore: 0.5,
        reason: ['bulk_popular_fallback'],
        reasoning: includeReason ? '人気作品からランダム選択' : undefined
      }));

      return res.json({
        recommendations: formattedFallbacks,
        totalCount: formattedFallbacks.length,
        algorithm: 'BULK_POPULAR_FALLBACK',
        metadata: {
          queryTime: Date.now() - parseInt(req.headers['x-request-start'] as string || '0'),
          confidence: 0.3,
          reason: 'ユーザーデータ不足のため人気作品からランダム選択',
          isBulkRandomSelection: true,
          bulkSize: fallbackArtworks.length,
          displayCount
        }
      });
    }

    // Get artwork details from database using the bulk IDs returned by AI service
    const allArtworkRecommendations = await Promise.all(
      aiRecommendationResult.artworkIds.map(async (artworkId: string, index: number) => {
        const artwork = await prisma.artwork.findUnique({
          where: { id: artworkId },
          include: {
            artistUser: {
              include: {
                profile: true
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
          return null;
        }

        return {
          id: artwork.id,
          title: artwork.title,
          description: artwork.description,
          imageUrl: artwork.imageUrl,
          thumbnailUrl: artwork.thumbnailUrl,
          tags: artwork.tags,
          style: artwork.style,
          category: artwork.category,
          createdAt: artwork.createdAt.toISOString(),
          likesCount: artwork._count.userLikes,
          artist: {
            id: artwork.artistUser.id,
            displayName: artwork.artistUser.profile?.displayName || 'Unknown Artist',
            avatarUrl: artwork.artistUser.profile?.avatarUrl,
            rating: artwork.artistUser.profile?.rating
          },
          compatibilityScore: aiRecommendationResult.scores[index],
          reason: ['ai_bulk_recommendation'],
          reasoning: includeReason ? `AI大量推薦からランダム選択（スコア: ${aiRecommendationResult.scores[index].toFixed(2)}）` : undefined
        };
      })
    );

    // Filter out null values (artworks not found in DB)
    const validBulkRecommendations = allArtworkRecommendations.filter((rec: any) => rec !== null);

    // ランダムに6個選択
    const randomRecommendations = getRandomSelection(validBulkRecommendations, displayCount);

    const algorithm = `BULK_AI_POWERED_${aiRecommendationResult.algorithm}`;
    console.log(`✅ 大量AI推薦からランダム選択完了: ${randomRecommendations.length}件, algorithm: ${algorithm}`);
    
    // Sanitize output for security
    const sanitizedRecommendations = InputValidation.sanitizeOutput(randomRecommendations, [
      'internalId', 'adminNotes', 'sensitiveData'
    ]);
    
    res.json({
      recommendations: sanitizedRecommendations,
      total: randomRecommendations.length,
      algorithm: algorithm,
      metadata: {
        ...aiRecommendationResult.metadata,
        isBulkRandomSelection: true,
        bulkSize: validBulkRecommendations.length,
        displayCount,
        randomSelectionAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting bulk artwork recommendations:', error);
    
    // Log security event if it's a validation error
    if (error instanceof Error && error.message.includes('validation')) {
      AuditLogger.logSecurity('BULK_RECOMMENDATION_VALIDATION_ERROR', req, 'WARN', {
        userId: req.user?.userId,
        error: error.message
      });
    }
    
    // Don't expose internal error details for other errors
    const message = error instanceof Error && error.message.includes('validation') 
      ? error.message 
      : '大量推薦システムでエラーが発生しました';
    
    res.status(error instanceof Error && error.message.includes('validation') ? 400 : 500).json({ 
      error: message,
      message: 'Bulk recommendation system error'
    });
  }
});

/**
 * GET /api/recommendations/trending
 * トレンド作品を取得（ローカル）
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, category, useAI = true } = req.query as any;

    let algorithm = '';

    let trendingArtworks: any[] = [];

    if (useAI) {
      try {
        // AI推薦APIからトレンド取得
        const aiTrending = await aiRecommendationClient.getTrendingArtworks({
          limit: parseInt(limit),
          category
        });

        trendingArtworks = aiTrending.artworks || [];
        algorithm = 'ai_trending';

      } catch (aiError) {
        console.error('AI trending API error, using local trending:', aiError);
      }
    }

    // AI取得失敗またはuseAI=falseの場合はローカルトレンド
    if (trendingArtworks.length === 0) {
      const localTrending = await getLocalTrendingArtworks(parseInt(limit), category);
      trendingArtworks = localTrending;
      algorithm = 'local_trending';
    }

    res.json({
      artworks: trendingArtworks,
      total: trendingArtworks.length,
      algorithm
    });

  } catch (error) {
    console.error('Error getting trending artworks:', error);
    res.status(500).json({ 
      error: 'Failed to get trending artworks' 
    });
  }
});

// ===============================
// ヘルパー関数
// ===============================

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

/**
 * ローカルトレンド作品を取得
 */
async function getLocalTrendingArtworks(limit: number, category?: string) {
  const whereClause: any = {
    isPublic: true,
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 過去1週間
    }
  };

  if (category) {
    whereClause.category = category;
  }

  const trendingArtworks = await prisma.artwork.findMany({
    where: whereClause,
    include: {
      artistUser: { include: { profile: true } },
      _count: { select: { userLikes: { where: { isLike: true } } } }
    },
    orderBy: [
      { userLikes: { _count: 'desc' } },
      { createdAt: 'desc' }
    ],
    take: limit
  });

  return trendingArtworks.map((artwork: any) => ({
    id: artwork.id,
    title: artwork.title,
    imageUrl: artwork.imageUrl,
    thumbnailUrl: artwork.thumbnailUrl,
    category: artwork.category,
    style: artwork.style,
    tags: artwork.tags,
    artist: {
      id: artwork.artistUser.id,
      displayName: artwork.artistUser.profile?.displayName || 'Unknown Artist',
      avatarUrl: artwork.artistUser.profile?.avatarUrl
    },
    likesCount: artwork._count.userLikes,
    trendingScore: artwork._count.userLikes
  }));
}

/**
 * ランダム選択ヘルパー関数
 */
function getRandomSelection<T>(items: T[], count: number): T[] {
  if (items.length <= count) {
    return items;
  }
  
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}

/**
 * Backend AI recommendation function - integrated locally
 */
async function getBackendArtworkRecommendations(userId: string, params: any) {
  const { limit = 10, category, style, includeReason } = params;

  // Get user's liked artworks to understand preferences
  const userLikes = await prisma.userLike.findMany({
    where: { userId, isLike: true },
    include: { artwork: true },
    orderBy: { createdAt: 'desc' },
    take: 50 // Last 50 likes for analysis
  });

  let recommendations = [];

  if (userLikes.length === 0) {
    // If no likes yet, return popular artworks
    recommendations = await getLocalTrendingArtworks(limit, category);
    return recommendations.map(artwork => ({
      ...artwork,
      compatibilityScore: 0.5,
      reason: ['popular'],
      reasoning: includeReason ? '人気の作品です' : undefined
    }));
  }

  // Analyze user preferences from likes
  const preferredCategories = Array.from(
    new Set(userLikes.map(like => like.artwork.category))
  );
  const preferredStyles = Array.from(
    new Set(userLikes.map(like => like.artwork.style).filter(Boolean))
  );

  // Get artworks based on user preferences
  const whereClause: any = {
    isPublic: true,
    id: { notIn: userLikes.map(like => like.artworkId) } // Exclude already liked
  };

  if (category) {
    whereClause.category = category;
  } else if (preferredCategories.length > 0) {
    whereClause.category = { in: preferredCategories };
  }

  if (style && preferredStyles.includes(style)) {
    whereClause.style = style;
  } else if (preferredStyles.length > 0) {
    whereClause.style = { in: preferredStyles };
  }

  const artworks = await prisma.artwork.findMany({
    where: whereClause,
    include: {
      artistUser: { include: { profile: true } },
      _count: { select: { userLikes: { where: { isLike: true } } } }
    },
    take: limit * 2 // Get more to score and filter
  });

  // Score artworks based on user preferences
  recommendations = artworks.map(artwork => {
    let score = 0.5; // Base score
    
    // Category match bonus
    if (preferredCategories.includes(artwork.category)) {
      score += 0.2;
    }
    
    // Style match bonus
    if (artwork.style && preferredStyles.includes(artwork.style)) {
      score += 0.2;
    }
    
    // Popularity bonus
    if (artwork._count.userLikes > 0) {
      score += Math.min(artwork._count.userLikes / 10, 0.1);
    }

    return {
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      imageUrl: artwork.imageUrl,
      thumbnailUrl: artwork.thumbnailUrl,
      tags: artwork.tags,
      style: artwork.style,
      category: artwork.category,
      createdAt: artwork.createdAt.toISOString(),
      likesCount: artwork._count.userLikes,
      artist: {
        id: artwork.artistUser.id,
        displayName: artwork.artistUser.profile?.displayName || 'Unknown Artist',
        avatarUrl: artwork.artistUser.profile?.avatarUrl,
        rating: artwork.artistUser.profile?.rating
      },
      compatibilityScore: Math.min(score, 1.0),
      reason: ['preference_based'],
      reasoning: includeReason ? `あなたの好みに基づいて推薦（スコア: ${score.toFixed(2)}）` : undefined
    };
  })
  .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
  .slice(0, limit);

  return recommendations;
}

export default router;
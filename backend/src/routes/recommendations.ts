import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../utils/validation';
import { z } from 'zod';
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
    if (req.user!.userType !== 'VTUBER' && req.user!.userType !== 'AI') {
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
 * GET /api/recommendations/artworks
 * Get artwork recommendations for VTuber users based on their preferences
 */
router.get('/artworks', authenticateToken, async (req, res) => {
  try {
    console.log('🎨 Artwork recommendations requested by user:', req.user?.userId);
    const userId = req.user!.userId;
    const { limit = 6, includeReason = true } = req.query as any;

    // Check if user is VTuber or AI
    if (req.user!.userType !== 'VTUBER' && req.user!.userType !== 'AI') {
      return res.status(403).json({ 
        error: 'Only VTuber and AI users can get artwork recommendations' 
      });
    }

    let artworkRecommendations = [];
    let algorithm = 'preference_based';

    try {
      // Try to get recommendations from AI API first
      console.log('🤖 Attempting AI recommendation API...');
      const aiRecommendations = await aiRecommendationClient.getArtworkRecommendations({
        user_id: userId,
        limit: parseInt(limit)
      });

      // Check if AI API returned empty recommendations
      if (!aiRecommendations.recommendations || aiRecommendations.recommendations.length === 0) {
        throw new Error('AI API returned empty recommendations, falling back to internal algorithm');
      }

      // Convert AI recommendations to our format
      artworkRecommendations = await Promise.all(
        aiRecommendations.recommendations.map(async (rec) => {
          // Find the artwork in our database
          const artwork = await prisma.artwork.findUnique({
            where: { id: rec.artwork.id },
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
            // If artwork not found in our DB, create mock entry based on AI response
            return {
              id: rec.artwork.id,
              title: rec.artwork.title,
              description: '',
              imageUrl: rec.artwork.imageUrl || '',
              thumbnailUrl: rec.artwork.thumbnailUrl || rec.artwork.imageUrl || '',
              tags: rec.artwork.tags || [],
              style: rec.artwork.style || '',
              category: rec.artwork.category,
              createdAt: rec.artwork.createdAt,
              likesCount: 0,
              artist: {
                id: rec.artwork.artistUserId,
                displayName: 'AI推薦アーティスト',
                avatarUrl: null,
                rating: null
              },
              compatibilityScore: rec.score,
              reason: ['ai_recommendation'],
              reasoning: includeReason ? rec.reason : undefined
            };
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
            compatibilityScore: rec.score,
            reason: ['ai_recommendation'],
            reasoning: includeReason ? rec.reason : undefined
          };
        })
      );

      algorithm = `AI_POWERED_${aiRecommendations.algorithm}`;
      console.log('✅ AI recommendations retrieved successfully');

    } catch (aiError) {
      console.log('⚠️ AI API failed, falling back to internal algorithm:', aiError);
      
      // Fallback to internal recommendation logic
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
        // If no likes yet, return popular artworks
        const popularArtworks = await prisma.artwork.findMany({
          where: {
            isPublic: true
          },
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
          },
          orderBy: {
            userLikes: {
              _count: 'desc'
            }
          },
          take: parseInt(limit)
        });

        artworkRecommendations = popularArtworks.map(artwork => ({
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
          reason: ['popular'],
          reasoning: includeReason ? '人気の作品です' : undefined
        }));
        algorithm = 'popular_fallback';

      } else {
        // Analyze user preferences
        const preferences = analyzeUserPreferences(userLikes);
        
        // Get artworks matching preferences
        const preferredStyles = Array.from(preferences.styles.keys()).slice(0, 3);
        const preferredCategories = Array.from(preferences.categories.keys()).slice(0, 3);
        const likedArtworkIds = userLikes.map(like => like.artworkId);

        const matchingArtworks = await prisma.artwork.findMany({
          where: {
            isPublic: true,
            id: { notIn: likedArtworkIds }, // Exclude already liked artworks
            OR: [
              { style: { in: preferredStyles } },
              { category: { in: preferredCategories as any[] } }
            ]
          },
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
          },
          take: parseInt(limit) * 2 // Get more to allow for scoring
        });

        artworkRecommendations = matchingArtworks
          .map(artwork => {
            const score = calculateArtworkCompatibilityScore(artwork, preferences);
            const reasons = generateArtworkRecommendationReasons(artwork, preferences);
            
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
              compatibilityScore: score,
              reason: reasons.codes,
              reasoning: includeReason ? reasons.text : undefined
            };
          })
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
          .slice(0, parseInt(limit));
        algorithm = 'ai_enhanced_preference_based';
      }
    }

    console.log(`✅ Returning ${artworkRecommendations.length} artworks, algorithm: ${algorithm}`);
    
    res.json({
      recommendations: artworkRecommendations,
      total: artworkRecommendations.length,
      algorithm: algorithm
    });

  } catch (error) {
    console.error('Error getting artwork recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get artwork recommendations' 
    });
  }
});

/**
 * Calculate compatibility score for artwork recommendations
 */
function calculateArtworkCompatibilityScore(artwork: any, preferences: any): number {
  let score = 0;
  let factors = 0;

  // Style compatibility
  if (artwork.style && preferences.styles.has(artwork.style)) {
    score += preferences.styles.get(artwork.style)! * 0.4;
    factors += 0.4;
  }
  
  // Category compatibility
  if (preferences.categories.has(artwork.category)) {
    score += preferences.categories.get(artwork.category)! * 0.4;
    factors += 0.4;
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

  // Popularity boost
  if (artwork._count?.userLikes > 0) {
    score += Math.min(artwork._count.userLikes / 20, 0.1);
    factors += 0.1;
  }

  // Normalize score
  return factors > 0 ? Math.min(score / factors, 1.0) : 0.5;
}

/**
 * Generate reasons for artwork recommendation
 */
function generateArtworkRecommendationReasons(artwork: any, preferences: any) {
  const reasons: string[] = [];
  const codes: string[] = [];

  // Check style matches
  if (artwork.style && preferences.styles.has(artwork.style)) {
    codes.push('style_match');
    reasons.push(`好きな画風「${artwork.style}」です`);
  }

  // Check category matches
  if (preferences.categories.has(artwork.category)) {
    codes.push('category_match');
    reasons.push(`好みのカテゴリ「${artwork.category}」です`);
  }

  // Check tag matches
  if (artwork.tags && Array.isArray(artwork.tags)) {
    const tagMatches = artwork.tags.filter((tag: string) => preferences.tags.has(tag));
    if (tagMatches.length > 0) {
      codes.push('tag_match');
      const tags = tagMatches.slice(0, 2).join('、');
      reasons.push(`好みのタグ「${tags}」が含まれています`);
    }
  }

  // Check popularity
  if (artwork._count?.userLikes > 10) {
    codes.push('popular');
    reasons.push('人気の作品です');
  }

  return {
    codes: codes.length > 0 ? codes : ['general_match'],
    text: reasons.length > 0 ? reasons.join('、') : 'あなたの好みに合うと思われます'
  };
}

// ===============================
// AI推薦システム統合エンドポイント
// ===============================

const aiRecommendationQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  category: z.string().optional(),
  style: z.string().optional(),
  useAI: z.string().optional().transform(val => val === 'true'),
  includeReason: z.string().optional().transform(val => val === 'true')
});

/**
 * GET /api/recommendations/ai/artworks
 * AI推薦システムを使用した作品推薦
 */
router.get('/ai/artworks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { limit, category, style, useAI = true, includeReason } = req.query as any;

    // Check if user is VTuber or AI
    if (req.user!.userType !== 'VTUBER' && req.user!.userType !== 'AI') {
      return res.status(403).json({ 
        error: 'Only VTuber and AI users can get AI artwork recommendations' 
      });
    }

    let recommendations = [];
    let algorithm = '';

    if (useAI) {
      try {
        // AI推薦APIを使用
        const aiRecommendations = await aiRecommendationClient.getArtworkRecommendations({
          user_id: userId,
          limit,
          category,
          style
        });

        // AI推薦結果をデータベースの作品と照合
        const artworkIds = aiRecommendations.recommendations.map(rec => rec.artwork.id);
        const dbArtworks = await prisma.artwork.findMany({
          where: {
            id: { in: artworkIds },
            isPublic: true
          },
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

        // AI推薦結果とDB情報をマージ
        recommendations = aiRecommendations.recommendations
          .map(aiRec => {
            const dbArtwork = dbArtworks.find(db => db.id === aiRec.artwork.id);
            if (!dbArtwork) return null;

            return {
              id: dbArtwork.id,
              title: dbArtwork.title,
              imageUrl: dbArtwork.imageUrl,
              thumbnailUrl: dbArtwork.thumbnailUrl,
              category: dbArtwork.category,
              style: dbArtwork.style,
              tags: dbArtwork.tags,
              artist: {
                id: dbArtwork.artistUser.id,
                displayName: dbArtwork.artistUser.profile?.displayName || 'Unknown Artist',
                avatarUrl: dbArtwork.artistUser.profile?.avatarUrl
              },
              likesCount: dbArtwork._count.userLikes,
              compatibilityScore: aiRec.score,
              reason: includeReason ? [aiRec.reason] : undefined,
              reasoning: includeReason ? aiRec.reason : undefined
            };
          })
          .filter(rec => rec !== null);

        algorithm = aiRecommendations.algorithm;

        // AI推薦履歴を記録
        await recordAIRecommendationHistory(userId, aiRecommendations);

      } catch (aiError) {
        console.error('AI推薦API error, falling back to internal algorithm:', aiError);
        
        // AI推薦に失敗した場合は内部アルゴリズムにフォールバック
        const fallbackRecs = await getInternalArtworkRecommendations(userId, { limit, category, style });
        recommendations = fallbackRecs.recommendations;
        algorithm = 'internal_fallback';
      }
    } else {
      // 内部アルゴリズムを使用
      const internalRecs = await getInternalArtworkRecommendations(userId, { limit, category, style });
      recommendations = internalRecs.recommendations;
      algorithm = 'internal';
    }

    res.json({
      recommendations,
      total: recommendations.length,
      algorithm,
      useAI
    });

  } catch (error) {
    console.error('Error getting AI artwork recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get AI artwork recommendations' 
    });
  }
});

/**
 * GET /api/recommendations/ai/artists
 * AI推薦システムを使用したアーティスト推薦
 */
router.get('/ai/artists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { limit, useAI = true, includeReason } = req.query as any;

    // Check if user is VTuber or AI
    if (req.user!.userType !== 'VTUBER' && req.user!.userType !== 'AI') {
      return res.status(403).json({ 
        error: 'Only VTuber and AI users can get AI artist recommendations' 
      });
    }

    let recommendations = [];
    let algorithm = '';

    if (useAI) {
      try {
        // AI推薦APIを使用
        const aiRecommendations = await aiRecommendationClient.getArtistRecommendations({
          user_id: userId,
          limit
        });

        // AI推薦結果を既存フォーマットに変換
        recommendations = aiRecommendations.recommendations.map(aiRec => ({
          id: aiRec.artwork.artistUserId,
          displayName: aiRec.artwork.title, // アーティスト名はAIから取得
          compatibilityScore: aiRec.score,
          reason: includeReason ? [aiRec.reason] : undefined,
          reasoning: includeReason ? aiRec.reason : undefined,
          artworkSamples: [aiRec.artwork] // 代表作品として含める
        }));

        algorithm = aiRecommendations.algorithm;

      } catch (aiError) {
        console.error('AI artist recommendation error, falling back to internal algorithm:', aiError);
        
        // フォールバック: 既存のアーティスト推薦を使用
        return res.redirect(`/api/recommendations/artists?limit=${limit}&includeReason=${includeReason}`);
      }
    } else {
      // 内部アルゴリズムにリダイレクト
      return res.redirect(`/api/recommendations/artists?limit=${limit}&includeReason=${includeReason}`);
    }

    res.json({
      recommendations,
      total: recommendations.length,
      algorithm,
      useAI
    });

  } catch (error) {
    console.error('Error getting AI artist recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get AI artist recommendations' 
    });
  }
});

/**
 * POST /api/recommendations/feedback
 * ユーザーフィードバックを記録（ローカルとAI両方）
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { artworkId, feedbackType, context } = req.body;

    // Validation
    const validFeedbackTypes = ['like', 'dislike', 'click', 'view'];
    if (!validFeedbackTypes.includes(feedbackType)) {
      return res.status(400).json({ error: 'Invalid feedback type' });
    }

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
    }).catch(error => {
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
 * GET /api/recommendations/trending
 * トレンド作品を取得（AI + ローカル）
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, category, useAI = true } = req.query as any;

    let trendingArtworks = [];
    let algorithm = '';

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
 * AI推薦履歴を記録
 */
async function recordAIRecommendationHistory(userId: string, aiRecommendations: any) {
  try {
    const histories = aiRecommendations.recommendations.map((rec: any, index: number) => ({
      userId,
      artworkId: rec.artwork.id,
      recommendationId: aiRecommendations.recommendation_id || `ai_${Date.now()}`,
      algorithmVersion: aiRecommendations.algorithm || 'ai_v1',
      position: rec.position || index + 1,
      score: rec.score,
      wasClicked: false,
      wasViewed: false
    }));

    // SQLiteではcreateMany + skipDuplicatesがサポートされていないため、個別作成
    for (const history of histories) {
      try {
        await prisma.recommendationHistory.create({
          data: history
        });
      } catch (error) {
        // 重複エラーは無視（既に存在する場合）
        if (!(error as any)?.code?.includes('UNIQUE_CONSTRAINT')) {
          throw error;
        }
      }
    }

  } catch (error) {
    console.error('Failed to record AI recommendation history:', error);
  }
}

/**
 * 内部アルゴリズムによる作品推薦
 */
async function getInternalArtworkRecommendations(userId: string, params: any) {
  // 既存のロジックを利用（簡略化）
  const userLikes = await prisma.userLike.findMany({
    where: { userId, isLike: true },
    include: { artwork: true },
    orderBy: { createdAt: 'desc' }
  });

  if (userLikes.length === 0) {
    // 人気作品を返す
    const popularArtworks = await getLocalTrendingArtworks(params.limit);
    return {
      recommendations: popularArtworks.map((artwork: any) => ({
        ...artwork,
        compatibilityScore: 0.5,
        reason: ['popular']
      }))
    };
  }

  // 簡略化された推薦ロジック
  const preferredCategories = Array.from(
    new Set(userLikes.map(like => like.artwork.category))
  ).slice(0, 3);

  const recommendations = await prisma.artwork.findMany({
    where: {
      isPublic: true,
      category: { in: preferredCategories },
      id: { notIn: userLikes.map(like => like.artworkId) }
    },
    include: {
      artistUser: { include: { profile: true } },
      _count: { select: { userLikes: { where: { isLike: true } } } }
    },
    take: params.limit
  });

  return {
    recommendations: recommendations.map((artwork: any) => ({
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
      compatibilityScore: 0.7,
      reason: ['category_match']
    }))
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

export default router;
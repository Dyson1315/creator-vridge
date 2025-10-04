import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { RecommendationEngine } from '../services/recommendationEngine';
import { AnalysisBasedRecommendationService } from '../services/analysisBasedRecommendation';
import { RecommendationRequest } from '../types/recommendation';

const router = Router();

// Services
const db = new DatabaseService();
const engine = new RecommendationEngine(db);
const analysisEngine = new AnalysisBasedRecommendationService();

// API認証ミドルウェア
const authenticateAPI = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== process.env.AI_API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required'
    });
  }
  
  next();
};

// バリデーションヘルパー
const validateRecommendationRequest = (req: Request): {
  isValid: boolean;
  errors: string[];
  data?: RecommendationRequest;
} => {
  const errors: string[] = [];
  const { userId, limit, category, priceRange, style } = req.body;

  if (!userId || typeof userId !== 'string') {
    errors.push('userId is required and must be a string');
  }

  if (limit && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
    errors.push('limit must be a number between 1 and 100');
  }

  if (category && typeof category !== 'string') {
    errors.push('category must be a string');
  }

  if (priceRange) {
    if (typeof priceRange !== 'object' || 
        typeof priceRange.min !== 'number' || 
        typeof priceRange.max !== 'number' ||
        priceRange.min < 0 || 
        priceRange.max < priceRange.min) {
      errors.push('priceRange must have valid min and max numbers');
    }
  }

  if (style && (!Array.isArray(style) || !style.every(s => typeof s === 'string'))) {
    errors.push('style must be an array of strings');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? { userId, limit, category, priceRange, style } : undefined
  };
};

// エラーハンドリングヘルパー
const handleError = (res: Response, error: any, context: string) => {
  console.error(`${context}:`, error);
  
  const err = error as Error;
  const status = err.name === 'ValidationError' ? 400 : 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Internal server error';

  res.status(status).json({
    error: context,
    message,
    timestamp: new Date().toISOString()
  });
};

// メイン推薦エンドポイント
router.post('/recommendations', authenticateAPI, async (req: Request, res: Response) => {
  try {
    const validation = validateRecommendationRequest(req);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request parameters',
        details: validation.errors
      });
    }

    const startTime = Date.now();
    const result = await engine.getRecommendations(validation.data!);
    const responseTime = Date.now() - startTime;

    // レスポンス時間をログ出力
    console.log(`Recommendation request completed in ${responseTime}ms for user ${validation.data!.userId}`);

    res.json({
      success: true,
      data: result,
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    handleError(res, error, 'Recommendation Error');
  }
});

// GETベースの推薦エンドポイント（互換性用）
router.get('/recommendations/:userId', authenticateAPI, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required'
      });
    }

    const recommendationRequest: RecommendationRequest = {
      userId,
      limit: Math.min(limit, 100)
    };

    if (category) {
      recommendationRequest.category = category;
    }

    const startTime = Date.now();
    const result = await engine.getRecommendations(recommendationRequest);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: result,
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    handleError(res, error, 'GET Recommendation Error');
  }
});

// ヘルスチェックエンドポイント
router.get('/health', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // データベース接続確認
    await db.connect();
    
    const dbResponseTime = Date.now() - startTime;

    res.json({
      status: 'healthy',
      service: 'ai-recommendation-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime: dbResponseTime
      },
      environment: process.env.NODE_ENV
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'ai-recommendation-service',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

// アートワーク推薦エンドポイント（バックエンドクライアント用）
router.post('/recommendations/artworks', authenticateAPI, async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 10, category, style } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'user_id is required'
      });
    }

    console.log(`🎯 AI推薦リクエスト - ユーザー: ${user_id}, 件数: ${limit}, カテゴリ: ${category || 'All'}`);

    const startTime = Date.now();
    
    // 新しい分析ベース推薦エンジンを使用
    const recommendations = await analysisEngine.getHybridRecommendations(user_id, Math.min(parseInt(limit), 100));
    
    const responseTime = Date.now() - startTime;

    // 推薦結果をバックエンドクライアントが期待する形式に変換
    const artworkIds = recommendations.map(rec => rec.artworkId);
    const scores = recommendations.map(rec => rec.score);
    const algorithm = recommendations.length > 0 ? recommendations[0].algorithm : 'no_recommendations';

    console.log(`✅ AI推薦完了 - ${artworkIds.length}件推薦, アルゴリズム: ${algorithm}, 処理時間: ${responseTime}ms`);

    // バックエンドクライアントが期待する形式でレスポンス
    res.json({
      artworkIds,
      scores,
      algorithm,
      metadata: {
        totalRecommendations: artworkIds.length,
        processingTime: responseTime,
        userId: user_id,
        requestedLimit: limit,
        generatedAt: new Date().toISOString(),
        confidence: recommendations.reduce((acc, rec) => acc + rec.confidence, 0) / Math.max(recommendations.length, 1)
      }
    });

  } catch (error) {
    console.error('❌ AI推薦エラー:', error);
    handleError(res, error, 'AI Artwork Recommendation Error');
  }
});

// トレンド推薦エンドポイント
router.get('/v1/recommendations/trending', async (req: Request, res: Response) => {
  try {
    const { limit = 10, category } = req.query;
    
    // トレンド作品の取得（簡易実装）
    const artworks = await db.getAllArtworks();
    const trending = artworks
      .filter(artwork => category ? artwork.category === category : true)
      .slice(0, parseInt(limit as string))
      .map(artwork => ({
        id: artwork.id,
        title: artwork.title,
        imageUrl: artwork.imageUrl || null,
        thumbnailUrl: artwork.thumbnailUrl || null,
        category: artwork.category,
        style: artwork.style,
        tags: artwork.tags || [],
        artistUserId: artwork.userId,
        trendingScore: Math.random() // 簡易的なトレンドスコア
      }));

    res.json({
      artworks: trending,
      total: trending.length,
      algorithm: 'trending_v1'
    });
  } catch (error) {
    handleError(res, error, 'Trending Error');
  }
});

// フィードバック記録エンドポイント
router.post('/v1/recommendations/feedback', async (req: Request, res: Response) => {
  try {
    const { user_id, artwork_id, feedback_type } = req.body;
    
    if (!user_id || !artwork_id || !feedback_type) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'user_id, artwork_id, and feedback_type are required'
      });
    }

    // フィードバックをログ出力（実際の実装では永続化）
    console.log(`📊 User feedback recorded: ${user_id} -> ${artwork_id} (${feedback_type})`);

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    handleError(res, error, 'Feedback Error');
  }
});

// 大量推薦リスト生成エンドポイント（ランダム表示用）
router.post('/recommendations/bulk', authenticateAPI, async (req: Request, res: Response) => {
  try {
    const { user_id, target_size = 50 } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'user_id is required'
      });
    }

    console.log(`🎯 大量推薦リクエスト - ユーザー: ${user_id}, 目標サイズ: ${target_size}`);

    const startTime = Date.now();
    
    // 大量推薦リストを生成
    const bulkRecommendations = await analysisEngine.getBulkRecommendations(user_id, Math.min(parseInt(target_size), 200));
    
    const responseTime = Date.now() - startTime;

    // 結果をバックエンドクライアントが期待する形式に変換
    const artworkIds = bulkRecommendations.map(rec => rec.artworkId);
    const scores = bulkRecommendations.map(rec => rec.score);
    const algorithm = bulkRecommendations.length > 0 ? bulkRecommendations[0].algorithm : 'no_bulk_recommendations';

    console.log(`✅ 大量推薦完了 - ${artworkIds.length}件生成, アルゴリズム: ${algorithm}, 処理時間: ${responseTime}ms`);

    // バックエンドクライアントが期待する形式でレスポンス
    res.json({
      artworkIds,
      scores,
      algorithm,
      metadata: {
        totalRecommendations: artworkIds.length,
        processingTime: responseTime,
        userId: user_id,
        targetSize: target_size,
        generatedAt: new Date().toISOString(),
        confidence: bulkRecommendations.reduce((acc, rec) => acc + rec.confidence, 0) / Math.max(bulkRecommendations.length, 1),
        isBulkGeneration: true
      }
    });

  } catch (error) {
    console.error('❌ 大量推薦エラー:', error);
    handleError(res, error, 'Bulk Recommendation Error');
  }
});

// API情報エンドポイント
router.get('/info', (req: Request, res: Response) => {
  res.json({
    service: 'CreatorVridge AI Recommendation Service',
    version: '1.0.0',
    description: 'Unified AI service for real-time recommendations and batch processing',
    endpoints: {
      'POST /recommendations': 'Get personalized recommendations',
      'GET /recommendations/:userId': 'Get recommendations (compatibility)',
      'POST /recommendations/artworks': 'Get artwork recommendations for backend',
      'POST /recommendations/bulk': 'Generate bulk recommendation list for random display',
      'GET /v1/recommendations/trending': 'Get trending artworks',
      'POST /v1/recommendations/feedback': 'Record user feedback',
      'GET /health': 'Service health check',
      'GET /info': 'Service information'
    },
    algorithms: [
      'hybrid_collaborative_weighted',
      'hybrid_content_weighted',
      'hybrid_combined',
      'bulk_collaborative_weighted',
      'bulk_content_weighted',
      'bulk_hybrid_combined'
    ],
    maxRecommendations: parseInt(process.env.RECOMMENDATION_MAX_LIMIT || '100'),
    defaultLimit: parseInt(process.env.RECOMMENDATION_DEFAULT_LIMIT || '10'),
    maxBulkSize: 200
  });
});

export default router;
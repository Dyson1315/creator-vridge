import { DatabaseService } from './databaseService';
import { HybridRecommendationEngine, RecommendationRequest as HybridRequest } from './hybridRecommendationEngine';
import { 
  RecommendationRequest, 
  RecommendationResult,
  UserPreferenceVector,
  ArtworkAnalysis 
} from '../types/recommendation';

export class RecommendationEngine {
  private db: DatabaseService;
  private hybridEngine: HybridRecommendationEngine;

  constructor(db: DatabaseService) {
    this.db = db;
    this.hybridEngine = new HybridRecommendationEngine(db);
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = Date.now();
    const limit = Math.min(request.limit || 10, parseInt(process.env.RECOMMENDATION_MAX_LIMIT || '100'));

    try {
      // Step 1: 事前計算済み推薦をチェック
      const precomputed = await this.db.getPrecomputedRecommendations(
        request.userId, 
        limit,
        request.category
      );

      if (precomputed.length >= limit) {
        // 事前計算済み推薦で十分な場合
        const queryTime = Date.now() - startTime;
        return {
          artworkIds: precomputed.slice(0, limit).map(r => r.artworkId),
          scores: precomputed.slice(0, limit).map(r => r.score),
          algorithm: 'precomputed_' + precomputed[0]?.algorithm,
          metadata: {
            totalCount: precomputed.length,
            queryTime,
            confidence: 0.9
          }
        };
      }

      // Step 2: ハイブリッド推薦エンジンを使用
      const hybridRequest = {
        userId: request.userId,
        limit: limit,
        category: request.category,
        style: request.style,
        priceRange: request.priceRange,
        algorithm: 'hybrid'
      };

      const hybridResults = await this.hybridEngine.getHybridRecommendations(hybridRequest);
      const queryTime = Date.now() - startTime;

      return {
        artworkIds: hybridResults.map(r => r.artworkId),
        scores: hybridResults.map(r => r.finalScore),
        algorithm: 'hybrid_v2',
        metadata: {
          totalCount: hybridResults.length,
          queryTime,
          confidence: hybridResults.length > 0 ? hybridResults[0].confidence : 0.5
        }
      };

    } catch (error) {
      console.error('Recommendation error:', error);
      // フォールバック: 人気ベース推薦
      return await this.getPopularityBasedRecommendations(request, startTime);
    }
  }

  private async computeRealTimeRecommendations(
    request: RecommendationRequest,
    startTime: number
  ): Promise<RecommendationResult> {
    // ユーザーの好み分析を取得
    const userPreference = await this.db.getUserPreferenceVector(request.userId);
    
    if (!userPreference) {
      // 新規ユーザー: デモグラフィックベース推薦
      return await this.getDemographicBasedRecommendations(request, startTime);
    }

    // 全アートワークを取得
    const artworks = await this.db.getAllArtworks();
    
    // フィルタリング
    const filteredArtworks = artworks.filter(artwork => {
      // カテゴリフィルタ
      if (request.category && artwork.category !== request.category) {
        return false;
      }
      
      // 価格範囲フィルタ
      if (request.priceRange) {
        const artworkPrice = artwork.priceRange;
        if (artworkPrice.min > request.priceRange.max || 
            artworkPrice.max < request.priceRange.min) {
          return false;
        }
      }
      
      // スタイルフィルタ
      if (request.style && request.style.length > 0) {
        if (!request.style.some(style => artwork.style.includes(style))) {
          return false;
        }
      }
      
      return true;
    });

    // スコア計算とソート
    const scoredArtworks = await Promise.all(
      filteredArtworks.map(async (artwork) => {
        const analysis = await this.db.getArtworkAnalysis(artwork.id);
        const score = this.calculateRecommendationScore(userPreference, artwork, analysis);
        
        return {
          artworkId: artwork.id,
          score
        };
      })
    );

    scoredArtworks.sort((a, b) => b.score - a.score);
    
    const limit = Math.min(request.limit || 10, scoredArtworks.length);
    const queryTime = Date.now() - startTime;

    return {
      artworkIds: scoredArtworks.slice(0, limit).map(r => r.artworkId),
      scores: scoredArtworks.slice(0, limit).map(r => r.score),
      algorithm: 'collaborative_content_hybrid_v2',
      metadata: {
        totalCount: scoredArtworks.length,
        queryTime,
        confidence: userPreference.profileConfidence
      }
    };
  }

  private calculateRecommendationScore(
    userPreference: UserPreferenceVector,
    artwork: any,
    analysis?: ArtworkAnalysis | null
  ): number {
    let score = 0;

    // ベーススコア（アートワーク品質）
    if (analysis) {
      score += analysis.qualityScore * 0.3;
      score += analysis.popularityScore * 0.2;
      
      // スタイルベクトル類似度
      if (analysis.styleVector && userPreference.preferenceVector) {
        const similarity = this.cosineSimilarity(
          userPreference.preferenceVector,
          analysis.styleVector
        );
        score += similarity * 0.4;
      }
    } else {
      // 分析データがない場合のフォールバックスコア
      score += 0.5;
    }

    // カテゴリ好み度
    const categoryScore = userPreference.preferredCategories[artwork.category] || 0.5;
    score += categoryScore * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async getDemographicBasedRecommendations(
    request: RecommendationRequest,
    startTime: number
  ): Promise<RecommendationResult> {
    // 新規ユーザー向け: 人気度とカテゴリベース
    const artworks = await this.db.getAllArtworks();
    
    const filteredArtworks = artworks.filter(artwork => {
      if (request.category && artwork.category !== request.category) {
        return false;
      }
      return true;
    });

    // シンプルな人気度ベースソート（実際の実装では機械学習アルゴリズムを使用）
    const scoredArtworks = filteredArtworks.map(artwork => ({
      artworkId: artwork.id,
      score: Math.random() * 0.5 + 0.5 // デモ用ランダムスコア
    }));

    scoredArtworks.sort((a, b) => b.score - a.score);
    
    const limit = Math.min(request.limit || 10, scoredArtworks.length);
    const queryTime = Date.now() - startTime;

    return {
      artworkIds: scoredArtworks.slice(0, limit).map(r => r.artworkId),
      scores: scoredArtworks.slice(0, limit).map(r => r.score),
      algorithm: 'demographic_based_v1',
      metadata: {
        totalCount: scoredArtworks.length,
        queryTime,
        confidence: 0.6
      }
    };
  }

  private async getPopularityBasedRecommendations(
    request: RecommendationRequest,
    startTime: number
  ): Promise<RecommendationResult> {
    // フォールバック: 単純な人気度ベース推薦
    const artworks = await this.db.getAllArtworks();
    
    const limit = Math.min(request.limit || 10, artworks.length);
    const selectedArtworks = artworks.slice(0, limit);
    const queryTime = Date.now() - startTime;

    return {
      artworkIds: selectedArtworks.map(artwork => artwork.id),
      scores: selectedArtworks.map(() => 0.5), // 固定スコア
      algorithm: 'popularity_fallback_v1',
      metadata: {
        totalCount: artworks.length,
        queryTime,
        confidence: 0.3
      }
    };
  }
}
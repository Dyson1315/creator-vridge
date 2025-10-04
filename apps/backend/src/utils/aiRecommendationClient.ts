import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// 統一AIサービスのレスポンス型定義
const RecommendationResultSchema = z.object({
  artworkIds: z.array(z.string()),
  scores: z.array(z.number()),
  algorithm: z.string(),
  metadata: z.object({
    totalCount: z.number(),
    queryTime: z.number(),
    confidence: z.number()
  }).optional()
});

const UnifiedAIResponseSchema = z.object({
  success: z.boolean(),
  data: RecommendationResultSchema,
  responseTime: z.number(),
  timestamp: z.string()
});

// 後方互換性のため既存の型も保持
const ArtworkResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  category: z.string(),
  style: z.string().optional(),
  tags: z.array(z.string()).optional(),
  artistUserId: z.string(),
  createdAt: z.string()
});

const RecommendationResponseSchema = z.object({
  artwork: ArtworkResponseSchema,
  score: z.number(),
  recommendation_id: z.string(),
  position: z.number(),
  reason: z.string()
});

const ArtworkRecommendationResponseSchema = z.object({
  recommendations: z.array(RecommendationResponseSchema),
  total: z.number(),
  algorithm: z.string()
});

export type RecommendationResult = z.infer<typeof RecommendationResultSchema>;
export type UnifiedAIResponse = z.infer<typeof UnifiedAIResponseSchema>;
export type ArtworkResponse = z.infer<typeof ArtworkResponseSchema>;
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;
export type ArtworkRecommendationResponse = z.infer<typeof ArtworkRecommendationResponseSchema>;

// AI推薦APIクライアント
export class AIRecommendationClient {
  private client: AxiosInstance;
  
  constructor() {
    const baseURL = process.env.AI_RECOMMENDATION_API_URL || 'http://localhost:8000';
    const apiKey = process.env.AI_RECOMMENDATION_API_KEY;
    
    // セキュリティ: 本番環境ではAPI KEYを必須とする
    if (!apiKey && process.env.NODE_ENV === 'production') {
      throw new Error('AI_RECOMMENDATION_API_KEY is required in production');
    }
    
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30秒タイムアウト
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey })
      }
    });
  }

  /**
   * 作品推薦を取得（統一AIサービス）
   */
  async getArtworkRecommendations(params: {
    user_id: string;
    limit?: number;
    category?: string;
    style?: string[];
    priceRange?: { min: number; max: number };
  }): Promise<RecommendationResult> {
    try {
      const response = await this.client.post('/api/recommendations/artworks', {
        user_id: params.user_id,
        limit: params.limit || 10,
        category: params.category,
        style: params.style ? params.style[0] : undefined,
        priceRange: params.priceRange
      });

      // AIサービスから直接レスポンスを返す
      return {
        artworkIds: response.data.artworkIds || [],
        scores: response.data.scores || [],
        algorithm: response.data.algorithm || 'unknown',
        metadata: response.data.metadata || {}
      };
    } catch (error: any) {
      if (error.response) {
        // セキュリティ: 詳細なエラー情報を隠蔽
        throw new Error(`AI推薦API Error: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('AI推薦APIへの接続に失敗しました');
      } else {
        throw new Error('AI推薦API client error');
      }
    }
  }

  /**
   * アーティスト推薦を取得
   */
  async getArtistRecommendations(params: {
    user_id: string;
    limit?: number;
  }): Promise<RecommendationResult> {
    try {
      const response = await this.client.post('/api/recommendations', {
        userId: params.user_id,
        limit: params.limit || 10,
        type: 'artist' // アーティスト推薦のためのタイプ指定
      });

      return RecommendationResultSchema.parse(response.data.data);
    } catch (error: any) {
      if (error.response) {
        // セキュリティ: 詳細なエラー情報を隠蔽
        throw new Error(`AI推薦API Error: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('AI推薦APIへの接続に失敗しました');
      } else {
        throw new Error('AI推薦API client error');
      }
    }
  }

  /**
   * トレンド作品を取得
   */
  async getTrendingArtworks(params: {
    limit?: number;
    category?: string;
  }): Promise<any> {
    try {
      const response = await this.client.get('/api/v1/recommendations/trending', {
        params: {
          limit: params.limit || 10,
          category: params.category
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // セキュリティ: 詳細なエラー情報を隠蔽
        throw new Error(`AI推薦API Error: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('AI推薦APIへの接続に失敗しました');
      } else {
        throw new Error('AI推薦API client error');
      }
    }
  }

  /**
   * 大量推薦リストを取得（ランダム表示用）
   */
  async getBulkRecommendations(params: {
    user_id: string;
    target_size?: number;
    category?: string;
    style?: string[];
    priceRange?: { min: number; max: number };
  }): Promise<RecommendationResult> {
    try {
      const response = await this.client.post('/api/recommendations/bulk', {
        user_id: params.user_id,
        target_size: params.target_size || 50,
        category: params.category,
        style: params.style ? params.style[0] : undefined,
        priceRange: params.priceRange
      });

      // AIサービスから直接レスポンスを返す
      return {
        artworkIds: response.data.artworkIds || [],
        scores: response.data.scores || [],
        algorithm: response.data.algorithm || 'bulk_unknown',
        metadata: response.data.metadata || {}
      };
    } catch (error: any) {
      if (error.response) {
        // セキュリティ: 詳細なエラー情報を隠蔽
        throw new Error(`AI大量推薦API Error: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('AI大量推薦APIへの接続に失敗しました');
      } else {
        throw new Error('AI大量推薦API client error');
      }
    }
  }

  /**
   * ユーザーフィードバックを送信
   */
  async recordFeedback(params: {
    user_id: string;
    artwork_id: string;
    feedback_type: 'like' | 'dislike' | 'click' | 'view';
  }): Promise<void> {
    try {
      await this.client.post('/api/v1/recommendations/feedback', params);
    } catch (error: any) {
      // フィードバック送信の失敗は致命的ではないので、ログ出力のみ
      console.error('AI推薦APIへのフィードバック送信に失敗:', error.message);
    }
  }

  /**
   * 画像分析を実行
   */
  async analyzeImage(imageData: Buffer | string): Promise<any> {
    try {
      const formData = new FormData();
      if (Buffer.isBuffer(imageData)) {
        formData.append('image', new Blob([imageData]), 'image.jpg');
      } else {
        formData.append('image_url', imageData);
      }

      const response = await this.client.post('/api/v1/images/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`AI画像分析API Error: ${error.response.status} - ${error.response.data?.detail || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('AI画像分析APIへの接続に失敗しました');
      } else {
        throw new Error(`AI画像分析API client error: ${error.message}`);
      }
    }
  }

  /**
   * 類似画像検索
   */
  async findSimilarImages(params: {
    artwork_id?: string;
    image_url?: string;
    limit?: number;
    threshold?: number;
  }): Promise<any> {
    try {
      const response = await this.client.post('/api/v1/images/similar', {
        artwork_id: params.artwork_id,
        image_url: params.image_url,
        limit: params.limit || 10,
        threshold: params.threshold || 0.8
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`AI類似画像検索API Error: ${error.response.status} - ${error.response.data?.detail || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('AI類似画像検索APIへの接続に失敗しました');
      } else {
        throw new Error(`AI類似画像検索API client error: ${error.message}`);
      }
    }
  }

  /**
   * API接続テスト
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// シングルトンインスタンス
export const aiRecommendationClient = new AIRecommendationClient();
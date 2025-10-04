import { PrismaClient } from '@prisma/client';
import { 
  UserPreferenceVector, 
  ArtworkAnalysis, 
  PrecomputedRecommendation,
  BatchProcessingStatus 
} from '../types/recommendation';
import { InputValidator, SecurityErrorHandler, DataSanitizer, ValidationError } from '../utils/validation';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // User Preference Vector operations
  async getUserPreferenceVector(userId: string): Promise<UserPreferenceVector | null> {
    try {
      // 入力検証
      const validatedUserId = InputValidator.validateUserId(userId);

      const result = await this.prisma.userPreferenceProfile.findUnique({
        where: { userId: validatedUserId }
      });

      if (!result) return null;

      return {
        id: result.id,
        userId: result.userId,
        preferenceVector: result.preferenceVector as number[],
        preferredStyles: result.preferredStyles as Record<string, number>,
        preferredCategories: result.preferredCategories as Record<string, number>,
        profileConfidence: result.profileConfidence,
        lastUpdated: result.updatedAt
      };
    } catch (error) {
      SecurityErrorHandler.logError(error as Error, 'getUserPreferenceVector', { userId: DataSanitizer.maskSensitiveData(userId) });
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Failed to retrieve user preference vector');
    }
  }

  async upsertUserPreferenceVector(data: Omit<UserPreferenceVector, 'id' | 'lastUpdated'>): Promise<UserPreferenceVector> {
    const result = await this.prisma.userPreferenceProfile.upsert({
      where: { userId: data.userId },
      update: {
        preferenceVector: data.preferenceVector,
        preferredStyles: data.preferredStyles,
        preferredCategories: data.preferredCategories,
        profileConfidence: data.profileConfidence
      },
      create: {
        userId: data.userId,
        preferenceVector: data.preferenceVector,
        preferredStyles: data.preferredStyles,
        preferredCategories: data.preferredCategories,
        profileConfidence: data.profileConfidence
      }
    });

    return {
      id: result.id,
      userId: result.userId,
      preferenceVector: result.preferenceVector as number[],
      preferredStyles: result.preferredStyles as Record<string, number>,
      preferredCategories: result.preferredCategories as Record<string, number>,
      profileConfidence: result.profileConfidence,
      lastUpdated: result.updatedAt
    };
  }

  // Artwork Analysis operations
  async getArtworkAnalysis(artworkId: string): Promise<ArtworkAnalysis | null> {
    const result = await this.prisma.artworkAnalysis.findUnique({
      where: { artworkId }
    });

    if (!result) return null;

    return {
      id: result.id,
      artworkId: result.artworkId,
      styleVector: result.styleVector as number[],
      categoryScores: result.categoryScores as Record<string, number>,
      popularityScore: result.popularityScore,
      qualityScore: result.qualityScore,
      contentHash: result.contentHash,
      lastAnalyzed: result.analyzedAt
    };
  }

  async upsertArtworkAnalysis(data: Omit<ArtworkAnalysis, 'id' | 'lastAnalyzed'>): Promise<ArtworkAnalysis> {
    const result = await this.prisma.artworkAnalysis.upsert({
      where: { artworkId: data.artworkId },
      update: {
        styleVector: data.styleVector,
        categoryScores: data.categoryScores,
        popularityScore: data.popularityScore,
        qualityScore: data.qualityScore,
        contentHash: data.contentHash
      },
      create: {
        artworkId: data.artworkId,
        styleVector: data.styleVector,
        categoryScores: data.categoryScores,
        popularityScore: data.popularityScore,
        qualityScore: data.qualityScore,
        contentHash: data.contentHash
      }
    });

    return {
      id: result.id,
      artworkId: result.artworkId,
      styleVector: result.styleVector as number[],
      categoryScores: result.categoryScores as Record<string, number>,
      popularityScore: result.popularityScore,
      qualityScore: result.qualityScore,
      contentHash: result.contentHash,
      lastAnalyzed: result.analyzedAt
    };
  }

  // Precomputed Recommendation operations
  async getPrecomputedRecommendations(
    userId: string, 
    limit: number = 10,
    category?: string
  ): Promise<PrecomputedRecommendation[]> {
    try {
      // 入力検証
      const validatedUserId = InputValidator.validateUserId(userId);
      const validatedLimit = InputValidator.validateLimit(limit);
      const validatedCategory = InputValidator.validateCategory(category);

      const results = await this.prisma.precomputedRecommendation.findMany({
        where: {
          userId: validatedUserId,
          expiresAt: {
            gt: new Date()
          },
          ...(validatedCategory && {
            artwork: {
              category: validatedCategory
            }
          })
        },
        orderBy: {
          score: 'desc'
        },
        take: validatedLimit,
        include: {
          artwork: true
        }
      });

      return results.map((result: any) => ({
        id: result.id,
        userId: result.userId,
        artworkId: result.artworkId,
        score: result.score,
        algorithm: result.algorithm,
        computedAt: result.computedAt,
        validUntil: result.validUntil
      }));
    } catch (error) {
      SecurityErrorHandler.logError(error as Error, 'getPrecomputedRecommendations', { 
        userId: DataSanitizer.maskSensitiveData(userId),
        limit,
        category 
      });
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Failed to retrieve precomputed recommendations');
    }
  }

  async bulkUpsertRecommendations(recommendations: Omit<PrecomputedRecommendation, 'id'>[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 既存の推薦を削除（古いものをクリア）
      await (tx as any).precomputedRecommendation.deleteMany({
        where: {
          userId: {
            in: recommendations.map(r => r.userId)
          }
        }
      });

      // 新しい推薦を一括挿入
      await (tx as any).precomputedRecommendation.createMany({
        data: recommendations
      });
    });
  }

  // Artwork operations
  async getAllArtworks(): Promise<Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    priceRange: { min: number; max: number };
    style: string[];
    userId: string;
  }>> {
    const artworks = await this.prisma.artwork.findMany({
      where: {
        isPublic: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        style: true,
        artistUserId: true
      }
    });

    return artworks.map((artwork: any) => ({
      id: artwork.id,
      title: artwork.title,
      description: artwork.description || '',
      category: artwork.category,
      priceRange: { min: 1000, max: 50000 }, // デモ用固定値
      style: artwork.style ? [artwork.style] : [],
      userId: artwork.artistUserId
    }));
  }

  async getAllUsers(): Promise<Array<{
    id: string;
    email: string;
    role: string;
  }>> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true
      }
    });
  }

  // Batch processing status
  async updateBatchStatus(status: BatchProcessingStatus): Promise<void> {
    // Note: BatchProcessingStatusテーブルは将来的に追加予定
    console.log(`Batch status update: ${status.taskType} - ${status.status} (${status.progress}%)`);
  }

  // ===== 協調フィルタリング用メソッド =====

  /**
   * ユーザーのインタラクション履歴を取得
   */
  async getUserInteractions(userId: string): Promise<Array<{
    userId: string;
    artworkId: string;
    rating: number;
    createdAt: Date;
    artwork?: any;
  }>> {
    try {
      // 入力検証
      const validatedUserId = InputValidator.validateUserId(userId);

      // ユーザー行動ログからレーティングを取得
      const behaviorLogs = await this.prisma.userBehaviorLog.findMany({
        where: { 
          userId: validatedUserId,
          targetType: 'artwork',
          action: { in: ['view', 'like', 'share', 'save'] }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000 // 制限を設けてパフォーマンス向上
      });

      // アートワーク情報を取得して結合
      const artworkIds = [...new Set(behaviorLogs.map(log => log.targetId).filter(Boolean))];
      const artworks = await this.prisma.artwork.findMany({
        where: { id: { in: artworkIds } },
        select: {
          id: true,
          category: true,
          style: true,
          artistUserId: true
        }
      });

      const artworkMap = new Map(artworks.map(artwork => [artwork.id, artwork]));

      return behaviorLogs
        .filter(log => log.targetId && artworkMap.has(log.targetId))
        .map(log => ({
          userId: log.userId,
          artworkId: log.targetId!,
          rating: this.convertFeedbackToRating(log.action),
          createdAt: log.timestamp,
          artwork: artworkMap.get(log.targetId!)
        }));
    } catch (error) {
      SecurityErrorHandler.logError(error as Error, 'getUserInteractions', { 
        userId: DataSanitizer.maskSensitiveData(userId) 
      });
      if (error instanceof ValidationError) {
        throw error;
      }
      return [];
    }
  }

  /**
   * すべてのアクティブユーザーを取得
   */
  async getAllActiveUsers(): Promise<Array<{ id: string; email: string }>> {
    try {
      return await this.prisma.user.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          email: true
        }
      });
    } catch (error) {
      console.error('Error fetching active users:', error);
      return [];
    }
  }

  /**
   * アートワークのインタラクション履歴を取得
   */
  async getArtworkInteractions(artworkId: string): Promise<Array<{
    userId: string;
    artworkId: string;
    rating: number;
    createdAt: Date;
  }>> {
    try {
      const validatedArtworkId = InputValidator.validateArtworkId(artworkId);
      
      const behaviorLogs = await this.prisma.userBehaviorLog.findMany({
        where: { 
          targetType: 'artwork',
          targetId: validatedArtworkId,
          action: { in: ['view', 'like', 'share', 'save'] }
        },
        orderBy: { timestamp: 'desc' }
      });

      return behaviorLogs.map(log => ({
        userId: log.userId,
        artworkId: log.targetId!,
        rating: this.convertFeedbackToRating(log.action),
        createdAt: log.timestamp
      }));
    } catch (error) {
      SecurityErrorHandler.logError(error as Error, 'getArtworkInteractions', { 
        artworkId: DataSanitizer.maskSensitiveData(artworkId) 
      });
      return [];
    }
  }

  /**
   * ユーザーが高評価したアートワークを取得
   */
  async getUserHighRatedArtworks(userId: string, minRating: number = 0.7): Promise<Array<{
    id: string;
    rating: number;
  }>> {
    try {
      const validatedUserId = InputValidator.validateUserId(userId);
      
      const behaviorLogs = await this.prisma.userBehaviorLog.findMany({
        where: { 
          userId: validatedUserId,
          targetType: 'artwork',
          action: { in: ['like', 'save', 'share'] } // 高評価アクションのみ
        }
      });

      return behaviorLogs
        .map(log => ({
          id: log.targetId!,
          rating: this.convertFeedbackToRating(log.action)
        }))
        .filter(item => item.rating >= minRating);
    } catch (error) {
      SecurityErrorHandler.logError(error as Error, 'getUserHighRatedArtworks', { 
        userId: DataSanitizer.maskSensitiveData(userId) 
      });
      return [];
    }
  }

  /**
   * ユーザーがインタラクションしたアートワークIDリストを取得
   */
  async getUserInteractedArtworkIds(userId: string): Promise<string[]> {
    try {
      const validatedUserId = InputValidator.validateUserId(userId);
      
      const behaviorLogs = await this.prisma.userBehaviorLog.findMany({
        where: { 
          userId: validatedUserId,
          targetType: 'artwork',
          targetId: { not: null }
        },
        select: { targetId: true },
        distinct: ['targetId']
      });

      return behaviorLogs.map(log => log.targetId!);
    } catch (error) {
      SecurityErrorHandler.logError(error as Error, 'getUserInteractedArtworkIds', { 
        userId: DataSanitizer.maskSensitiveData(userId) 
      });
      return [];
    }
  }

  /**
   * アートワーク詳細を取得
   */
  async getArtworkById(artworkId: string): Promise<any | null> {
    try {
      return await this.prisma.artwork.findUnique({
        where: { id: artworkId },
        include: {
          artist: {
            select: {
              id: true,
              displayName: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching artwork by ID:', error);
      return null;
    }
  }

  // ===== ユーティリティメソッド =====

  /**
   * ユーザー行動を数値レーティングに変換
   */
  private convertActionToRating(action: string): number {
    switch (action.toLowerCase()) {
      case 'like':
      case 'save':
        return 1.0;
      case 'share':
        return 0.8;
      case 'view':
        return 0.3;
      default:
        return 0.5;
    }
  }

  /**
   * フィードバックタイプを数値レーティングに変換（後方互換性のため）
   */
  private convertFeedbackToRating(feedbackType: string): number {
    return this.convertActionToRating(feedbackType);
  }

  /**
   * レーティングをフィードバックタイプに変換
   */
  private convertRatingToFeedback(rating: number): string {
    if (rating >= 0.9) return 'favorite';
    if (rating >= 0.7) return 'like';
    if (rating >= 0.4) return 'view';
    return 'dislike';
  }

  /**
   * ユーザーの推薦統計を更新
   */
  async updateUserRecommendationStats(userId: string, algorithm: string, accuracy: number): Promise<void> {
    try {
      // 将来的にユーザー推薦統計テーブルを作成した際の実装
      console.log(`User ${userId} recommendation stats: ${algorithm} with accuracy ${accuracy}`);
    } catch (error) {
      console.error('Error updating user recommendation stats:', error);
    }
  }

  /**
   * アルゴリズムのパフォーマンス統計を記録
   */
  async logAlgorithmPerformance(data: {
    algorithm: string;
    userId: string;
    queryTime: number;
    resultCount: number;
    confidence: number;
  }): Promise<void> {
    try {
      // 将来的にアルゴリズムパフォーマンステーブルを作成した際の実装
      console.log(`Algorithm performance: ${data.algorithm} - ${data.queryTime}ms, confidence: ${data.confidence}`);
    } catch (error) {
      console.error('Error logging algorithm performance:', error);
    }
  }
}
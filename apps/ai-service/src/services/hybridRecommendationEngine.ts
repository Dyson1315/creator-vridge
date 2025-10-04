import { DatabaseService } from './databaseService';
import { CollaborativeFilteringService, CollaborativeFilteringResult } from './collaborativeFiltering';
import { ContentBasedFilteringService, ContentBasedResult } from './contentBasedFiltering';
import { InputValidator, SecurityErrorHandler, DataSanitizer, ValidationError } from '../utils/validation';

export interface HybridRecommendationResult {
  artworkId: string;
  finalScore: number;
  collaborativeScore?: number;
  contentScore?: number;
  confidence: number;
  algorithm: string;
  reasons: string[];
  metadata: {
    collaborativeWeight: number;
    contentWeight: number;
    userExperienceLevel: 'new' | 'intermediate' | 'experienced';
    dataAvailability: 'low' | 'medium' | 'high';
  };
}

export interface RecommendationRequest {
  userId: string;
  limit?: number;
  category?: string;
  style?: string[];
  priceRange?: { min: number; max: number };
  includeReason?: boolean;
  algorithm?: 'hybrid' | 'collaborative' | 'content' | 'auto';
}

/**
 * ハイブリッド推薦エンジン
 * 協調フィルタリングとコンテンツベースフィルタリングを組み合わせて最適な推薦を提供
 */
export class HybridRecommendationEngine {
  private db: DatabaseService;
  private collaborativeFiltering: CollaborativeFilteringService;
  private contentBasedFiltering: ContentBasedFilteringService;

  // アルゴリズム選択の閾値
  private readonly USER_INTERACTION_THRESHOLD = 10;
  private readonly COLD_START_THRESHOLD = 3;

  constructor(db: DatabaseService) {
    this.db = db;
    this.collaborativeFiltering = new CollaborativeFilteringService(db);
    this.contentBasedFiltering = new ContentBasedFilteringService(db);
  }

  /**
   * ハイブリッド推薦を実行
   */
  async getHybridRecommendations(request: RecommendationRequest): Promise<HybridRecommendationResult[]> {
    const startTime = Date.now();
    
    try {
      // 入力検証
      const validatedRequest = InputValidator.validateRecommendationRequest(request);
      const limit = Math.min(validatedRequest.limit, 50);

      // ユーザーの経験レベルとデータ可用性を分析
      const userContext = await this.analyzeUserContext(validatedRequest.userId);
      
      // アルゴリズム選択戦略を決定
      const strategy = this.selectRecommendationStrategy(validatedRequest.algorithm, userContext);
      
      let results: HybridRecommendationResult[] = [];

      switch (strategy) {
        case 'collaborative':
          results = await this.getCollaborativeOnlyRecommendations(validatedRequest, userContext);
          break;
        case 'content':
          results = await this.getContentOnlyRecommendations(validatedRequest, userContext);
          break;
        case 'hybrid':
        default:
          results = await this.getHybridRecommendationsInternal(validatedRequest, userContext);
          break;
      }

      // 結果をフィルタリングして制限
      const filteredResults = this.applyFilters(results, validatedRequest);
      const finalResults = filteredResults.slice(0, limit);

      // セキュアなパフォーマンスログ
      const queryTime = Date.now() - startTime;
      const maskedUserId = DataSanitizer.maskSensitiveData(validatedRequest.userId);
      console.log(`Hybrid recommendation completed in ${queryTime}ms for user ${maskedUserId}, strategy: ${strategy}, results: ${finalResults.length}`);

      return finalResults;

    } catch (error) {
      SecurityErrorHandler.logError(error as Error, 'getHybridRecommendations', { 
        userId: DataSanitizer.maskSensitiveData(request.userId) 
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      // フォールバック: 人気ベース推薦
      return await this.getFallbackRecommendations(request);
    }
  }

  /**
   * ユーザーコンテキストを分析
   */
  private async analyzeUserContext(userId: string): Promise<{
    interactionCount: number;
    userExperienceLevel: 'new' | 'intermediate' | 'experienced';
    dataAvailability: 'low' | 'medium' | 'high';
    preferenceStability: number;
  }> {
    const userInteractions = await this.db.getUserInteractions(userId);
    const interactionCount = userInteractions.length;

    // ユーザー経験レベル
    let userExperienceLevel: 'new' | 'intermediate' | 'experienced';
    if (interactionCount <= this.COLD_START_THRESHOLD) {
      userExperienceLevel = 'new';
    } else if (interactionCount <= this.USER_INTERACTION_THRESHOLD) {
      userExperienceLevel = 'intermediate';
    } else {
      userExperienceLevel = 'experienced';
    }

    // データ可用性
    let dataAvailability: 'low' | 'medium' | 'high';
    if (interactionCount < 5) {
      dataAvailability = 'low';
    } else if (interactionCount < 20) {
      dataAvailability = 'medium';
    } else {
      dataAvailability = 'high';
    }

    // 嗜好の安定性（最近のインタラクションと古いインタラクションの類似度）
    const preferenceStability = await this.calculatePreferenceStability(userInteractions);

    return {
      interactionCount,
      userExperienceLevel,
      dataAvailability,
      preferenceStability
    };
  }

  /**
   * 推薦戦略を選択
   */
  private selectRecommendationStrategy(
    requestedAlgorithm: string | undefined,
    userContext: any
  ): 'collaborative' | 'content' | 'hybrid' {
    // 明示的にアルゴリズムが指定されている場合
    if (requestedAlgorithm === 'collaborative' || requestedAlgorithm === 'content') {
      return requestedAlgorithm;
    }

    // 自動選択ロジック
    if (userContext.userExperienceLevel === 'new') {
      // 新規ユーザー: コンテンツベース中心
      return 'content';
    } else if (userContext.dataAvailability === 'high' && userContext.preferenceStability > 0.7) {
      // データ豊富で嗜好が安定: 協調フィルタリング中心
      return 'collaborative';
    } else {
      // その他: ハイブリッド
      return 'hybrid';
    }
  }

  /**
   * ハイブリッド推薦の内部実装
   */
  private async getHybridRecommendationsInternal(
    request: RecommendationRequest,
    userContext: any
  ): Promise<HybridRecommendationResult[]> {
    const limit = Math.min(request.limit || 10, 50);

    // 重み計算
    const weights = this.calculateAlgorithmWeights(userContext);

    // 協調フィルタリングとコンテンツベースフィルタリングを並列実行（パフォーマンス最適化）
    const [collaborativeResults, contentResults] = await Promise.all([
      this.getCollaborativeResults(request.userId, limit * 2),
      this.getContentBasedResults(request.userId, limit * 2)
    ]);

    // 結果をマージして重み付けスコアを計算
    const mergedResults = this.mergeRecommendationResults(
      collaborativeResults,
      contentResults,
      weights,
      userContext
    );

    return mergedResults.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * 協調フィルタリングのみの推薦
   */
  private async getCollaborativeOnlyRecommendations(
    request: RecommendationRequest,
    userContext: any
  ): Promise<HybridRecommendationResult[]> {
    const collaborativeResults = await this.getCollaborativeResults(request.userId, request.limit || 10);
    
    return collaborativeResults.map(result => ({
      artworkId: result.artworkId,
      finalScore: result.score,
      collaborativeScore: result.score,
      confidence: result.confidence,
      algorithm: 'collaborative_only',
      reasons: ['類似ユーザーの嗜好に基づく推薦'],
      metadata: {
        collaborativeWeight: 1.0,
        contentWeight: 0.0,
        userExperienceLevel: userContext.userExperienceLevel,
        dataAvailability: userContext.dataAvailability
      }
    }));
  }

  /**
   * コンテンツベースのみの推薦
   */
  private async getContentOnlyRecommendations(
    request: RecommendationRequest,
    userContext: any
  ): Promise<HybridRecommendationResult[]> {
    const contentResults = await this.getContentBasedResults(request.userId, request.limit || 10);
    
    return contentResults.map(result => ({
      artworkId: result.artworkId,
      finalScore: result.score,
      contentScore: result.score,
      confidence: result.confidence,
      algorithm: 'content_only',
      reasons: result.reasons,
      metadata: {
        collaborativeWeight: 0.0,
        contentWeight: 1.0,
        userExperienceLevel: userContext.userExperienceLevel,
        dataAvailability: userContext.dataAvailability
      }
    }));
  }

  /**
   * アルゴリズムの重みを計算
   */
  private calculateAlgorithmWeights(userContext: any): { collaborative: number; content: number } {
    const { userExperienceLevel, dataAvailability, preferenceStability, interactionCount } = userContext;

    let collaborativeWeight = 0.5;
    let contentWeight = 0.5;

    // ユーザー経験レベルに基づく調整
    if (userExperienceLevel === 'new') {
      collaborativeWeight = 0.2;
      contentWeight = 0.8;
    } else if (userExperienceLevel === 'experienced') {
      collaborativeWeight = 0.7;
      contentWeight = 0.3;
    }

    // データ可用性に基づく調整
    if (dataAvailability === 'low') {
      collaborativeWeight *= 0.5;
      contentWeight = 1.0 - collaborativeWeight;
    } else if (dataAvailability === 'high') {
      collaborativeWeight *= 1.3;
      contentWeight = 1.0 - collaborativeWeight;
    }

    // 嗜好の安定性に基づく調整
    if (preferenceStability > 0.8) {
      collaborativeWeight *= 1.2;
    } else if (preferenceStability < 0.4) {
      contentWeight *= 1.2;
    }

    // 正規化
    const total = collaborativeWeight + contentWeight;
    collaborativeWeight /= total;
    contentWeight /= total;

    return { collaborative: collaborativeWeight, content: contentWeight };
  }

  /**
   * 協調フィルタリング結果を取得
   */
  private async getCollaborativeResults(userId: string, limit: number): Promise<CollaborativeFilteringResult[]> {
    try {
      // ユーザーベースとアイテムベースの両方を試行
      const [userBasedResults, itemBasedResults] = await Promise.all([
        this.collaborativeFiltering.getUserBasedRecommendations(userId, Math.ceil(limit / 2)),
        this.collaborativeFiltering.getItemBasedRecommendations(userId, Math.ceil(limit / 2))
      ]);

      // 結果をマージして重複を除去
      const mergedResults = new Map<string, CollaborativeFilteringResult>();
      
      [...userBasedResults, ...itemBasedResults].forEach(result => {
        if (mergedResults.has(result.artworkId)) {
          const existing = mergedResults.get(result.artworkId)!;
          existing.score = Math.max(existing.score, result.score);
          existing.confidence = Math.max(existing.confidence, result.confidence);
        } else {
          mergedResults.set(result.artworkId, result);
        }
      });

      return Array.from(mergedResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  /**
   * コンテンツベース結果を取得
   */
  private async getContentBasedResults(userId: string, limit: number): Promise<ContentBasedResult[]> {
    try {
      return await this.contentBasedFiltering.getContentBasedRecommendations(userId, limit);
    } catch (error) {
      console.error('Content-based filtering error:', error);
      return [];
    }
  }

  /**
   * 推薦結果をマージ
   */
  private mergeRecommendationResults(
    collaborativeResults: CollaborativeFilteringResult[],
    contentResults: ContentBasedResult[],
    weights: { collaborative: number; content: number },
    userContext: any
  ): HybridRecommendationResult[] {
    const resultMap = new Map<string, HybridRecommendationResult>();

    // 協調フィルタリング結果を追加
    collaborativeResults.forEach(result => {
      const hybridResult: HybridRecommendationResult = {
        artworkId: result.artworkId,
        finalScore: result.score * weights.collaborative,
        collaborativeScore: result.score,
        confidence: result.confidence * weights.collaborative,
        algorithm: 'hybrid_collaborative_weighted',
        reasons: ['類似ユーザーの嗜好'],
        metadata: {
          collaborativeWeight: weights.collaborative,
          contentWeight: weights.content,
          userExperienceLevel: userContext.userExperienceLevel,
          dataAvailability: userContext.dataAvailability
        }
      };
      resultMap.set(result.artworkId, hybridResult);
    });

    // コンテンツベース結果を追加またはマージ
    contentResults.forEach(result => {
      if (resultMap.has(result.artworkId)) {
        const existing = resultMap.get(result.artworkId)!;
        existing.finalScore += result.score * weights.content;
        existing.contentScore = result.score;
        existing.confidence = Math.max(existing.confidence, result.confidence * weights.content);
        existing.algorithm = 'hybrid_combined';
        existing.reasons = [...existing.reasons, ...result.reasons];
      } else {
        const hybridResult: HybridRecommendationResult = {
          artworkId: result.artworkId,
          finalScore: result.score * weights.content,
          contentScore: result.score,
          confidence: result.confidence * weights.content,
          algorithm: 'hybrid_content_weighted',
          reasons: result.reasons,
          metadata: {
            collaborativeWeight: weights.collaborative,
            contentWeight: weights.content,
            userExperienceLevel: userContext.userExperienceLevel,
            dataAvailability: userContext.dataAvailability
          }
        };
        resultMap.set(result.artworkId, hybridResult);
      }
    });

    return Array.from(resultMap.values());
  }

  /**
   * フィルターを適用
   */
  private applyFilters(results: HybridRecommendationResult[], request: RecommendationRequest): HybridRecommendationResult[] {
    return results.filter(result => {
      // 最小スコア閾値
      if (result.finalScore < 0.1) return false;
      
      // 信頼度閾値
      if (result.confidence < 0.05) return false;
      
      return true;
    });
  }

  /**
   * 嗜好の安定性を計算
   */
  private async calculatePreferenceStability(interactions: any[]): Promise<number> {
    if (interactions.length < 6) return 0.5; // デフォルト値

    // 時系列順にソート
    const sortedInteractions = interactions.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const halfPoint = Math.floor(sortedInteractions.length / 2);
    const earlyInteractions = sortedInteractions.slice(0, halfPoint);
    const recentInteractions = sortedInteractions.slice(halfPoint);

    // 早期と最近の嗜好パターンを比較
    const earlyCategories = this.extractCategoryPreferences(earlyInteractions);
    const recentCategories = this.extractCategoryPreferences(recentInteractions);

    return this.calculateCategoryPreferenceSimilarity(earlyCategories, recentCategories);
  }

  /**
   * カテゴリ嗜好を抽出
   */
  private extractCategoryPreferences(interactions: any[]): Map<string, number> {
    const categoryCount = new Map<string, number>();
    
    interactions.forEach(interaction => {
      if (interaction.rating > 0.5) { // 好評価のみ考慮
        const category = interaction.artwork?.category || 'UNKNOWN';
        categoryCount.set(category, (categoryCount.get(category) || 0) + interaction.rating);
      }
    });

    return categoryCount;
  }

  /**
   * カテゴリ嗜好の類似度を計算
   */
  private calculateCategoryPreferenceSimilarity(
    preferencesA: Map<string, number>, 
    preferencesB: Map<string, number>
  ): number {
    if (preferencesA.size === 0 || preferencesB.size === 0) return 0;

    const allCategories = new Set([...preferencesA.keys(), ...preferencesB.keys()]);
    let similarity = 0;
    
    allCategories.forEach(category => {
      const scoreA = preferencesA.get(category) || 0;
      const scoreB = preferencesB.get(category) || 0;
      const maxScore = Math.max(scoreA, scoreB);
      
      if (maxScore > 0) {
        similarity += Math.min(scoreA, scoreB) / maxScore;
      }
    });

    return similarity / allCategories.size;
  }

  /**
   * フォールバック推薦
   */
  private async getFallbackRecommendations(request: RecommendationRequest): Promise<HybridRecommendationResult[]> {
    const artworks = await this.db.getAllArtworks();
    const limit = Math.min(request.limit || 10, artworks.length);
    
    return artworks.slice(0, limit).map((artwork, index) => ({
      artworkId: artwork.id,
      finalScore: 0.5 - (index * 0.01), // 順序に基づく軽度の差別化
      confidence: 0.3,
      algorithm: 'fallback_popularity',
      reasons: ['人気ベース推薦'],
      metadata: {
        collaborativeWeight: 0.0,
        contentWeight: 0.0,
        userExperienceLevel: 'new' as const,
        dataAvailability: 'low' as const
      }
    }));
  }
}
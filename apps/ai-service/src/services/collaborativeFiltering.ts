import { DatabaseService } from './databaseService';

export interface UserSimilarity {
  userId: string;
  similarity: number;
}

export interface CollaborativeFilteringResult {
  artworkId: string;
  score: number;
  confidence: number;
}

/**
 * 協調フィルタリング（Collaborative Filtering）アルゴリズム実装
 * ユーザーベース協調フィルタリングとアイテムベース協調フィルタリングの両方をサポート
 */
export class CollaborativeFilteringService {
  private db: DatabaseService;
  private readonly MIN_COMMON_INTERACTIONS = 3;
  private readonly MIN_SIMILARITY_THRESHOLD = 0.1;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * ユーザーベース協調フィルタリング
   * 類似したユーザーの嗜好に基づいて推薦を生成
   */
  async getUserBasedRecommendations(
    userId: string, 
    limit: number = 10
  ): Promise<CollaborativeFilteringResult[]> {
    // 1. ユーザーの行動履歴を取得
    const userInteractions = await this.db.getUserInteractions(userId);
    
    if (userInteractions.length === 0) {
      return [];
    }

    // 2. 類似ユーザーを見つける
    const similarUsers = await this.findSimilarUsers(userId, userInteractions);
    
    if (similarUsers.length === 0) {
      return [];
    }

    // 3. 類似ユーザーの嗜好からアイテムを推薦
    const recommendations = await this.generateRecommendationsFromSimilarUsers(
      userId,
      similarUsers,
      userInteractions,
      limit
    );

    return recommendations;
  }

  /**
   * アイテムベース協調フィルタリング
   * ユーザーが過去に好んだアイテムと類似したアイテムを推薦
   */
  async getItemBasedRecommendations(
    userId: string, 
    limit: number = 10
  ): Promise<CollaborativeFilteringResult[]> {
    // 1. ユーザーが高評価したアイテムを取得
    const userPreferences = await this.db.getUserHighRatedArtworks(userId, 0.7);
    
    if (userPreferences.length === 0) {
      return [];
    }

    // 2. 各アイテムと類似したアイテムを見つける
    const itemSimilarities = await Promise.all(
      userPreferences.map(async (artwork) => {
        const similar = await this.findSimilarArtworks(artwork.id, artwork.rating);
        return similar;
      })
    );

    // 3. 類似アイテムをスコア順にソートして推薦
    const userInteractedArtworks = new Set(userPreferences.map(p => p.id));
    const allRecommendations = itemSimilarities
      .flat()
      .filter(rec => !userInteractedArtworks.has(rec.artworkId)) // 既に評価済みを除外（修正）
      .reduce((acc, current) => {
        const existing = acc.find(item => item.artworkId === current.artworkId);
        if (existing) {
          // 複数のアイテムから推薦された場合はスコアを合計（上限制限追加）
          existing.score = Math.min(existing.score + current.score * 0.1, 1.0);
          existing.confidence = Math.max(existing.confidence, current.confidence);
        } else {
          acc.push({
            ...current,
            score: Math.min(current.score, 1.0) // スコア正規化
          });
        }
        return acc;
      }, [] as CollaborativeFilteringResult[]);

    return allRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 類似ユーザーを見つける
   */
  private async findSimilarUsers(
    userId: string, 
    userInteractions: any[]
  ): Promise<UserSimilarity[]> {
    const allUsers = await this.db.getAllActiveUsers();
    const similarities: UserSimilarity[] = [];

    for (const otherUser of allUsers) {
      if (otherUser.id === userId) continue;

      const otherInteractions = await this.db.getUserInteractions(otherUser.id);
      const similarity = this.calculateUserSimilarity(userInteractions, otherInteractions);

      if (similarity >= this.MIN_SIMILARITY_THRESHOLD) {
        similarities.push({
          userId: otherUser.id,
          similarity
        });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 50); // 上位50人の類似ユーザー
  }

  /**
   * ユーザー間の類似度を計算（Pearson相関係数）
   */
  private calculateUserSimilarity(
    userAInteractions: any[], 
    userBInteractions: any[]
  ): number {
    // 共通のアイテムを見つける
    const commonItems = new Map();
    
    userAInteractions.forEach(interaction => {
      commonItems.set(interaction.artworkId, { userA: interaction.rating });
    });

    userBInteractions.forEach(interaction => {
      if (commonItems.has(interaction.artworkId)) {
        commonItems.get(interaction.artworkId).userB = interaction.rating;
      }
    });

    const commonItemsArray = Array.from(commonItems.values())
      .filter(item => item.userA !== undefined && item.userB !== undefined);

    if (commonItemsArray.length < this.MIN_COMMON_INTERACTIONS) {
      return 0;
    }

    // Pearson相関係数を計算
    const n = commonItemsArray.length;
    let sumA = 0, sumB = 0, sumA2 = 0, sumB2 = 0, sumAB = 0;

    commonItemsArray.forEach(item => {
      sumA += item.userA;
      sumB += item.userB;
      sumA2 += item.userA * item.userA;
      sumB2 += item.userB * item.userB;
      sumAB += item.userA * item.userB;
    });

    const numerator = sumAB - (sumA * sumB) / n;
    const denominator = Math.sqrt((sumA2 - sumA * sumA / n) * (sumB2 - sumB * sumB / n));

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * 類似ユーザーから推薦を生成
   */
  private async generateRecommendationsFromSimilarUsers(
    userId: string,
    similarUsers: UserSimilarity[],
    userInteractions: any[],
    limit: number
  ): Promise<CollaborativeFilteringResult[]> {
    const userArtworks = new Set(userInteractions.map(i => i.artworkId));
    const recommendations = new Map<string, CollaborativeFilteringResult>();

    for (const similarUser of similarUsers) {
      const otherUserInteractions = await this.db.getUserInteractions(similarUser.userId);
      
      for (const interaction of otherUserInteractions) {
        // ユーザーがまだ見ていないアイテムのみ推薦
        if (!userArtworks.has(interaction.artworkId) && interaction.rating > 0.6) {
          const artworkId = interaction.artworkId;
          const score = interaction.rating * similarUser.similarity;
          
          if (recommendations.has(artworkId)) {
            const existing = recommendations.get(artworkId)!;
            existing.score += score;
            existing.confidence = Math.max(existing.confidence, similarUser.similarity);
          } else {
            recommendations.set(artworkId, {
              artworkId,
              score: score,
              confidence: similarUser.similarity
            });
          }
        }
      }
    }

    return Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 類似アートワークを見つける
   */
  private async findSimilarArtworks(
    artworkId: string, 
    userRating: number
  ): Promise<CollaborativeFilteringResult[]> {
    // アイテム間類似度を計算（コサイン類似度）
    const artworkInteractions = await this.db.getArtworkInteractions(artworkId);
    const allArtworks = await this.db.getAllArtworks();
    
    const similarities: CollaborativeFilteringResult[] = [];

    for (const otherArtwork of allArtworks) {
      if (otherArtwork.id === artworkId) continue;

      const otherInteractions = await this.db.getArtworkInteractions(otherArtwork.id);
      const similarity = this.calculateItemSimilarity(artworkInteractions, otherInteractions);

      if (similarity >= this.MIN_SIMILARITY_THRESHOLD) {
        similarities.push({
          artworkId: otherArtwork.id,
          score: similarity * userRating,
          confidence: similarity
        });
      }
    }

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * アイテム間の類似度を計算（コサイン類似度）
   */
  private calculateItemSimilarity(
    itemAInteractions: any[], 
    itemBInteractions: any[]
  ): number {
    const usersA = new Map();
    const usersB = new Map();

    itemAInteractions.forEach(interaction => {
      usersA.set(interaction.userId, interaction.rating);
    });

    itemBInteractions.forEach(interaction => {
      usersB.set(interaction.userId, interaction.rating);
    });

    // 共通ユーザーを見つける
    const commonUsers = Array.from(usersA.keys())
      .filter(userId => usersB.has(userId));

    if (commonUsers.length < this.MIN_COMMON_INTERACTIONS) {
      return 0;
    }

    // コサイン類似度を計算
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    commonUsers.forEach(userId => {
      const ratingA = usersA.get(userId);
      const ratingB = usersB.get(userId);
      
      dotProduct += ratingA * ratingB;
      normA += ratingA * ratingA;
      normB += ratingB * ratingB;
    });

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 協調フィルタリングの信頼度を計算
   */
  calculateConfidence(
    userInteractionCount: number, 
    similarUserCount: number
  ): number {
    const interactionFactor = Math.min(userInteractionCount / 20, 1.0);
    const similarityFactor = Math.min(similarUserCount / 10, 1.0);
    
    return (interactionFactor * 0.7) + (similarityFactor * 0.3);
  }
}
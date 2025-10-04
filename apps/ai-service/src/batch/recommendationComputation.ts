import { DatabaseService } from '../services/databaseService';
import { RecommendationEngine } from '../services/recommendationEngine';
import { PrecomputedRecommendation } from '../types/recommendation';

export class RecommendationComputationProcessor {
  private db: DatabaseService;
  private engine: RecommendationEngine;

  constructor(db: DatabaseService) {
    this.db = db;
    this.engine = new RecommendationEngine(db);
  }

  async computeRecommendationsForAllUsers(): Promise<void> {
    console.log('🤖 Starting recommendation precomputation...');
    
    try {
      const users = await this.db.getAllUsers();
      console.log(`📊 Computing recommendations for ${users.length} users`);

      let processed = 0;
      const batchSize = 5; // 推薦計算は重いので小さなバッチサイズ

      const allRecommendations: Omit<PrecomputedRecommendation, 'id'>[] = [];

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const batchRecommendations = await Promise.all(
          batch.map(user => this.computeUserRecommendations(user.id))
        );
        
        // フラット化して全推薦リストに追加
        batchRecommendations.forEach(userRecs => {
          allRecommendations.push(...userRecs);
        });
        
        processed += batch.length;
        console.log(`✅ Processed ${processed}/${users.length} users (${Math.round((processed / users.length) * 100)}%)`);
      }

      // 一括でデータベースに保存
      if (allRecommendations.length > 0) {
        console.log(`💾 Saving ${allRecommendations.length} precomputed recommendations...`);
        await this.db.bulkUpsertRecommendations(allRecommendations);
      }

      console.log('🎉 Recommendation precomputation completed');
    } catch (error) {
      console.error('❌ Recommendation computation failed:', error);
      throw error;
    }
  }

  private async computeUserRecommendations(userId: string): Promise<Omit<PrecomputedRecommendation, 'id'>[]> {
    try {
      const recommendations: Omit<PrecomputedRecommendation, 'id'>[] = [];
      
      // 複数のカテゴリで推薦を計算
      const categories = [
        'illustration', 'logo', 'character_design', 'background',
        'ui_design', 'concept_art', 'portrait', 'mascot'
      ];

      // 全般的な推薦（カテゴリ指定なし）
      const generalRecs = await this.computeCategoryRecommendations(userId, undefined, 20);
      recommendations.push(...generalRecs);

      // カテゴリ別推薦
      for (const category of categories) {
        const categoryRecs = await this.computeCategoryRecommendations(userId, category, 10);
        recommendations.push(...categoryRecs);
      }

      return recommendations;

    } catch (error) {
      console.error(`Failed to compute recommendations for user ${userId}:`, error);
      return [];
    }
  }

  private async computeCategoryRecommendations(
    userId: string, 
    category: string | undefined,
    limit: number
  ): Promise<Omit<PrecomputedRecommendation, 'id'>[]> {
    
    try {
      // 推薦エンジンを使用してスコア計算
      const result = await this.engine.getRecommendations({
        userId,
        category,
        limit: limit * 2 // 多めに取得してフィルタリング
      });

      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 
        parseInt(process.env.RECOMMENDATION_CACHE_TTL || '3600') / 3600
      );

      const computedAt = new Date();

      return result.artworkIds.slice(0, limit).map((artworkId, index) => ({
        userId,
        artworkId,
        score: result.scores[index],
        algorithm: result.algorithm,
        computedAt,
        validUntil
      }));

    } catch (error) {
      console.error(`Failed to compute ${category || 'general'} recommendations for user ${userId}:`, error);
      return [];
    }
  }

  async cleanupExpiredRecommendations(): Promise<void> {
    console.log('🧹 Cleaning up expired recommendations...');
    
    try {
      // 期限切れの推薦を削除（データベース実装待ち）
      console.log('ℹ️ Cleanup functionality will be implemented with database migration');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async getRecommendationStats(): Promise<{
    totalRecommendations: number;
    uniqueUsers: number;
    uniqueArtworks: number;
    avgRecommendationsPerUser: number;
  }> {
    try {
      // 統計情報を取得（データベース実装待ち）
      return {
        totalRecommendations: 0,
        uniqueUsers: 0,
        uniqueArtworks: 0,
        avgRecommendationsPerUser: 0
      };
      
    } catch (error) {
      console.error('❌ Failed to get recommendation stats:', error);
      return {
        totalRecommendations: 0,
        uniqueUsers: 0,
        uniqueArtworks: 0,
        avgRecommendationsPerUser: 0
      };
    }
  }
}
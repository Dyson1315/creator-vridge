import { DataLoader } from './dataLoader';

export interface RecommendationResult {
  artworkId: string;
  score: number;
  confidence: number;
  algorithm: string;
  reasons: string[];
}

/**
 * 分析データベース推薦サービス
 * 事前に生成された分析データを使用して高速な推薦を提供
 */
export class AnalysisBasedRecommendationService {
  private dataLoader: DataLoader;

  constructor() {
    this.dataLoader = DataLoader.getInstance();
  }

  /**
   * ユーザーベース協調フィルタリング推薦
   */
  async getUserBasedRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      console.log(`🔍 ユーザーベース推薦開始: ${userId}`);

      // 類似ユーザーを探す
      const similarUsers = await this.dataLoader.findSimilarUsers(userId, 10);
      console.log(`👥 類似ユーザー数: ${similarUsers.length}`);

      if (similarUsers.length === 0) {
        return this.getFallbackRecommendations(limit, 'no_similar_users');
      }

      // ユーザープロファイルを取得
      const userProfile = await this.dataLoader.getUserProfile(userId);
      const likedArtworks = new Set(userProfile?.likedArtworks || []);

      // 類似ユーザーが好む作品を収集
      const candidateArtworks = new Map<string, { score: number; reasons: string[] }>();

      for (const { userId: similarUserId, similarity } of similarUsers) {
        const similarUserProfile = await this.dataLoader.getUserProfile(similarUserId);
        if (!similarUserProfile) continue;

        for (const artworkId of similarUserProfile.likedArtworks) {
          if (!likedArtworks.has(artworkId)) {
            if (!candidateArtworks.has(artworkId)) {
              candidateArtworks.set(artworkId, { score: 0, reasons: [] });
            }
            const candidate = candidateArtworks.get(artworkId)!;
            candidate.score += similarity;
            candidate.reasons.push(`類似ユーザー(${similarity.toFixed(2)})が評価`);
          }
        }
      }

      // スコア順にソート
      const recommendations = Array.from(candidateArtworks.entries())
        .map(([artworkId, { score, reasons }]) => ({
          artworkId,
          score: Math.min(score / similarUsers.length, 1.0),
          confidence: Math.min(score / 3, 0.9),
          algorithm: 'collaborative_user_based',
          reasons: reasons.slice(0, 3)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      console.log(`✅ ユーザーベース推薦完了: ${recommendations.length}件`);
      return recommendations;

    } catch (error) {
      console.error('❌ ユーザーベース推薦エラー:', error);
      return this.getFallbackRecommendations(limit, 'user_based_error');
    }
  }

  /**
   * アイテムベース協調フィルタリング推薦
   */
  async getItemBasedRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      console.log(`🔍 アイテムベース推薦開始: ${userId}`);

      // ユーザーが好む作品を取得
      const userProfile = await this.dataLoader.getUserProfile(userId);
      if (!userProfile || userProfile.likedArtworks.length === 0) {
        return this.getFallbackRecommendations(limit, 'no_user_likes');
      }

      const likedArtworks = new Set(userProfile.likedArtworks);
      const candidateArtworks = new Map<string, { score: number; reasons: string[] }>();

      // 各好む作品について類似作品を探す
      for (const likedArtworkId of userProfile.likedArtworks) {
        const similarArtworks = await this.dataLoader.findSimilarArtworks(likedArtworkId, 20);
        
        for (const { artworkId, similarity } of similarArtworks) {
          if (!likedArtworks.has(artworkId)) {
            if (!candidateArtworks.has(artworkId)) {
              candidateArtworks.set(artworkId, { score: 0, reasons: [] });
            }
            const candidate = candidateArtworks.get(artworkId)!;
            candidate.score += similarity;
            
            const likedArtwork = await this.dataLoader.getArtwork(likedArtworkId);
            if (likedArtwork) {
              candidate.reasons.push(`「${likedArtwork.title}」と類似(${similarity.toFixed(2)})`);
            }
          }
        }
      }

      // スコア順にソート
      const recommendations = Array.from(candidateArtworks.entries())
        .map(([artworkId, { score, reasons }]) => ({
          artworkId,
          score: Math.min(score / userProfile.likedArtworks.length, 1.0),
          confidence: Math.min(score / 2, 0.9),
          algorithm: 'collaborative_item_based',
          reasons: reasons.slice(0, 3)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      console.log(`✅ アイテムベース推薦完了: ${recommendations.length}件`);
      return recommendations;

    } catch (error) {
      console.error('❌ アイテムベース推薦エラー:', error);
      return this.getFallbackRecommendations(limit, 'item_based_error');
    }
  }

  /**
   * コンテンツベース推薦
   */
  async getContentBasedRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      console.log(`🔍 コンテンツベース推薦開始: ${userId}`);

      const userProfile = await this.dataLoader.getUserProfile(userId);
      if (!userProfile) {
        return this.getFallbackRecommendations(limit, 'no_user_profile');
      }

      const allArtworks = await this.dataLoader.getAllArtworks();
      const likedArtworks = new Set(userProfile.likedArtworks);
      
      // ユーザーの嗜好分析
      const preferences = userProfile.preferences;
      const recommendations: RecommendationResult[] = [];

      for (const artwork of allArtworks) {
        if (likedArtworks.has(artwork.id)) continue;

        let score = 0;
        let reasons: string[] = [];

        // カテゴリマッチ
        const categoryPref = preferences.categories[artwork.category] || 0;
        if (categoryPref > 0) {
          score += categoryPref * 0.4;
          reasons.push(`好みのカテゴリ「${artwork.category}」`);
        }

        // スタイルマッチ
        if (artwork.style && preferences.styles[artwork.style]) {
          score += preferences.styles[artwork.style] * 0.3;
          reasons.push(`好みのスタイル「${artwork.style}」`);
        }

        // タグマッチ
        let tagScore = 0;
        for (const tag of artwork.tags) {
          if (preferences.tags[tag]) {
            tagScore += preferences.tags[tag];
            reasons.push(`好みのタグ「${tag}」`);
          }
        }
        score += Math.min(tagScore * 0.2, 0.4);

        // 人気度ボーナス
        if (artwork.likesCount > 0) {
          score += Math.min(artwork.likesCount / 10, 0.1);
        }

        if (score > 0.1) {
          recommendations.push({
            artworkId: artwork.id,
            score: Math.min(score, 1.0),
            confidence: Math.min(score * 0.8, 0.9),
            algorithm: 'content_based',
            reasons: reasons.slice(0, 3)
          });
        }
      }

      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      console.log(`✅ コンテンツベース推薦完了: ${sortedRecommendations.length}件`);
      return sortedRecommendations;

    } catch (error) {
      console.error('❌ コンテンツベース推薦エラー:', error);
      return this.getFallbackRecommendations(limit, 'content_based_error');
    }
  }

  /**
   * ハイブリッド推薦（大量リスト生成対応）
   */
  async getHybridRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      console.log(`🔍 ハイブリッド推薦開始: ${userId}`);

      const userProfile = await this.dataLoader.getUserProfile(userId);
      const hasUserData = userProfile && userProfile.likedArtworks.length > 0;

      // アルゴリズムの重み決定
      let weights = { collaborative: 0.3, content: 0.7 };
      if (hasUserData) {
        if (userProfile.likedArtworks.length >= 5) {
          weights = { collaborative: 0.6, content: 0.4 };
        } else {
          weights = { collaborative: 0.4, content: 0.6 };
        }
      }

      // 大量リスト生成のため、元のlimitの5倍を取得
      const bulkLimit = Math.max(limit * 5, 50); // 最低50個は生成
      
      // 並列で各推薦を実行
      const [collaborativeResults, contentResults] = await Promise.all([
        hasUserData ? this.getUserBasedRecommendations(userId, bulkLimit) : [],
        this.getContentBasedRecommendations(userId, bulkLimit)
      ]);

      // 結果をマージ
      const mergedResults = new Map<string, RecommendationResult>();

      // 協調フィルタリング結果を追加
      for (const result of collaborativeResults) {
        const weightedScore = result.score * weights.collaborative;
        mergedResults.set(result.artworkId, {
          ...result,
          score: weightedScore,
          confidence: result.confidence * weights.collaborative,
          algorithm: 'hybrid_collaborative_weighted',
          reasons: [...result.reasons, '類似ユーザーの嗜好']
        });
      }

      // コンテンツベース結果を追加またはマージ
      for (const result of contentResults) {
        const weightedScore = result.score * weights.content;
        
        if (mergedResults.has(result.artworkId)) {
          const existing = mergedResults.get(result.artworkId)!;
          existing.score += weightedScore;
          existing.confidence = Math.max(existing.confidence, result.confidence * weights.content);
          existing.algorithm = 'hybrid_combined';
          existing.reasons = [...new Set([...existing.reasons, ...result.reasons])].slice(0, 5);
        } else {
          mergedResults.set(result.artworkId, {
            ...result,
            score: weightedScore,
            confidence: result.confidence * weights.content,
            algorithm: 'hybrid_content_weighted',
            reasons: result.reasons
          });
        }
      }

      // 大量リストを生成（上位から質の高い推薦を確保）
      const allResults = Array.from(mergedResults.values())
        .sort((a, b) => b.score - a.score);
      
      // 最終的に返すのはlimit件だが、内部では大量リストを生成してからランダム選択用に備える
      const finalResults = allResults.slice(0, limit);

      console.log(`✅ ハイブリッド推薦完了: ${finalResults.length}件 (全候補:${allResults.length}件, 協調:${weights.collaborative}, コンテンツ:${weights.content})`);
      return finalResults;

    } catch (error) {
      console.error('❌ ハイブリッド推薦エラー:', error);
      return this.getFallbackRecommendations(limit, 'hybrid_error');
    }
  }

  /**
   * フォールバック推薦（人気ベース）
   */
  private async getFallbackRecommendations(limit: number, reason: string): Promise<RecommendationResult[]> {
    try {
      console.log(`🔄 フォールバック推薦実行: ${reason}`);
      
      const allArtworks = await this.dataLoader.getAllArtworks();
      const popularArtworks = allArtworks
        .sort((a, b) => b.likesCount - a.likesCount)
        .slice(0, limit);

      return popularArtworks.map((artwork, index) => ({
        artworkId: artwork.id,
        score: 0.5 - (index * 0.01),
        confidence: 0.3,
        algorithm: 'fallback_popular',
        reasons: ['人気の作品']
      }));

    } catch (error) {
      console.error('❌ フォールバック推薦エラー:', error);
      return [];
    }
  }

  /**
   * 大量推薦リスト生成（ランダム表示用）
   */
  async getBulkRecommendations(userId: string, targetSize: number = 50): Promise<RecommendationResult[]> {
    try {
      console.log(`🔍 大量推薦リスト生成開始: ${userId}, 目標: ${targetSize}件`);

      const userProfile = await this.dataLoader.getUserProfile(userId);
      const hasUserData = userProfile && userProfile.likedArtworks.length > 0;

      // アルゴリズムの重み決定
      let weights = { collaborative: 0.3, content: 0.7 };
      if (hasUserData) {
        if (userProfile.likedArtworks.length >= 5) {
          weights = { collaborative: 0.6, content: 0.4 };
        } else {
          weights = { collaborative: 0.4, content: 0.6 };
        }
      }

      // 大量リスト生成のため、目標サイズの2倍を取得
      const bulkLimit = targetSize * 2;
      
      // 並列で各推薦を実行
      const [collaborativeResults, contentResults] = await Promise.all([
        hasUserData ? this.getUserBasedRecommendations(userId, bulkLimit) : [],
        this.getContentBasedRecommendations(userId, bulkLimit)
      ]);

      // 結果をマージ
      const mergedResults = new Map<string, RecommendationResult>();

      // 協調フィルタリング結果を追加
      for (const result of collaborativeResults) {
        const weightedScore = result.score * weights.collaborative;
        mergedResults.set(result.artworkId, {
          ...result,
          score: weightedScore,
          confidence: result.confidence * weights.collaborative,
          algorithm: 'bulk_collaborative_weighted',
          reasons: [...result.reasons, '類似ユーザーの嗜好']
        });
      }

      // コンテンツベース結果を追加またはマージ
      for (const result of contentResults) {
        const weightedScore = result.score * weights.content;
        
        if (mergedResults.has(result.artworkId)) {
          const existing = mergedResults.get(result.artworkId)!;
          existing.score += weightedScore;
          existing.confidence = Math.max(existing.confidence, result.confidence * weights.content);
          existing.algorithm = 'bulk_hybrid_combined';
          existing.reasons = [...new Set([...existing.reasons, ...result.reasons])].slice(0, 5);
        } else {
          mergedResults.set(result.artworkId, {
            ...result,
            score: weightedScore,
            confidence: result.confidence * weights.content,
            algorithm: 'bulk_content_weighted',
            reasons: result.reasons
          });
        }
      }

      // スコア順にソートして目標サイズに制限
      const allResults = Array.from(mergedResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, targetSize);

      console.log(`✅ 大量推薦リスト生成完了: ${allResults.length}件 (協調:${weights.collaborative}, コンテンツ:${weights.content})`);
      return allResults;

    } catch (error) {
      console.error('❌ 大量推薦リスト生成エラー:', error);
      return this.getFallbackRecommendations(targetSize, 'bulk_recommendation_error');
    }
  }

  /**
   * 分析データの再読み込み
   */
  async reloadData(): Promise<void> {
    await this.dataLoader.reloadAnalysisData();
    console.log('🔄 分析データを再読み込みしました');
  }
}
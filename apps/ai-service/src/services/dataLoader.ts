import fs from 'fs';
import path from 'path';

export interface AnalysisData {
  metadata: {
    generatedAt: string;
    artworkCount: number;
    userCount: number;
    behaviorLogCount: number;
    likeCount: number;
    algorithm: string;
  };
  artworks: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    style: string;
    tags: string[];
    artistId: string;
    artistName: string;
    likesCount: number;
    createdAt: string;
    features: {
      category_score: number;
      style_score: number;
      tag_vector: number[];
      popularity_score: number;
      recency_score: number;
    };
  }>;
  userProfiles: Array<{
    userId: string;
    userType: string;
    likedArtworks: string[];
    preferences: {
      categories: Record<string, number>;
      styles: Record<string, number>;
      tags: Record<string, number>;
      artists: Record<string, number>;
    };
  }>;
  userItemMatrix: Record<string, Record<string, number>>;
  itemSimilarityMatrix: Record<string, Record<string, number>>;
  globalStats: {
    popularCategories: Array<{ category: string; count: number }>;
    popularStyles: Array<{ style: string; count: number }>;
    popularTags: Array<{ tag: string; count: number }>;
    topArtists: Array<{ id: string; name: string; artworkCount: number; totalLikes: number }>;
  };
}

/**
 * 分析データローダー
 * 事前に生成された分析ファイルを読み込んで使用
 */
export class DataLoader {
  private static instance: DataLoader;
  private analysisData: AnalysisData | null = null;
  private dataPath: string;

  private constructor() {
    this.dataPath = path.join(__dirname, '..', '..', 'data', 'analysis_data.json');
  }

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  /**
   * 分析データを読み込み
   */
  async loadAnalysisData(): Promise<AnalysisData> {
    if (this.analysisData) {
      return this.analysisData;
    }

    try {
      if (!fs.existsSync(this.dataPath)) {
        throw new Error(`Analysis data file not found: ${this.dataPath}`);
      }

      const rawData = fs.readFileSync(this.dataPath, 'utf-8');
      this.analysisData = JSON.parse(rawData);
      
      console.log(`✅ 分析データを読み込み: ${this.analysisData.metadata.artworkCount}作品, ${this.analysisData.metadata.userCount}ユーザー`);
      
      return this.analysisData;
    } catch (error) {
      console.error('❌ 分析データ読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * 分析データを強制再読み込み
   */
  async reloadAnalysisData(): Promise<AnalysisData> {
    this.analysisData = null;
    return await this.loadAnalysisData();
  }

  /**
   * アートワーク情報を取得
   */
  async getArtwork(artworkId: string): Promise<AnalysisData['artworks'][0] | null> {
    const data = await this.loadAnalysisData();
    return data.artworks.find(artwork => artwork.id === artworkId) || null;
  }

  /**
   * 全アートワーク情報を取得
   */
  async getAllArtworks(): Promise<AnalysisData['artworks']> {
    const data = await this.loadAnalysisData();
    return data.artworks;
  }

  /**
   * ユーザープロファイルを取得
   */
  async getUserProfile(userId: string): Promise<AnalysisData['userProfiles'][0] | null> {
    const data = await this.loadAnalysisData();
    return data.userProfiles.find(profile => profile.userId === userId) || null;
  }

  /**
   * ユーザーアイテムマトリックスを取得
   */
  async getUserItemMatrix(): Promise<Record<string, Record<string, number>>> {
    const data = await this.loadAnalysisData();
    return data.userItemMatrix;
  }

  /**
   * アイテム類似度マトリックスを取得
   */
  async getItemSimilarityMatrix(): Promise<Record<string, Record<string, number>>> {
    const data = await this.loadAnalysisData();
    return data.itemSimilarityMatrix;
  }

  /**
   * ユーザーの類似ユーザーを探す
   */
  async findSimilarUsers(userId: string, limit: number = 10): Promise<Array<{ userId: string; similarity: number }>> {
    const data = await this.loadAnalysisData();
    const userMatrix = data.userItemMatrix;
    
    if (!userMatrix[userId]) {
      return [];
    }

    const similarities: Array<{ userId: string; similarity: number }> = [];
    const targetUserItems = userMatrix[userId];

    Object.keys(userMatrix).forEach(otherUserId => {
      if (otherUserId !== userId) {
        const similarity = this.calculateCosineSimilarity(targetUserItems, userMatrix[otherUserId]);
        if (similarity > 0) {
          similarities.push({ userId: otherUserId, similarity });
        }
      }
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * アートワークの類似作品を探す
   */
  async findSimilarArtworks(artworkId: string, limit: number = 10): Promise<Array<{ artworkId: string; similarity: number }>> {
    const data = await this.loadAnalysisData();
    const similarityMatrix = data.itemSimilarityMatrix;
    
    if (!similarityMatrix[artworkId]) {
      return [];
    }

    const similarities = Object.entries(similarityMatrix[artworkId])
      .map(([id, similarity]) => ({ artworkId: id, similarity }))
      .filter(item => item.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities;
  }

  /**
   * カテゴリ別の人気作品を取得
   */
  async getPopularArtworksByCategory(category: string, limit: number = 10): Promise<AnalysisData['artworks']> {
    const data = await this.loadAnalysisData();
    return data.artworks
      .filter(artwork => artwork.category === category)
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, limit);
  }

  /**
   * グローバル統計を取得
   */
  async getGlobalStats(): Promise<AnalysisData['globalStats']> {
    const data = await this.loadAnalysisData();
    return data.globalStats;
  }

  /**
   * コサイン類似度を計算
   */
  private calculateCosineSimilarity(vectorA: Record<string, number>, vectorB: Record<string, number>): number {
    const keysA = Object.keys(vectorA);
    const keysB = Object.keys(vectorB);
    const allKeys = new Set([...keysA, ...keysB]);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    allKeys.forEach(key => {
      const valueA = vectorA[key] || 0;
      const valueB = vectorB[key] || 0;
      
      dotProduct += valueA * valueB;
      normA += valueA * valueA;
      normB += valueB * valueB;
    });

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 分析データのメタ情報を取得
   */
  async getMetadata(): Promise<AnalysisData['metadata']> {
    const data = await this.loadAnalysisData();
    return data.metadata;
  }
}
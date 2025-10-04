import { DatabaseService } from './databaseService';

export interface ContentFeature {
  category: string;
  style: string[];
  colorPalette: number[];
  complexity: number;
  artistStyle: string;
  tags: string[];
}

export interface ContentBasedResult {
  artworkId: string;
  score: number;
  confidence: number;
  reasons: string[];
}

/**
 * コンテンツベースフィルタリング（Content-Based Filtering）アルゴリズム実装
 * アートワークの特徴量とユーザーの嗜好プロファイルに基づいて推薦を生成
 */
export class ContentBasedFilteringService {
  private db: DatabaseService;
  private readonly FEATURE_WEIGHTS = {
    category: 0.25,
    style: 0.20,
    colorPalette: 0.15,
    complexity: 0.10,
    artistStyle: 0.15,
    tags: 0.15
  };

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * ユーザーの嗜好に基づくコンテンツベース推薦
   */
  async getContentBasedRecommendations(
    userId: string, 
    limit: number = 10
  ): Promise<ContentBasedResult[]> {
    // 1. ユーザーの嗜好プロファイルを構築
    const userProfile = await this.buildUserContentProfile(userId);
    
    if (!userProfile) {
      return [];
    }

    // 2. 全アートワークの特徴量を取得
    const artworks = await this.db.getAllArtworks();
    const userInteractedArtworks = await this.db.getUserInteractedArtworkIds(userId);

    // 3. 各アートワークとユーザープロファイルの類似度を計算
    const recommendations: ContentBasedResult[] = [];

    for (const artwork of artworks) {
      // ユーザーが既に見たアートワークはスキップ
      if (userInteractedArtworks.includes(artwork.id)) {
        continue;
      }

      const artworkFeatures = await this.extractArtworkFeatures(artwork);
      const similarity = this.calculateContentSimilarity(userProfile, artworkFeatures);
      
      if (similarity.score > 0.1) { // 閾値フィルタ
        recommendations.push({
          artworkId: artwork.id,
          score: similarity.score,
          confidence: similarity.confidence,
          reasons: similarity.reasons
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 特定のアートワークに類似したコンテンツを推薦
   */
  async getSimilarContentRecommendations(
    artworkId: string,
    userId: string,
    limit: number = 10
  ): Promise<ContentBasedResult[]> {
    const targetArtwork = await this.db.getArtworkById(artworkId);
    if (!targetArtwork) {
      return [];
    }

    const targetFeatures = await this.extractArtworkFeatures(targetArtwork);
    const allArtworks = await this.db.getAllArtworks();
    const userInteractedArtworks = await this.db.getUserInteractedArtworkIds(userId);

    const recommendations: ContentBasedResult[] = [];

    for (const artwork of allArtworks) {
      if (artwork.id === artworkId || userInteractedArtworks.includes(artwork.id)) {
        continue;
      }

      const artworkFeatures = await this.extractArtworkFeatures(artwork);
      const similarity = this.calculateFeatureSimilarity(targetFeatures, artworkFeatures);
      
      if (similarity.score > 0.2) {
        recommendations.push({
          artworkId: artwork.id,
          score: similarity.score,
          confidence: similarity.confidence,
          reasons: similarity.reasons
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * ユーザーのコンテンツ嗜好プロファイルを構築
   */
  private async buildUserContentProfile(userId: string): Promise<ContentFeature | null> {
    const userInteractions = await this.db.getUserInteractions(userId);
    
    if (userInteractions.length === 0) {
      return null;
    }

    // 高評価アートワークの特徴量を集計
    const highRatedInteractions = userInteractions.filter(i => i.rating > 0.7);
    
    if (highRatedInteractions.length === 0) {
      return null;
    }

    const categoryCount = new Map<string, number>();
    const styleCount = new Map<string, number>();
    const colorPalettes: number[][] = [];
    const complexityScores: number[] = [];
    const artistStyleCount = new Map<string, number>();
    const tagCount = new Map<string, number>();

    for (const interaction of highRatedInteractions) {
      const artwork = await this.db.getArtworkById(interaction.artworkId);
      if (!artwork) continue;

      const features = await this.extractArtworkFeatures(artwork);
      const weight = interaction.rating; // 評価を重みとして使用

      // カテゴリ
      categoryCount.set(features.category, (categoryCount.get(features.category) || 0) + weight);

      // スタイル
      features.style.forEach(style => {
        styleCount.set(style, (styleCount.get(style) || 0) + weight);
      });

      // カラーパレット
      if (features.colorPalette.length > 0) {
        colorPalettes.push(features.colorPalette.map(c => c * weight));
      }

      // 複雑さ
      complexityScores.push(features.complexity * weight);

      // アーティストスタイル
      artistStyleCount.set(features.artistStyle, (artistStyleCount.get(features.artistStyle) || 0) + weight);

      // タグ
      features.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + weight);
      });
    }

    // 最も好まれるカテゴリ
    const preferredCategory = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    // 最も好まれるスタイル（上位3つ）
    const preferredStyles = Array.from(styleCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    // 平均カラーパレット
    const avgColorPalette = this.calculateAverageColorPalette(colorPalettes);

    // 平均複雑さ
    const avgComplexity = complexityScores.length > 0 
      ? complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length 
      : 0.5;

    // 最も好まれるアーティストスタイル
    const preferredArtistStyle = Array.from(artistStyleCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    // 最も好まれるタグ（上位5つ）
    const preferredTags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    return {
      category: preferredCategory,
      style: preferredStyles,
      colorPalette: avgColorPalette,
      complexity: avgComplexity,
      artistStyle: preferredArtistStyle,
      tags: preferredTags
    };
  }

  /**
   * アートワークの特徴量を抽出
   */
  private async extractArtworkFeatures(artwork: any): Promise<ContentFeature> {
    const analysis = await this.db.getArtworkAnalysis(artwork.id);
    
    return {
      category: artwork.category || 'UNKNOWN',
      style: Array.isArray(artwork.style) ? artwork.style : [artwork.style || 'UNKNOWN'],
      colorPalette: analysis?.colorAnalysis ? this.parseColorAnalysis(analysis.colorAnalysis) : [],
      complexity: analysis?.qualityScore || 0.5,
      artistStyle: artwork.artistUserId, // アーティストIDをスタイル識別子として使用
      tags: artwork.tags || []
    };
  }

  /**
   * ユーザープロファイルとアートワーク特徴量の類似度を計算
   */
  private calculateContentSimilarity(
    userProfile: ContentFeature, 
    artworkFeatures: ContentFeature
  ): { score: number; confidence: number; reasons: string[] } {
    let totalScore = 0;
    const reasons: string[] = [];

    // カテゴリマッチ
    const categoryScore = userProfile.category === artworkFeatures.category ? 1.0 : 0.0;
    totalScore += categoryScore * this.FEATURE_WEIGHTS.category;
    if (categoryScore > 0) {
      reasons.push(`同じカテゴリ (${artworkFeatures.category})`);
    }

    // スタイルマッチ
    const styleOverlap = userProfile.style.filter(style => 
      artworkFeatures.style.includes(style)
    ).length;
    const styleScore = styleOverlap / Math.max(userProfile.style.length, artworkFeatures.style.length);
    totalScore += styleScore * this.FEATURE_WEIGHTS.style;
    if (styleScore > 0) {
      reasons.push(`類似スタイル (${styleOverlap}個一致)`);
    }

    // カラーパレット類似度
    const colorScore = this.calculateColorSimilarity(userProfile.colorPalette, artworkFeatures.colorPalette);
    totalScore += colorScore * this.FEATURE_WEIGHTS.colorPalette;
    if (colorScore > 0.5) {
      reasons.push('似た色合い');
    }

    // 複雑さ類似度
    const complexityScore = 1 - Math.abs(userProfile.complexity - artworkFeatures.complexity);
    totalScore += complexityScore * this.FEATURE_WEIGHTS.complexity;
    if (complexityScore > 0.7) {
      reasons.push('同程度の複雑さ');
    }

    // アーティストスタイル
    const artistScore = userProfile.artistStyle === artworkFeatures.artistStyle ? 1.0 : 0.0;
    totalScore += artistScore * this.FEATURE_WEIGHTS.artistStyle;
    if (artistScore > 0) {
      reasons.push('好みのアーティスト');
    }

    // タグ類似度
    const tagOverlap = userProfile.tags.filter(tag => 
      artworkFeatures.tags.includes(tag)
    ).length;
    const tagScore = tagOverlap > 0 ? tagOverlap / Math.max(userProfile.tags.length, artworkFeatures.tags.length) : 0;
    totalScore += tagScore * this.FEATURE_WEIGHTS.tags;
    if (tagScore > 0) {
      reasons.push(`共通タグ (${tagOverlap}個)`);
    }

    const confidence = this.calculateContentConfidence(userProfile, reasons.length);

    return {
      score: Math.max(0, Math.min(1, totalScore)),
      confidence,
      reasons
    };
  }

  /**
   * 特徴量間の類似度を計算
   */
  private calculateFeatureSimilarity(
    featuresA: ContentFeature, 
    featuresB: ContentFeature
  ): { score: number; confidence: number; reasons: string[] } {
    // 基本的にはユーザープロファイルとの類似度計算と同じロジック
    return this.calculateContentSimilarity(featuresA, featuresB);
  }

  /**
   * カラーパレット類似度を計算
   */
  private calculateColorSimilarity(colorsA: number[], colorsB: number[]): number {
    if (colorsA.length === 0 || colorsB.length === 0) {
      return 0;
    }

    // コサイン類似度でカラーベクトルを比較
    const minLength = Math.min(colorsA.length, colorsB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < minLength; i++) {
      dotProduct += colorsA[i] * colorsB[i];
      normA += colorsA[i] * colorsA[i];
      normB += colorsB[i] * colorsB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 平均カラーパレットを計算
   */
  private calculateAverageColorPalette(colorPalettes: number[][]): number[] {
    if (colorPalettes.length === 0) return [];

    const maxLength = Math.max(...colorPalettes.map(palette => palette.length));
    const avgPalette: number[] = new Array(maxLength).fill(0);

    for (const palette of colorPalettes) {
      for (let i = 0; i < palette.length; i++) {
        avgPalette[i] += palette[i];
      }
    }

    return avgPalette.map(sum => sum / colorPalettes.length);
  }

  /**
   * カラー分析データをパース
   */
  private parseColorAnalysis(colorAnalysis: any): number[] {
    if (typeof colorAnalysis === 'string') {
      try {
        const parsed = JSON.parse(colorAnalysis);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(colorAnalysis) ? colorAnalysis : [];
  }

  /**
   * コンテンツベースフィルタリングの信頼度を計算
   */
  private calculateContentConfidence(userProfile: ContentFeature, reasonCount: number): number {
    const profileCompleteness = this.calculateProfileCompleteness(userProfile);
    const reasonFactor = Math.min(reasonCount / 5, 1.0);
    
    return (profileCompleteness * 0.6) + (reasonFactor * 0.4);
  }

  /**
   * ユーザープロファイルの完全性を評価
   */
  private calculateProfileCompleteness(profile: ContentFeature): number {
    let completeness = 0;
    let totalFeatures = 0;

    // カテゴリ
    totalFeatures++;
    if (profile.category && profile.category !== 'UNKNOWN') completeness++;

    // スタイル
    totalFeatures++;
    if (profile.style.length > 0) completeness++;

    // カラーパレット
    totalFeatures++;
    if (profile.colorPalette.length > 0) completeness++;

    // 複雑さ
    totalFeatures++;
    if (profile.complexity > 0) completeness++;

    // アーティストスタイル
    totalFeatures++;
    if (profile.artistStyle) completeness++;

    // タグ
    totalFeatures++;
    if (profile.tags.length > 0) completeness++;

    return completeness / totalFeatures;
  }
}
// データベース関連型定義
export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

// AI推薦システム型
export interface UserPreferenceVector {
  userId: string;
  vector: number[];
  confidence: number;
  lastUpdated: Date;
}

export interface ArtworkFeatureVector {
  artworkId: string;
  features: number[];
  style: string;
  category: string;
  analyzed: Date;
}

export interface RecommendationScore {
  userId: string;
  artworkId: string;
  score: number;
  algorithm: string;
  computed: Date;
}
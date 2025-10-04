export interface RecommendationRequest {
  userId: string;
  limit?: number;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  style?: string[];
}

export interface RecommendationResult {
  artworkIds: string[];
  scores: number[];
  algorithm: string;
  metadata?: {
    totalCount: number;
    queryTime: number;
    confidence: number;
  };
}

export interface UserPreferenceVector {
  id: string;
  userId: string;
  preferenceVector: number[];
  preferredStyles: Record<string, number>;
  preferredCategories: Record<string, number>;
  profileConfidence: number;
  lastUpdated: Date;
}

export interface ArtworkAnalysis {
  id: string;
  artworkId: string;
  styleVector: number[];
  categoryScores: Record<string, number>;
  popularityScore: number;
  qualityScore: number;
  contentHash: string;
  lastAnalyzed: Date;
}

export interface PrecomputedRecommendation {
  id: string;
  userId: string;
  artworkId: string;
  score: number;
  algorithm: string;
  computedAt: Date;
  validUntil: Date;
}

export interface BatchProcessingStatus {
  taskType: 'user_analysis' | 'artwork_analysis' | 'recommendation_computation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  processedItems: number;
  totalItems: number;
}
import { DatabaseService } from '../services/databaseService';

export class UserAnalysisProcessor {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async processAllUsers(): Promise<void> {
    console.log('🔍 Starting user preference analysis...');
    
    try {
      const users = await this.db.getAllUsers();
      console.log(`📊 Found ${users.length} users to analyze`);

      let processed = 0;
      const batchSize = 10;

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(user => this.analyzeUserPreferences(user.id))
        );
        
        processed += batch.length;
        console.log(`✅ Processed ${processed}/${users.length} users (${Math.round((processed / users.length) * 100)}%)`);
      }

      console.log('🎉 User preference analysis completed');
    } catch (error) {
      console.error('❌ User analysis failed:', error);
      throw error;
    }
  }

  private async analyzeUserPreferences(userId: string): Promise<void> {
    try {
      // 既存の好み分析データを取得
      const existingProfile = await this.db.getUserPreferenceVector(userId);
      
      // ユーザーの行動履歴分析（簡易版実装）
      const preferenceData = await this.computeUserPreferences(userId);
      
      // データベースに保存
      await this.db.upsertUserPreferenceVector({
        userId,
        preferenceVector: preferenceData.preferenceVector,
        preferredStyles: preferenceData.preferredStyles,
        preferredCategories: preferenceData.preferredCategories,
        profileConfidence: preferenceData.confidence
      });

    } catch (error) {
      console.error(`Failed to analyze user ${userId}:`, error);
    }
  }

  private async computeUserPreferences(userId: string): Promise<{
    preferenceVector: number[];
    preferredStyles: Record<string, number>;
    preferredCategories: Record<string, number>;
    confidence: number;
  }> {
    // 実際の実装では、ユーザーの以下のデータを分析:
    // - 作品閲覧履歴
    // - いいね/お気に入り履歴  
    // - 購入履歴
    // - 検索履歴
    // - プロフィール情報

    // デモ用の簡易実装
    const preferenceVector = this.generateDemoPreferenceVector();
    const preferredStyles = this.generateDemoStylePreferences();
    const preferredCategories = this.generateDemoCategoryPreferences();

    return {
      preferenceVector,
      preferredStyles,
      preferredCategories,
      confidence: 0.7 // デモ用固定値
    };
  }

  private generateDemoPreferenceVector(): number[] {
    // 128次元の好みベクトル（デモ用）
    return Array.from({ length: 128 }, () => Math.random() * 2 - 1);
  }

  private generateDemoStylePreferences(): Record<string, number> {
    const styles = [
      'anime', 'realistic', 'cartoon', 'abstract', 'minimalist',
      'detailed', 'colorful', 'monochrome', 'fantasy', 'sci-fi'
    ];

    const preferences: Record<string, number> = {};
    styles.forEach(style => {
      preferences[style] = Math.random();
    });

    return preferences;
  }

  private generateDemoCategoryPreferences(): Record<string, number> {
    const categories = [
      'illustration', 'logo', 'character_design', 'background',
      'ui_design', 'concept_art', 'portrait', 'mascot'
    ];

    const preferences: Record<string, number> = {};
    categories.forEach(category => {
      preferences[category] = Math.random();
    });

    return preferences;
  }
}
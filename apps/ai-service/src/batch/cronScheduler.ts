import cron from 'node-cron';
import { DatabaseService } from '../services/databaseService';
import { UserAnalysisProcessor } from './userAnalysis';
import { ArtworkAnalysisProcessor } from './artworkAnalysis';
import { RecommendationComputationProcessor } from './recommendationComputation';

export class CronScheduler {
  private db: DatabaseService;
  private userAnalysisProcessor: UserAnalysisProcessor;
  private artworkAnalysisProcessor: ArtworkAnalysisProcessor;
  private recommendationProcessor: RecommendationComputationProcessor;
  private isRunning: boolean = false;

  constructor() {
    this.db = new DatabaseService();
    this.userAnalysisProcessor = new UserAnalysisProcessor(this.db);
    this.artworkAnalysisProcessor = new ArtworkAnalysisProcessor(this.db);
    this.recommendationProcessor = new RecommendationComputationProcessor(this.db);
  }

  async initialize(): Promise<void> {
    await this.db.connect();
    console.log('🕒 CronScheduler initialized');
  }

  startScheduler(): void {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting batch processing scheduler...');

    // ユーザー分析: 毎日 03:00
    const userAnalysisCron = process.env.BATCH_USER_ANALYSIS_CRON || '0 3 * * *';
    cron.schedule(userAnalysisCron, async () => {
      console.log('📊 Starting scheduled user analysis...');
      try {
        await this.userAnalysisProcessor.processAllUsers();
        console.log('✅ Scheduled user analysis completed');
      } catch (error) {
        console.error('❌ Scheduled user analysis failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Tokyo'
    });

    // アートワーク分析: 毎日 04:00
    const artworkAnalysisCron = process.env.BATCH_ARTWORK_ANALYSIS_CRON || '0 4 * * *';
    cron.schedule(artworkAnalysisCron, async () => {
      console.log('🎨 Starting scheduled artwork analysis...');
      try {
        await this.artworkAnalysisProcessor.processAllArtworks();
        console.log('✅ Scheduled artwork analysis completed');
      } catch (error) {
        console.error('❌ Scheduled artwork analysis failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Tokyo'
    });

    // 推薦計算: 毎日 05:00
    const recommendationCron = process.env.BATCH_RECOMMENDATION_CRON || '0 5 * * *';
    cron.schedule(recommendationCron, async () => {
      console.log('🤖 Starting scheduled recommendation computation...');
      try {
        await this.recommendationProcessor.computeRecommendationsForAllUsers();
        await this.recommendationProcessor.cleanupExpiredRecommendations();
        
        const stats = await this.recommendationProcessor.getRecommendationStats();
        console.log('📈 Recommendation stats:', stats);
        console.log('✅ Scheduled recommendation computation completed');
      } catch (error) {
        console.error('❌ Scheduled recommendation computation failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Tokyo'
    });

    // ヘルスチェック用: 毎時実行
    cron.schedule('0 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Tokyo'
    });

    console.log('✅ All batch processing jobs scheduled');
    console.log(`📅 User Analysis: ${userAnalysisCron}`);
    console.log(`📅 Artwork Analysis: ${artworkAnalysisCron}`);
    console.log(`📅 Recommendation Computation: ${recommendationCron}`);
  }

  stopScheduler(): void {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler is not running');
      return;
    }

    // Note: node-cron doesn't have a global destroy method
    // Individual tasks are managed by their returned objects
    this.isRunning = false;
    console.log('⏹️ Batch processing scheduler stopped');
  }

  private async performHealthCheck(): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`💓 Health check at ${timestamp}`);
    
    try {
      // データベース接続確認
      await this.db.connect();
      
      // 基本的な統計情報を取得
      const users = await this.db.getAllUsers();
      const artworks = await this.db.getAllArtworks();
      
      console.log(`📊 System status: ${users.length} users, ${artworks.length} artworks`);
      
    } catch (error) {
      console.error('❌ Health check detected issues:', error);
    }
  }

  // 手動実行用メソッド
  async runUserAnalysis(): Promise<void> {
    console.log('🔄 Manual user analysis triggered');
    try {
      await this.userAnalysisProcessor.processAllUsers();
      console.log('✅ Manual user analysis completed');
    } catch (error) {
      console.error('❌ Manual user analysis failed:', error);
      throw error;
    }
  }

  async runArtworkAnalysis(): Promise<void> {
    console.log('🔄 Manual artwork analysis triggered');
    try {
      await this.artworkAnalysisProcessor.processAllArtworks();
      console.log('✅ Manual artwork analysis completed');
    } catch (error) {
      console.error('❌ Manual artwork analysis failed:', error);
      throw error;
    }
  }

  async runRecommendationComputation(): Promise<void> {
    console.log('🔄 Manual recommendation computation triggered');
    try {
      await this.recommendationProcessor.computeRecommendationsForAllUsers();
      await this.recommendationProcessor.cleanupExpiredRecommendations();
      console.log('✅ Manual recommendation computation completed');
    } catch (error) {
      console.error('❌ Manual recommendation computation failed:', error);
      throw error;
    }
  }

  getSchedulerStatus(): {
    isRunning: boolean;
    scheduledJobs: string[];
  } {
    return {
      isRunning: this.isRunning,
      scheduledJobs: [
        `User Analysis: ${process.env.BATCH_USER_ANALYSIS_CRON || '0 3 * * *'}`,
        `Artwork Analysis: ${process.env.BATCH_ARTWORK_ANALYSIS_CRON || '0 4 * * *'}`,
        `Recommendation Computation: ${process.env.BATCH_RECOMMENDATION_CRON || '0 5 * * *'}`,
        'Health Check: 0 * * * *'
      ]
    };
  }
}

// CronScheduler起動用のメイン関数
async function main() {
  const scheduler = new CronScheduler();
  
  try {
    await scheduler.initialize();
    scheduler.startScheduler();
    
    console.log('🎯 CronScheduler is running. Press Ctrl+C to stop.');
    
    // グレースフルシャットダウン
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down scheduler...');
      scheduler.stopScheduler();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down scheduler...');
      scheduler.stopScheduler();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start CronScheduler:', error);
    process.exit(1);
  }
}

// 直接実行された場合のみ起動
if (require.main === module) {
  main();
}

export default CronScheduler;
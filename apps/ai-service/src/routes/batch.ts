import { Router, Request, Response } from 'express';
import CronScheduler from '../batch/cronScheduler';

const router = Router();

// CronScheduler instance
let cronScheduler: CronScheduler | null = null;

// 管理者認証ミドルウェア（より強固な認証が必要）
const authenticateAdmin = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  // 本番環境では強力な管理者認証を実装する必要がある
  if (!apiKey || apiKey !== process.env.AI_API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin access required'
    });
  }
  
  next();
};

// CronSchedulerの初期化
const initializeScheduler = async (): Promise<CronScheduler> => {
  if (!cronScheduler) {
    cronScheduler = new CronScheduler();
    await cronScheduler.initialize();
  }
  return cronScheduler;
};

// スケジューラー状態取得
router.get('/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    if (!cronScheduler) {
      return res.json({
        schedulerStatus: 'not_initialized',
        message: 'Scheduler has not been started yet'
      });
    }

    const status = cronScheduler.getSchedulerStatus();
    
    res.json({
      schedulerStatus: status.isRunning ? 'running' : 'stopped',
      scheduledJobs: status.scheduledJobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get scheduler status',
      message: (error as Error).message
    });
  }
});

// スケジューラー開始
router.post('/start', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const scheduler = await initializeScheduler();
    scheduler.startScheduler();
    
    res.json({
      message: 'Batch processing scheduler started',
      status: 'running',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to start scheduler',
      message: (error as Error).message
    });
  }
});

// スケジューラー停止
router.post('/stop', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    if (!cronScheduler) {
      return res.status(400).json({
        error: 'Scheduler not running',
        message: 'Scheduler has not been started'
      });
    }

    cronScheduler.stopScheduler();
    
    res.json({
      message: 'Batch processing scheduler stopped',
      status: 'stopped',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop scheduler',
      message: (error as Error).message
    });
  }
});

// 手動ユーザー分析実行
router.post('/run/user-analysis', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const scheduler = await initializeScheduler();
    
    // 非同期で実行（長時間処理のため）
    scheduler.runUserAnalysis()
      .then(() => {
        console.log('✅ Manual user analysis completed');
      })
      .catch((error) => {
        console.error('❌ Manual user analysis failed:', error);
      });
    
    res.json({
      message: 'User analysis started',
      status: 'running',
      note: 'This is a long-running process. Check logs for completion status.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to start user analysis',
      message: (error as Error).message
    });
  }
});

// 手動アートワーク分析実行
router.post('/run/artwork-analysis', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const scheduler = await initializeScheduler();
    
    // 非同期で実行（長時間処理のため）
    scheduler.runArtworkAnalysis()
      .then(() => {
        console.log('✅ Manual artwork analysis completed');
      })
      .catch((error) => {
        console.error('❌ Manual artwork analysis failed:', error);
      });
    
    res.json({
      message: 'Artwork analysis started',
      status: 'running',
      note: 'This is a long-running process. Check logs for completion status.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to start artwork analysis',
      message: (error as Error).message
    });
  }
});

// 手動推薦計算実行
router.post('/run/recommendation-computation', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const scheduler = await initializeScheduler();
    
    // 非同期で実行（長時間処理のため）
    scheduler.runRecommendationComputation()
      .then(() => {
        console.log('✅ Manual recommendation computation completed');
      })
      .catch((error) => {
        console.error('❌ Manual recommendation computation failed:', error);
      });
    
    res.json({
      message: 'Recommendation computation started',
      status: 'running',
      note: 'This is a long-running process. Check logs for completion status.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to start recommendation computation',
      message: (error as Error).message
    });
  }
});

// 全バッチ処理実行
router.post('/run/all', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const scheduler = await initializeScheduler();
    
    // 順次実行（非同期）
    (async () => {
      try {
        console.log('🚀 Starting full batch processing pipeline...');
        
        await scheduler.runUserAnalysis();
        console.log('✅ User analysis completed');
        
        await scheduler.runArtworkAnalysis();
        console.log('✅ Artwork analysis completed');
        
        await scheduler.runRecommendationComputation();
        console.log('✅ Recommendation computation completed');
        
        console.log('🎉 Full batch processing pipeline completed');
      } catch (error) {
        console.error('❌ Full batch processing pipeline failed:', error);
      }
    })();
    
    res.json({
      message: 'Full batch processing pipeline started',
      status: 'running',
      sequence: [
        'User Analysis',
        'Artwork Analysis', 
        'Recommendation Computation'
      ],
      note: 'This is a very long-running process. Check logs for completion status.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to start full batch processing',
      message: (error as Error).message
    });
  }
});

// バッチ処理情報
router.get('/info', authenticateAdmin, (req: Request, res: Response) => {
  res.json({
    service: 'CreatorVridge AI Batch Processing',
    version: '1.0.0',
    description: 'Batch processing management for AI recommendation system',
    endpoints: {
      'GET /status': 'Get scheduler status',
      'POST /start': 'Start scheduler',
      'POST /stop': 'Stop scheduler',
      'POST /run/user-analysis': 'Run user analysis manually',
      'POST /run/artwork-analysis': 'Run artwork analysis manually',
      'POST /run/recommendation-computation': 'Run recommendation computation manually',
      'POST /run/all': 'Run full batch processing pipeline',
      'GET /info': 'Service information'
    },
    defaultSchedule: {
      userAnalysis: process.env.BATCH_USER_ANALYSIS_CRON || '0 3 * * *',
      artworkAnalysis: process.env.BATCH_ARTWORK_ANALYSIS_CRON || '0 4 * * *',
      recommendationComputation: process.env.BATCH_RECOMMENDATION_CRON || '0 5 * * *'
    },
    timezone: 'Asia/Tokyo'
  });
});

export default router;
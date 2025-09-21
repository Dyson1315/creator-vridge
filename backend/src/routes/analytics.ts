import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

interface BehaviorLogRequest {
  sessionId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: any;
  userAgent?: string;
  referrer?: string;
}

// ユーザー行動ログの記録
router.post('/behavior', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const {
      sessionId,
      action,
      targetType,
      targetId,
      metadata,
      userAgent,
      referrer
    }: BehaviorLogRequest = req.body;

    // 必須フィールドの検証
    if (!action || !targetType) {
      return res.status(400).json({ 
        error: 'action and targetType are required' 
      });
    }

    // IPアドレスの取得（匿名化）
    const ipAddress = req.ip ? req.ip.replace(/\.\d+$/, '.xxx') : undefined;

    const behaviorLog = await prisma.userBehaviorLog.create({
      data: {
        userId,
        sessionId,
        action,
        targetType,
        targetId,
        metadata,
        userAgent: userAgent || req.get('User-Agent'),
        ipAddress,
        referrer: referrer || req.get('Referer'),
      }
    });

    console.log(`📊 User behavior logged: ${userId} - ${action} on ${targetType}${targetId ? ` (${targetId})` : ''}`);

    res.status(201).json({
      message: 'Behavior logged successfully',
      data: {
        id: behaviorLog.id,
        timestamp: behaviorLog.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Failed to log user behavior:', error);
    res.status(500).json({ 
      error: 'Failed to log behavior',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// バッチ行動ログの記録
router.post('/behavior/batch', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { logs }: { logs: BehaviorLogRequest[] } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ 
        error: 'logs array is required and must not be empty' 
      });
    }

    // IPアドレスの取得（匿名化）
    const ipAddress = req.ip ? req.ip.replace(/\.\d+$/, '.xxx') : undefined;

    const behaviorLogs = await prisma.userBehaviorLog.createMany({
      data: logs.map(log => ({
        userId,
        sessionId: log.sessionId,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        metadata: log.metadata,
        userAgent: log.userAgent || req.get('User-Agent'),
        ipAddress,
        referrer: log.referrer || req.get('Referer'),
      }))
    });

    console.log(`📊 Batch behavior logged: ${userId} - ${behaviorLogs.count} actions`);

    res.status(201).json({
      message: 'Batch behavior logged successfully',
      data: {
        count: behaviorLogs.count
      }
    });

  } catch (error) {
    console.error('❌ Failed to log batch behavior:', error);
    res.status(500).json({ 
      error: 'Failed to log batch behavior',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// ユーザー行動分析データの取得（開発用）
router.get('/behavior/stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    // アクション別統計
    const actionStats = await prisma.userBehaviorLog.groupBy({
      by: ['action'],
      where: {
        userId,
        timestamp: {
          gte: daysAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // ターゲットタイプ別統計
    const targetTypeStats = await prisma.userBehaviorLog.groupBy({
      by: ['targetType'],
      where: {
        userId,
        timestamp: {
          gte: daysAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // 時間別活動統計
    const recentActivity = await prisma.userBehaviorLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: daysAgo
        }
      },
      select: {
        action: true,
        targetType: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50
    });

    res.json({
      stats: {
        period: `Last ${days} days`,
        actionStats: actionStats.map(stat => ({
          action: stat.action,
          count: stat._count.id
        })),
        targetTypeStats: targetTypeStats.map(stat => ({
          targetType: stat.targetType,
          count: stat._count.id
        })),
        recentActivity,
        totalLogs: actionStats.reduce((sum, stat) => sum + stat._count.id, 0)
      }
    });

  } catch (error) {
    console.error('❌ Failed to get behavior stats:', error);
    res.status(500).json({ 
      error: 'Failed to get behavior stats',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
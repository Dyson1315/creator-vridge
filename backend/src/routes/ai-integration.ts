import { Router, Request, Response } from 'express';
import { AITokenManager } from '../utils/aiTokenManager';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * AI API統合管理用エンドポイント
 * AI APIプロジェクトとの接続問題を解決するための情報提供
 */

/**
 * GET /api/ai-integration/config
 * AI API用の設定情報を取得（認証不要、AI APIからアクセス用）
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await AITokenManager.generateAIApiConfig();
    
    if (!config) {
      return res.status(500).json({
        error: 'Failed to generate AI API configuration',
        message: 'AI user not found or token generation failed'
      });
    }

    res.json({
      success: true,
      config: {
        baseUrl: config.baseUrl,
        endpoints: config.endpoints,
        // セキュリティのためトークンは別途提供
        tokenEndpoint: '/api/ai-integration/token'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get AI integration config:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate configuration'
    });
  }
});

/**
 * GET /api/ai-integration/token
 * AI API用の有効なJWTトークンを取得（認証不要、AI APIからアクセス用）
 */
router.get('/token', async (req: Request, res: Response) => {
  try {
    const token = await AITokenManager.getCurrentToken();
    
    if (!token) {
      return res.status(500).json({
        error: 'Failed to generate token',
        message: 'AI user not found or token generation failed'
      });
    }

    res.json({
      success: true,
      token: token,
      type: 'Bearer',
      expiresIn: '7d',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get AI token:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate token'
    });
  }
});

/**
 * GET /api/ai-integration/token/long-term
 * AI API用の長期有効トークンを取得（管理者用、認証必要）
 */
router.get('/token/long-term', authenticateToken, async (req: Request, res: Response) => {
  try {
    // AIユーザーのみアクセス可能
    if (req.user?.userType !== 'AI') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only AI users can access long-term tokens'
      });
    }

    const token = await AITokenManager.generateLongTermToken();
    
    if (!token) {
      return res.status(500).json({
        error: 'Failed to generate long-term token',
        message: 'AI user not found or token generation failed'
      });
    }

    res.json({
      success: true,
      token: token,
      type: 'Bearer',
      expiresIn: '30d',
      warning: 'Store this token securely. It will not be shown again.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get long-term AI token:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate long-term token'
    });
  }
});

/**
 * GET /api/ai-integration/test
 * AI API接続をテスト（認証不要）
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const token = await AITokenManager.getCurrentToken();
    
    if (!token) {
      return res.status(500).json({
        success: false,
        error: 'No token available for testing'
      });
    }

    const isValid = await AITokenManager.testTokenValidity(token);
    
    res.json({
      success: true,
      tokenValid: isValid,
      message: isValid ? 'Token is valid and API is accessible' : 'Token validation failed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI integration test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-integration/user-info
 * AI ユーザー情報を取得（認証必要）
 */
router.get('/user-info', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (req.user?.userType !== 'AI') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only AI users can access this information'
      });
    }

    const aiUserInfo = await AITokenManager.getAIUserInfo();
    
    if (!aiUserInfo) {
      return res.status(404).json({
        error: 'AI user not found',
        message: 'No AI user exists in the system'
      });
    }

    res.json({
      success: true,
      aiUser: aiUserInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get AI user info:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve AI user information'
    });
  }
});

export default router;
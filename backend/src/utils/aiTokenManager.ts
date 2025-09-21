import { PrismaClient } from '@prisma/client';
import { generateToken } from './jwt';

/**
 * AI APIユーザー用のJWTトークン管理ユーティリティ
 * AI APIプロジェクトとの接続問題を解決するための長期トークン管理
 */
export class AITokenManager {
  private static prisma = new PrismaClient();

  /**
   * AIユーザーの長期有効トークンを生成
   * 通常の7日間ではなく30日間有効なトークンを生成
   */
  static async generateLongTermToken(): Promise<string | null> {
    try {
      const aiUser = await this.prisma.user.findFirst({
        where: { userType: 'AI' }
      });

      if (!aiUser) {
        console.error('AI user not found');
        return null;
      }

      // 30日間有効な長期トークンを生成
      const longTermToken = generateToken({
        userId: aiUser.id,
        email: aiUser.email,
        userType: aiUser.userType
      }, '30d'); // 30日間有効

      console.log('🔑 New long-term AI token generated (30 days validity)');
      console.log('Token (first 50 chars):', longTermToken.substring(0, 50) + '...');
      
      return longTermToken;
    } catch (error) {
      console.error('Failed to generate AI token:', error);
      return null;
    }
  }

  /**
   * AIユーザーの現在の有効トークンを取得
   */
  static async getCurrentToken(): Promise<string | null> {
    try {
      const aiUser = await this.prisma.user.findFirst({
        where: { userType: 'AI' }
      });

      if (!aiUser) {
        return null;
      }

      // 標準的な有効期限でトークンを生成
      return generateToken({
        userId: aiUser.id,
        email: aiUser.email,
        userType: aiUser.userType
      });
    } catch (error) {
      console.error('Failed to get current AI token:', error);
      return null;
    }
  }

  /**
   * AIユーザーの情報を取得
   */
  static async getAIUserInfo() {
    try {
      const aiUser = await this.prisma.user.findFirst({
        where: { userType: 'AI' },
        select: {
          id: true,
          email: true,
          userType: true,
          status: true,
          createdAt: true
        }
      });

      return aiUser;
    } catch (error) {
      console.error('Failed to get AI user info:', error);
      return null;
    }
  }

  /**
   * トークンの有効性をテスト
   */
  static async testTokenValidity(token: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/v1/recommendations/artworks?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Token validity test failed:', error);
      return false;
    }
  }

  /**
   * AI API用の設定情報を生成
   */
  static async generateAIApiConfig(): Promise<{
    token: string;
    baseUrl: string;
    endpoints: {
      artworks: string;
      artists: string;
      feedback: string;
    };
  } | null> {
    const token = await this.getCurrentToken();
    if (!token) {
      return null;
    }

    return {
      token,
      baseUrl: 'http://localhost:3001/api',
      endpoints: {
        artworks: '/recommendations/artworks',
        artists: '/recommendations/artists', 
        feedback: '/recommendations/feedback'
      }
    };
  }
}
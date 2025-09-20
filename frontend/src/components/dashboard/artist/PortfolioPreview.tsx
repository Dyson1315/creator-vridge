'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  likes: number;
  views: number;
  isPublic: boolean;
  tags: string[];
}

interface PortfolioStats {
  totalItems: number;
  totalViews: number;
  totalLikes: number;
  monthlyViews: number;
  topCategory: string;
}

export default function PortfolioPreview() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ポートフォリオデータを取得
    const fetchPortfolio = async () => {
      try {
        // TODO: API呼び出し
        // 仮のデータ
        setStats({
          totalItems: 23,
          totalViews: 1420,
          totalLikes: 156,
          monthlyViews: 245,
          topCategory: 'キャラクターデザイン'
        });

        setPortfolioItems([
          {
            id: '1',
            title: '魔法少女キャラクターデザイン',
            category: 'キャラクターデザイン',
            imageUrl: '/api/placeholder/portfolio1',
            description: 'オリジナル魔法少女のキャラクターデザイン。パステルカラーを基調とした可愛らしいデザイン。',
            createdAt: '2024-09-10',
            likes: 24,
            views: 156,
            isPublic: true,
            tags: ['魔法少女', 'パステル', 'オリジナル']
          },
          {
            id: '2',
            title: 'VTuberアバターイラスト',
            category: 'VTuberイラスト',
            imageUrl: '/api/placeholder/portfolio2',
            description: '依頼制作したVTuberアバター。宇宙をテーマにした幻想的なデザイン。',
            createdAt: '2024-09-05',
            likes: 31,
            views: 203,
            isPublic: true,
            tags: ['VTuber', '宇宙', '幻想的']
          },
          {
            id: '3',
            title: 'Live2D用表情差分',
            category: 'Live2D',
            imageUrl: '/api/placeholder/portfolio3',
            description: 'Live2Dアニメーション用の表情差分イラスト。豊かな表情表現を意識。',
            createdAt: '2024-08-28',
            likes: 18,
            views: 89,
            isPublic: true,
            tags: ['Live2D', '表情差分', 'アニメーション']
          },
          {
            id: '4',
            title: 'ファンタジーRPG風イラスト',
            category: 'イラスト',
            imageUrl: '/api/placeholder/portfolio4',
            description: 'ファンタジーRPGをイメージした背景込みのイラスト。詳細な世界観設定付き。',
            createdAt: '2024-08-20',
            likes: 42,
            views: 298,
            isPublic: true,
            tags: ['ファンタジー', 'RPG', '背景込み']
          },
          {
            id: '5',
            title: 'アニメ調ポートレート',
            category: 'ポートレート',
            imageUrl: '/api/placeholder/portfolio5',
            description: 'アニメ調のポートレートイラスト。柔らかい色合いとライティングが特徴。',
            createdAt: '2024-08-15',
            likes: 27,
            views: 134,
            isPublic: false,
            tags: ['アニメ調', 'ポートレート', '柔らかい']
          },
          {
            id: '6',
            title: 'SDキャラクターデザイン',
            category: 'SDキャラ',
            imageUrl: '/api/placeholder/portfolio6',
            description: 'グッズ用SDキャラクターデザイン。様々なポーズバリエーション。',
            createdAt: '2024-08-10',
            likes: 15,
            views: 78,
            isPublic: true,
            tags: ['SD', 'グッズ', 'キャラクター']
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'キャラクターデザイン':
        return 'bg-primary-100 text-primary-800';
      case 'VTuberイラスト':
        return 'bg-secondary-100 text-secondary-800';
      case 'Live2D':
        return 'bg-purple-100 text-purple-800';
      case 'イラスト':
        return 'bg-blue-100 text-blue-800';
      case 'ポートレート':
        return 'bg-pink-100 text-pink-800';
      case 'SDキャラ':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-calm-100 text-calm-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ポートフォリオ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            {/* 統計情報のスケルトン */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-6 bg-calm-200 rounded mb-1"></div>
                  <div className="h-4 bg-calm-200 rounded w-16 mx-auto"></div>
                </div>
              ))}
            </div>
            {/* ポートフォリオアイテムのスケルトン */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-square bg-calm-200 rounded-lg"></div>
                  <div className="h-4 bg-calm-200 rounded w-3/4"></div>
                  <div className="h-3 bg-calm-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>ポートフォリオ</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/dashboard/artist/portfolio'}
          >
            管理
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 統計情報 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.totalItems}</div>
              <div className="text-sm text-calm-600">作品数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">{stats.totalViews}</div>
              <div className="text-sm text-calm-600">総閲覧数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalLikes}</div>
              <div className="text-sm text-calm-600">総いいね</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.monthlyViews}</div>
              <div className="text-sm text-calm-600">今月の閲覧</div>
            </div>
          </div>
        )}

        {/* ポートフォリオアイテム */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-calm-900">最新の作品</h4>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => window.location.href = '/dashboard/artist/portfolio/upload'}
            >
              + 作品追加
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {portfolioItems.slice(0, 6).map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg bg-calm-100 aspect-square mb-3">
                  {/* 作品画像プレースホルダー */}
                  <div className="w-full h-full bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <svg className="w-12 h-12 text-calm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  {/* オーバーレイ */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {item.views}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {item.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 公開状態インジケーター */}
                  <div className="absolute top-2 right-2">
                    {item.isPublic ? (
                      <div className="w-3 h-3 bg-secondary-500 rounded-full" title="公開中"></div>
                    ) : (
                      <div className="w-3 h-3 bg-calm-400 rounded-full" title="非公開"></div>
                    )}
                  </div>
                </div>

                {/* 作品情報 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-calm-900 text-sm truncate pr-2">
                      {item.title}
                    </h5>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                      getCategoryColor(item.category)
                    )}>
                      {item.category}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-0.5 rounded text-xs bg-calm-100 text-calm-600"
                      >
                        #{tag}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs text-calm-500">
                        +{item.tags.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-calm-500">
                    {item.createdAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* パフォーマンス指標 */}
        {stats && (
          <div className="bg-calm-50 rounded-xl p-4">
            <h4 className="font-semibold text-calm-900 mb-3">パフォーマンス</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-calm-600">人気カテゴリ</span>
                <p className="font-semibold text-calm-900">{stats.topCategory}</p>
              </div>
              <div>
                <span className="text-calm-600">平均いいね率</span>
                <p className="font-semibold text-calm-900">
                  {((stats.totalLikes / stats.totalViews) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex space-x-3 pt-4 border-t border-calm-200">
          <Button size="sm" className="flex-1">
            作品をアップロード
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            ポートフォリオ設定
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
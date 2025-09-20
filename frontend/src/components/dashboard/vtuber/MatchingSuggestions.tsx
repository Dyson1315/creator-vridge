'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ArtistSuggestion {
  id: string;
  name: string;
  profileImage: string;
  rating: number;
  reviewCount: number;
  skills: string[];
  priceRange: {
    min: number;
    max: number;
  };
  matchScore: number;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  portfolioPreview: string[];
  responseTime: string;
}

export default function MatchingSuggestions() {
  const [suggestions, setSuggestions] = useState<ArtistSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // マッチング提案を取得
    const fetchSuggestions = async () => {
      try {
        // TODO: API呼び出し
        // 仮のデータ
        setSuggestions([
          {
            id: '1',
            name: '桜咲アーティスト',
            profileImage: '/api/placeholder/avatar/artist1',
            rating: 4.8,
            reviewCount: 23,
            skills: ['キャラクターデザイン', 'Live2D', 'アニメ調'],
            priceRange: { min: 30000, max: 80000 },
            matchScore: 95,
            availability: 'AVAILABLE',
            portfolioPreview: ['/api/placeholder/portfolio1', '/api/placeholder/portfolio2'],
            responseTime: '2時間以内'
          },
          {
            id: '2',
            name: 'みどりの絵師さん',
            profileImage: '/api/placeholder/avatar/artist2',
            rating: 4.6,
            reviewCount: 15,
            skills: ['イラスト', 'コンセプトアート', 'カラーリング'],
            priceRange: { min: 25000, max: 60000 },
            matchScore: 88,
            availability: 'BUSY',
            portfolioPreview: ['/api/placeholder/portfolio3', '/api/placeholder/portfolio4'],
            responseTime: '4時間以内'
          },
          {
            id: '3',
            name: 'BlueArt Studio',
            profileImage: '/api/placeholder/avatar/artist3',
            rating: 4.9,
            reviewCount: 41,
            skills: ['3Dモデリング', 'テクスチャ', 'VRChat対応'],
            priceRange: { min: 50000, max: 120000 },
            matchScore: 82,
            availability: 'AVAILABLE',
            portfolioPreview: ['/api/placeholder/portfolio5', '/api/placeholder/portfolio6'],
            responseTime: '1時間以内'
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'AVAILABLE':
        return 'text-secondary-600 bg-secondary-100';
      case 'BUSY':
        return 'text-yellow-600 bg-yellow-100';
      case 'UNAVAILABLE':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-calm-600 bg-calm-100';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'AVAILABLE':
        return '対応可能';
      case 'BUSY':
        return '多忙';
      case 'UNAVAILABLE':
        return '対応不可';
      default:
        return '不明';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI マッチング提案</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border border-calm-200 rounded-xl p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-calm-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-calm-200 rounded w-1/3"></div>
                    <div className="h-3 bg-calm-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-8 bg-calm-200 rounded"></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="h-20 bg-calm-200 rounded"></div>
                  <div className="h-20 bg-calm-200 rounded"></div>
                  <div className="h-20 bg-calm-200 rounded"></div>
                </div>
                <div className="h-10 bg-calm-200 rounded"></div>
              </div>
            ))}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>AI マッチング提案</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/dashboard/vtuber/matching'}
          >
            すべて見る
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {suggestions.map((artist) => (
            <div key={artist.id} className="border border-calm-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
              {/* アーティスト情報ヘッダー */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {artist.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-calm-900">{artist.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-calm-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{artist.rating} ({artist.reviewCount})</span>
                      </div>
                      <span>•</span>
                      <span>{artist.responseTime}返信</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-600 mb-1">
                    {artist.matchScore}%
                  </div>
                  <div className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    getAvailabilityColor(artist.availability)
                  )}>
                    {getAvailabilityText(artist.availability)}
                  </div>
                </div>
              </div>

              {/* スキルタグ */}
              <div className="flex flex-wrap gap-2 mb-4">
                {artist.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* ポートフォリオプレビュー */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {artist.portfolioPreview.map((image, index) => (
                  <div key={index} className="aspect-square bg-calm-100 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-calm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* 価格帯とアクション */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-calm-600">
                  予算: ¥{artist.priceRange.min.toLocaleString()} - ¥{artist.priceRange.max.toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    プロフィール
                  </Button>
                  <Button size="sm">
                    依頼する
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="mt-6 text-center">
          <p className="text-sm text-calm-600 mb-4">
            AI画像分析により、あなたの好みに合った絵師を提案しています
          </p>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/vtuber/matching'}
          >
            詳細なマッチング検索
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ProjectRequest {
  id: string;
  title: string;
  vtuberName: string;
  description: string;
  type: string;
  budget: {
    min: number;
    max: number;
  };
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'viewed' | 'responded' | 'accepted' | 'declined';
  requestedAt: string;
  estimatedHours: number;
  requirements: string[];
  attachments?: string[];
}

export default function RequestsList() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'viewed' | 'responded'>('all');

  useEffect(() => {
    // 依頼データを取得
    const fetchRequests = async () => {
      try {
        // TODO: API呼び出し
        // 仮のデータ
        setRequests([
          {
            id: '1',
            title: 'オリジナルVTuberキャラクターデザイン',
            vtuberName: '星空みお',
            description: '宇宙をテーマにした可愛らしいVTuberキャラクターをデザインしてほしいです。青と紫の色合いで、星座モチーフを取り入れていただけると嬉しいです。',
            type: 'キャラクターデザイン',
            budget: { min: 50000, max: 80000 },
            deadline: '2024-10-20',
            priority: 'high',
            status: 'new',
            requestedAt: '2024-09-18',
            estimatedHours: 25,
            requirements: ['フルボディ', '表情差分3種', '設定資料'],
            attachments: ['参考画像1.jpg', 'ラフスケッチ.pdf']
          },
          {
            id: '2',
            title: 'Live2Dモデル用立ち絵',
            vtuberName: '桜井ゆか',
            description: 'Live2D化予定のキャラクター立ち絵を制作してください。既存デザインがありますので、それをベースに調整をお願いします。',
            type: 'Live2D用イラスト',
            budget: { min: 40000, max: 60000 },
            deadline: '2024-11-05',
            priority: 'medium',
            status: 'viewed',
            requestedAt: '2024-09-17',
            estimatedHours: 20,
            requirements: ['PSDファイル', 'パーツ分け', 'ライン修正対応'],
            attachments: ['キャラクター設定.pdf']
          },
          {
            id: '3',
            title: 'サムネイル用イラスト制作',
            vtuberName: 'みどりん',
            description: 'YouTube動画のサムネイル用イラストを定期的に制作していただける方を探しています。ゲーム配信系の動画が多いです。',
            type: 'サムネイル',
            budget: { min: 8000, max: 15000 },
            deadline: '2024-09-28',
            priority: 'low',
            status: 'responded',
            requestedAt: '2024-09-16',
            estimatedHours: 4,
            requirements: ['1920x1080px', 'テキスト挿入可', '修正2回まで'],
          },
          {
            id: '4',
            title: 'アニバーサリー記念イラスト',
            vtuberName: '月野そら',
            description: '1周年記念の特別なイラストを制作してほしいです。ファンタジー系の世界観で、温かみのある雰囲気でお願いします。',
            type: 'イラスト',
            budget: { min: 30000, max: 50000 },
            deadline: '2024-10-31',
            priority: 'medium',
            status: 'new',
            requestedAt: '2024-09-15',
            estimatedHours: 15,
            requirements: ['背景込み', '高解像度', '商用利用可'],
          },
          {
            id: '5',
            title: 'グッズ用SDキャラクターデザイン',
            vtuberName: 'あいりす',
            description: 'グッズ制作用のSDキャラクターデザインをお願いします。アクリルスタンドやステッカーに使用予定です。',
            type: 'SDキャラ',
            budget: { min: 25000, max: 35000 },
            deadline: '2024-10-10',
            priority: 'high',
            status: 'new',
            requestedAt: '2024-09-14',
            estimatedHours: 12,
            requirements: ['複数ポーズ', 'ベクター形式', '商用利用可'],
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-primary-600 bg-primary-100';
      case 'viewed':
        return 'text-blue-600 bg-blue-100';
      case 'responded':
        return 'text-yellow-600 bg-yellow-100';
      case 'accepted':
        return 'text-secondary-600 bg-secondary-100';
      case 'declined':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-calm-600 bg-calm-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return '新着';
      case 'viewed':
        return '確認済み';
      case 'responded':
        return '返信済み';
      case 'accepted':
        return '受諾';
      case 'declined':
        return '辞退';
      default:
        return '不明';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-400';
      case 'medium':
        return 'border-l-yellow-400';
      case 'low':
        return 'border-l-secondary-400';
      default:
        return 'border-l-calm-400';
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const requestDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - requestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1日前';
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}週間前`;
    return `${Math.ceil(diffDays / 30)}ヶ月前`;
  };

  const handleAccept = (requestId: string) => {
    // TODO: API呼び出し
    console.log('Accept request:', requestId);
  };

  const handleDecline = (requestId: string) => {
    // TODO: API呼び出し
    console.log('Decline request:', requestId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>新しい依頼</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border border-calm-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-calm-200 rounded w-3/4"></div>
                    <div className="h-4 bg-calm-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-calm-200 rounded"></div>
                </div>
                <div className="h-16 bg-calm-200 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-calm-200 rounded w-1/3"></div>
                  <div className="flex space-x-2">
                    <div className="w-16 h-8 bg-calm-200 rounded"></div>
                    <div className="w-16 h-8 bg-calm-200 rounded"></div>
                  </div>
                </div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>新しい依頼</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/dashboard/artist/requests'}
          >
            すべて見る
          </Button>
        </div>
        
        {/* フィルター */}
        <div className="flex space-x-2 mt-4">
          {['all', 'new', 'viewed', 'responded'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                filter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-calm-100 text-calm-600 hover:bg-calm-200'
              )}
            >
              {status === 'all' ? 'すべて' :
               status === 'new' ? '新着' :
               status === 'viewed' ? '確認済み' : '返信済み'}
              {status === 'all' && (
                <span className="ml-1 text-xs">({requests.length})</span>
              )}
              {status === 'new' && (
                <span className="ml-1 text-xs">({requests.filter(r => r.status === 'new').length})</span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-calm-600">
              {filter === 'all' ? '依頼がありません' : `${filter === 'new' ? '新着' : filter === 'viewed' ? '確認済み' : '返信済み'}の依頼がありません`}
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className={cn(
                'border border-calm-200 rounded-xl p-5 hover:border-primary-300 transition-colors border-l-4',
                getPriorityColor(request.priority)
              )}>
                {/* ヘッダー */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-calm-900">{request.title}</h4>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(request.status)
                      )}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <p className="text-sm text-calm-600">
                      {request.vtuberName} • {request.type} • {getTimeAgo(request.requestedAt)}
                    </p>
                  </div>
                </div>

                {/* 説明 */}
                <p className="text-sm text-calm-700 mb-4 line-clamp-3">
                  {request.description}
                </p>

                {/* 要件タグ */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {request.requirements.map((req, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {req}
                    </span>
                  ))}
                </div>

                {/* プロジェクト詳細 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-calm-600">予算</span>
                    <p className="font-semibold text-calm-900">
                      ¥{request.budget.min.toLocaleString()} - ¥{request.budget.max.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-calm-600">期限</span>
                    <p className="font-semibold text-calm-900">{request.deadline}</p>
                  </div>
                  <div>
                    <span className="text-calm-600">推定工数</span>
                    <p className="font-semibold text-calm-900">{request.estimatedHours}時間</p>
                  </div>
                  <div>
                    <span className="text-calm-600">優先度</span>
                    <p className={cn(
                      'font-semibold',
                      request.priority === 'high' ? 'text-red-600' :
                      request.priority === 'medium' ? 'text-yellow-600' : 'text-secondary-600'
                    )}>
                      {request.priority === 'high' ? '高' :
                       request.priority === 'medium' ? '中' : '低'}
                    </p>
                  </div>
                </div>

                {/* 添付ファイル */}
                {request.attachments && request.attachments.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm text-calm-600 mb-2 block">添付ファイル:</span>
                    <div className="flex flex-wrap gap-2">
                      {request.attachments.map((file, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-xs bg-calm-100 text-calm-700"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex space-x-3">
                  <Button size="sm">
                    詳細確認
                  </Button>
                  {request.status === 'new' || request.status === 'viewed' ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleAccept(request.id)}
                      >
                        受諾
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDecline(request.id)}
                      >
                        辞退
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline">
                      メッセージ
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* フッター */}
        <div className="mt-6 text-center">
          <p className="text-sm text-calm-600 mb-4">
            マッチング精度の高い依頼を優先的に表示しています
          </p>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/artist/requests'}
          >
            すべての依頼を見る
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
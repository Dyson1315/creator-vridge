'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'match' | 'project' | 'message' | 'payment' | 'review';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'info' | 'error';
  actionUrl?: string;
  metadata?: {
    amount?: number;
    username?: string;
    projectTitle?: string;
  };
}

interface RecentActivityProps {
  userType: 'VTUBER' | 'ARTIST';
  className?: string;
}

export default function RecentActivity({ userType, className }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // アクティビティデータを取得
    const fetchActivities = async () => {
      try {
        // TODO: API呼び出し
        // 仮のデータ（ユーザータイプによって異なる）
        if (userType === 'VTUBER') {
          setActivities([
            {
              id: '1',
              type: 'match',
              title: '新しいマッチングが見つかりました',
              description: '桜咲アーティストさんとの適合度95%',
              timestamp: '2024-09-19T10:30:00Z',
              status: 'success',
              actionUrl: '/dashboard/vtuber/matching',
              metadata: { username: '桜咲アーティスト' }
            },
            {
              id: '2',
              type: 'project',
              title: 'プロジェクトが完了しました',
              description: 'メインキャラクターデザインの最終調整が完了',
              timestamp: '2024-09-19T09:15:00Z',
              status: 'success',
              actionUrl: '/dashboard/vtuber/projects/1',
              metadata: { projectTitle: 'メインキャラクターデザイン' }
            },
            {
              id: '3',
              type: 'message',
              title: 'メッセージが届きました',
              description: 'みどりの絵師さんから進捗報告',
              timestamp: '2024-09-19T08:45:00Z',
              status: 'info',
              actionUrl: '/dashboard/shared/messages',
              metadata: { username: 'みどりの絵師さん' }
            },
            {
              id: '4',
              type: 'payment',
              title: '支払いが処理されました',
              description: 'Live2Dモデル制作の中間支払い',
              timestamp: '2024-09-18T16:20:00Z',
              status: 'success',
              actionUrl: '/dashboard/vtuber/earnings',
              metadata: { amount: 60000 }
            },
            {
              id: '5',
              type: 'review',
              title: 'レビューの投稿をお願いします',
              description: 'サムネイル用イラストの評価をお待ちしています',
              timestamp: '2024-09-18T14:30:00Z',
              status: 'warning',
              actionUrl: '/dashboard/vtuber/projects/3/review',
              metadata: { projectTitle: 'サムネイル用イラスト' }
            }
          ]);
        } else {
          setActivities([
            {
              id: '1',
              type: 'match',
              title: '新しい依頼が届きました',
              description: '星空みおさんからキャラクターデザインの依頼',
              timestamp: '2024-09-19T11:00:00Z',
              status: 'info',
              actionUrl: '/dashboard/artist/requests',
              metadata: { username: '星空みお' }
            },
            {
              id: '2',
              type: 'payment',
              title: '支払いを受け取りました',
              description: 'VTuberキャラデザインの最終支払い',
              timestamp: '2024-09-19T09:30:00Z',
              status: 'success',
              actionUrl: '/dashboard/artist/earnings',
              metadata: { amount: 32000 }
            },
            {
              id: '3',
              type: 'project',
              title: 'プロジェクトが承認されました',
              description: 'Live2D用立ち絵の最終確認が完了',
              timestamp: '2024-09-19T08:15:00Z',
              status: 'success',
              actionUrl: '/dashboard/artist/requests/2',
              metadata: { projectTitle: 'Live2D用立ち絵' }
            },
            {
              id: '4',
              type: 'message',
              title: 'メッセージが届きました',
              description: '月野そらさんから追加要望',
              timestamp: '2024-09-18T17:45:00Z',
              status: 'info',
              actionUrl: '/dashboard/shared/messages',
              metadata: { username: '月野そら' }
            },
            {
              id: '5',
              type: 'review',
              title: '新しいレビューが投稿されました',
              description: 'あいりすさんから5つ星の評価をいただきました',
              timestamp: '2024-09-18T15:20:00Z',
              status: 'success',
              actionUrl: '/dashboard/shared/profile',
              metadata: { username: 'あいりす' }
            }
          ]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userType]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'match':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'project':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'message':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'payment':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'review':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-secondary-600 bg-secondary-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'info':
        return 'text-primary-600 bg-primary-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-calm-600 bg-calm-100';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffTime = Math.abs(now.getTime() - activityTime.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return activityTime.toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="w-8 h-8 bg-calm-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-calm-200 rounded w-3/4"></div>
                  <div className="h-3 bg-calm-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>最近の活動</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-calm-600">
              <svg className="w-12 h-12 mx-auto mb-4 text-calm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>まだ活動履歴がありません</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 group">
                <div className={cn(
                  'p-2 rounded-full flex-shrink-0',
                  getStatusColor(activity.status)
                )}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-calm-900 group-hover:text-primary-700 transition-colors">
                      {activity.title}
                    </h4>
                    <span className="text-xs text-calm-500 flex-shrink-0 ml-2">
                      {getTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-calm-600 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  {activity.metadata && (
                    <div className="flex items-center space-x-4 mt-2 text-xs text-calm-500">
                      {activity.metadata.amount && (
                        <span>¥{activity.metadata.amount.toLocaleString()}</span>
                      )}
                      {activity.metadata.username && (
                        <span>{activity.metadata.username}</span>
                      )}
                      {activity.metadata.projectTitle && (
                        <span>{activity.metadata.projectTitle}</span>
                      )}
                    </div>
                  )}
                  {activity.actionUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 p-0 h-auto text-xs text-primary-600 hover:text-primary-700"
                      onClick={() => window.location.href = activity.actionUrl!}
                    >
                      詳細を確認 →
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {activities.length > 0 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/dashboard/activity'}
            >
              すべての活動を見る
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
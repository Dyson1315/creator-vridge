'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface EarningsData {
  currentMonth: {
    total: number;
    pending: number;
    completed: number;
  };
  lastMonth: number;
  monthlyTrend: {
    month: string;
    amount: number;
  }[];
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  upcomingPayments: {
    id: string;
    projectTitle: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'processing' | 'completed';
  }[];
  averageProjectValue: number;
  totalProjects: number;
}

export default function EarningsOverview() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 収益データを取得
    const fetchEarnings = async () => {
      try {
        // TODO: API呼び出し
        // 仮のデータ
        setEarnings({
          currentMonth: {
            total: 85000,
            pending: 35000,
            completed: 50000
          },
          lastMonth: 72000,
          monthlyTrend: [
            { month: '5月', amount: 65000 },
            { month: '6月', amount: 78000 },
            { month: '7月', amount: 72000 },
            { month: '8月', amount: 85000 },
          ],
          categoryBreakdown: [
            { category: 'キャラクターデザイン', amount: 45000, percentage: 53, color: 'bg-primary-500' },
            { category: 'イラスト', amount: 25000, percentage: 29, color: 'bg-secondary-500' },
            { category: 'Live2D', amount: 12000, percentage: 14, color: 'bg-purple-500' },
            { category: 'その他', amount: 3000, percentage: 4, color: 'bg-blue-500' },
          ],
          upcomingPayments: [
            {
              id: '1',
              projectTitle: 'VTuberキャラデザイン',
              amount: 32000,
              dueDate: '2024-09-25',
              status: 'pending'
            },
            {
              id: '2',
              projectTitle: 'Live2D用立ち絵',
              amount: 48000,
              dueDate: '2024-10-05',
              status: 'processing'
            },
          ],
          averageProjectValue: 28000,
          totalProjects: 18
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch earnings:', error);
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-secondary-600 bg-secondary-100';
      default:
        return 'text-calm-600 bg-calm-100';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '確認待ち';
      case 'processing':
        return '処理中';
      case 'completed':
        return '完了';
      default:
        return '不明';
    }
  };

  if (loading || !earnings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>収益概要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-calm-200 rounded w-3/4"></div>
            <div className="h-4 bg-calm-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-calm-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthGrowth = ((earnings.currentMonth.total - earnings.lastMonth) / earnings.lastMonth) * 100;
  const pendingPercentage = (earnings.currentMonth.pending / earnings.currentMonth.total) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span>収益概要</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/dashboard/artist/earnings'}
          >
            詳細
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 今月の収益 */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-calm-900">今月の収益</span>
            <div className={cn(
              'text-sm font-medium',
              monthGrowth >= 0 ? 'text-secondary-600' : 'text-red-600'
            )}>
              {monthGrowth >= 0 ? '+' : ''}{monthGrowth.toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-calm-900 mb-1">
            ¥{earnings.currentMonth.total.toLocaleString()}
          </div>
          <div className="text-sm text-calm-600">
            完了: ¥{earnings.currentMonth.completed.toLocaleString()} • 
            待機: ¥{earnings.currentMonth.pending.toLocaleString()}
          </div>
          
          {/* 進捗バー */}
          <div className="w-full bg-calm-200 rounded-full h-2 mt-3">
            <div 
              className="h-2 rounded-full bg-secondary-500"
              style={{ width: `${100 - pendingPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* カテゴリ別収益 */}
        <div>
          <h4 className="font-semibold text-calm-900 mb-3">カテゴリ別収益</h4>
          <div className="space-y-3">
            {earnings.categoryBreakdown.map((category, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-calm-900">
                    {category.category}
                  </span>
                  <span className="text-sm text-calm-600">
                    ¥{category.amount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-calm-200 rounded-full h-2">
                  <div 
                    className={cn('h-2 rounded-full', category.color)}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 月別トレンド */}
        <div>
          <h4 className="font-semibold text-calm-900 mb-3">月別トレンド</h4>
          <div className="space-y-2">
            {earnings.monthlyTrend.map((month, index) => {
              const maxAmount = Math.max(...earnings.monthlyTrend.map(m => m.amount));
              const percentage = (month.amount / maxAmount) * 100;
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-calm-600 w-12">{month.month}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-calm-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-calm-900 w-16 text-right">
                    ¥{(month.amount / 1000).toFixed(0)}k
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 予定支払い */}
        <div>
          <h4 className="font-semibold text-calm-900 mb-3">予定支払い</h4>
          <div className="space-y-3">
            {earnings.upcomingPayments.map((payment) => (
              <div key={payment.id} className="border border-calm-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-calm-900 text-sm">
                    {payment.projectTitle}
                  </h5>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    getPaymentStatusColor(payment.status)
                  )}>
                    {getPaymentStatusText(payment.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-calm-600">支払い予定: {payment.dueDate}</span>
                  <span className="font-semibold text-calm-900">
                    ¥{payment.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 統計情報 */}
        <div className="bg-calm-50 rounded-xl p-4">
          <h4 className="font-semibold text-calm-900 mb-3">統計</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-calm-600">平均案件単価</span>
              <p className="font-semibold text-calm-900">
                ¥{earnings.averageProjectValue.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-calm-600">完了プロジェクト</span>
              <p className="font-semibold text-calm-900">
                {earnings.totalProjects}件
              </p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-2 pt-4 border-t border-calm-200">
          <Button size="sm" className="flex-1">
            取引履歴
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            請求書発行
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface BudgetData {
  totalBudget: number;
  spentAmount: number;
  remainingAmount: number;
  monthlySpending: {
    month: string;
    amount: number;
  }[];
  categoryBreakdown: {
    category: string;
    amount: number;
    color: string;
  }[];
  upcomingPayments: {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'scheduled' | 'overdue';
  }[];
}

export default function BudgetOverview() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 予算データを取得
    const fetchBudgetData = async () => {
      try {
        // TODO: API呼び出し
        // 仮のデータ
        setBudgetData({
          totalBudget: 300000,
          spentAmount: 180000,
          remainingAmount: 120000,
          monthlySpending: [
            { month: '6月', amount: 45000 },
            { month: '7月', amount: 62000 },
            { month: '8月', amount: 38000 },
            { month: '9月', amount: 35000 },
          ],
          categoryBreakdown: [
            { category: 'キャラクターデザイン', amount: 80000, color: 'bg-primary-500' },
            { category: 'Live2D制作', amount: 60000, color: 'bg-secondary-500' },
            { category: 'イラスト', amount: 25000, color: 'bg-blue-500' },
            { category: 'その他', amount: 15000, color: 'bg-purple-500' },
          ],
          upcomingPayments: [
            {
              id: '1',
              description: 'Live2Dモデル中間支払い',
              amount: 72000,
              dueDate: '2024-09-25',
              status: 'pending'
            },
            {
              id: '2',
              description: 'キャラクターデザイン最終支払い',
              amount: 32000,
              dueDate: '2024-10-15',
              status: 'scheduled'
            },
          ]
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch budget data:', error);
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, []);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-calm-600 bg-calm-100';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '支払い待ち';
      case 'scheduled':
        return '予約済み';
      case 'overdue':
        return '期限切れ';
      default:
        return '不明';
    }
  };

  if (loading || !budgetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>予算管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-calm-200 rounded w-3/4"></div>
            <div className="h-4 bg-calm-200 rounded-full"></div>
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

  const spentPercentage = (budgetData.spentAmount / budgetData.totalBudget) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span>予算管理</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/dashboard/vtuber/earnings'}
          >
            詳細
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 予算概要 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-calm-900">
              今月の支出状況
            </span>
            <span className="text-sm text-calm-600">
              {spentPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-calm-200 rounded-full h-3 mb-3">
            <div 
              className={cn(
                'h-3 rounded-full transition-all duration-300',
                spentPercentage > 80 ? 'bg-red-500' :
                spentPercentage > 60 ? 'bg-yellow-500' : 'bg-primary-500'
              )}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-calm-600">使用金額</span>
              <p className="font-semibold text-calm-900">
                ¥{budgetData.spentAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-calm-600">残り予算</span>
              <p className="font-semibold text-calm-900">
                ¥{budgetData.remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* カテゴリ別内訳 */}
        <div>
          <h4 className="font-semibold text-calm-900 mb-3">カテゴリ別支出</h4>
          <div className="space-y-3">
            {budgetData.categoryBreakdown.map((category, index) => {
              const percentage = (category.amount / budgetData.spentAmount) * 100;
              return (
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
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 予定されている支払い */}
        <div>
          <h4 className="font-semibold text-calm-900 mb-3">予定支払い</h4>
          <div className="space-y-3">
            {budgetData.upcomingPayments.map((payment) => (
              <div key={payment.id} className="border border-calm-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-calm-900 text-sm">
                    {payment.description}
                  </h5>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    getPaymentStatusColor(payment.status)
                  )}>
                    {getPaymentStatusText(payment.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-calm-600">期限: {payment.dueDate}</span>
                  <span className="font-semibold text-calm-900">
                    ¥{payment.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 月別支出トレンド */}
        <div>
          <h4 className="font-semibold text-calm-900 mb-3">月別支出トレンド</h4>
          <div className="space-y-2">
            {budgetData.monthlySpending.map((month, index) => {
              const maxAmount = Math.max(...budgetData.monthlySpending.map(m => m.amount));
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

        {/* アクションボタン */}
        <div className="flex space-x-2 pt-4 border-t border-calm-200">
          <Button size="sm" className="flex-1">
            支払い履歴
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            予算設定
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
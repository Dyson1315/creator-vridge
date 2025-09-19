'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface AvailabilityData {
  status: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  capacity: {
    current: number;
    maximum: number;
  };
  schedule: {
    date: string;
    status: 'free' | 'busy' | 'blocked';
    notes?: string;
  }[];
  autoResponse: {
    enabled: boolean;
    message: string;
  };
  responseTime: {
    average: string;
    target: string;
  };
}

export default function AvailabilityStatus() {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    // 対応状況データを取得
    const fetchAvailability = async () => {
      try {
        // TODO: API呼び出し
        // 仮のデータ
        setAvailability({
          status: 'AVAILABLE',
          capacity: {
            current: 2,
            maximum: 4
          },
          schedule: [
            { date: '2024-09-19', status: 'busy', notes: 'キャラデザ制作中' },
            { date: '2024-09-20', status: 'free' },
            { date: '2024-09-21', status: 'free' },
            { date: '2024-09-22', status: 'busy', notes: 'Live2D対応' },
            { date: '2024-09-23', status: 'free' },
            { date: '2024-09-24', status: 'blocked', notes: '休み' },
            { date: '2024-09-25', status: 'free' },
          ],
          autoResponse: {
            enabled: true,
            message: 'ご依頼ありがとうございます。通常24時間以内にお返事いたします。'
          },
          responseTime: {
            average: '3時間',
            target: '24時間以内'
          }
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch availability:', error);
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusText = (status: string) => {
    switch (status) {
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

  const getScheduleStatusColor = (status: string) => {
    switch (status) {
      case 'free':
        return 'bg-secondary-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-calm-300';
    }
  };

  const updateStatus = async (newStatus: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE') => {
    try {
      // TODO: API呼び出し
      if (availability) {
        setAvailability({
          ...availability,
          status: newStatus
        });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading || !availability) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>対応状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-calm-200 rounded w-3/4"></div>
            <div className="h-4 bg-calm-200 rounded-full"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-calm-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const capacityPercentage = (availability.capacity.current / availability.capacity.maximum) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>対応状況</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 現在のステータス */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-calm-900">現在の状況</span>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              getStatusColor(availability.status)
            )}>
              {getStatusText(availability.status)}
            </span>
          </div>
          
          {/* ステータス変更ボタン */}
          <div className="grid grid-cols-3 gap-2">
            {['AVAILABLE', 'BUSY', 'UNAVAILABLE'].map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status as any)}
                className={cn(
                  'p-2 rounded-lg text-xs font-medium transition-colors',
                  availability.status === status
                    ? getStatusColor(status)
                    : 'bg-calm-100 text-calm-600 hover:bg-calm-200'
                )}
              >
                {getStatusText(status)}
              </button>
            ))}
          </div>
        </div>

        {/* キャパシティ */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-calm-900">プロジェクト数</span>
            <span className="text-sm text-calm-600">
              {availability.capacity.current} / {availability.capacity.maximum}
            </span>
          </div>
          <div className="w-full bg-calm-200 rounded-full h-3 mb-2">
            <div 
              className={cn(
                'h-3 rounded-full transition-all duration-300',
                capacityPercentage >= 100 ? 'bg-red-500' :
                capacityPercentage >= 75 ? 'bg-yellow-500' : 'bg-secondary-500'
              )}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-calm-600">
            {availability.capacity.maximum - availability.capacity.current > 0 
              ? `あと${availability.capacity.maximum - availability.capacity.current}件まで対応可能`
              : 'キャパシティ満了'
            }
          </p>
        </div>

        {/* スケジュール */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-calm-900">今週の予定</span>
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showSchedule ? '閉じる' : '詳細'}
            </button>
          </div>
          
          {showSchedule ? (
            <div className="space-y-2">
              {availability.schedule.map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      getScheduleStatusColor(day.status)
                    )}></div>
                    <span className="text-calm-900">
                      {new Date(day.date).toLocaleDateString('ja-JP', { 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </span>
                  </div>
                  <span className="text-calm-600 text-xs">
                    {day.notes || (
                      day.status === 'free' ? '空き' :
                      day.status === 'busy' ? '作業中' : '休み'
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-1">
              {availability.schedule.slice(0, 7).map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-6 h-6 rounded flex-shrink-0',
                    getScheduleStatusColor(day.status)
                  )}
                  title={`${day.date}: ${day.notes || day.status}`}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* 返信時間 */}
        <div>
          <span className="text-sm font-medium text-calm-900 block mb-2">返信時間</span>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-calm-600">平均</span>
              <p className="font-semibold text-calm-900">{availability.responseTime.average}</p>
            </div>
            <div>
              <span className="text-calm-600">目標</span>
              <p className="font-semibold text-calm-900">{availability.responseTime.target}</p>
            </div>
          </div>
        </div>

        {/* 自動返信設定 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-calm-900">自動返信</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={availability.autoResponse.enabled}
                onChange={(e) => {
                  setAvailability({
                    ...availability,
                    autoResponse: {
                      ...availability.autoResponse,
                      enabled: e.target.checked
                    }
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-calm-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-calm-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          {availability.autoResponse.enabled && (
            <div className="text-xs text-calm-600 bg-calm-50 p-2 rounded">
              {availability.autoResponse.message}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-2 pt-4 border-t border-calm-200">
          <Button size="sm" className="flex-1">
            スケジュール管理
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            設定
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
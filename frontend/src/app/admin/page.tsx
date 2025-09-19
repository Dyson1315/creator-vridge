'use client';

import React from 'react';
import MetricCard from '@/components/admin/MetricCard';
import RealtimeChart from '@/components/admin/RealtimeChart';
import SystemMonitor from '@/components/admin/SystemMonitor';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

// モックデータ
const mockChartData = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
  value: Math.floor(Math.random() * 100) + 50,
}));

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* メトリクスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="アクティブユーザー"
          value={2543}
          unit="人"
          trend={{
            type: 'up',
            value: '+12.5%',
            period: '先月比'
          }}
          icon={UsersIcon}
          color="primary"
        />
        
        <MetricCard
          title="新規ユーザー"
          value={127}
          unit="人"
          trend={{
            type: 'up',
            value: '+8.2%',
            period: '先月比'
          }}
          icon={UsersIcon}
          color="secondary"
        />
        
        <MetricCard
          title="月間取引額"
          value="$42.3K"
          trend={{
            type: 'up',
            value: '+15.8%',
            period: '先月比'
          }}
          icon={CurrencyDollarIcon}
          color="success"
        />
        
        <MetricCard
          title="システム稼働率"
          value="99.8%"
          trend={{
            type: 'neutral',
            value: '+0.1%',
            period: '先月比'
          }}
          icon={ServerIcon}
          color="success"
        />
      </div>
      
      {/* リアルタイムチャートとシステム監視 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealtimeChart
          title="APIリクエスト数"
          data={mockChartData}
          color="primary"
          unit="req/h"
        />
        
        <RealtimeChart
          title="アクティブユーザー数"
          data={mockChartData.map(item => ({
            ...item,
            value: Math.floor(item.value * 0.5) + 20
          }))}
          color="secondary"
          unit="人"
        />
      </div>
      
      {/* システム監視 */}
      <SystemMonitor />
    </div>
  );
}
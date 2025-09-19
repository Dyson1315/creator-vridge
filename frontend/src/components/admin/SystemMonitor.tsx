'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  CpuChipIcon,
  CircleStackIcon,
  ServerIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
}

interface SystemStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: string;
  lastCheck: string;
}

// モックデータ
const systemMetrics: SystemMetric[] = [
  {
    name: 'CPU使用率',
    value: 45.2,
    unit: '%',
    status: 'normal',
    threshold: { warning: 70, critical: 90 }
  },
  {
    name: 'メモリ使用率',
    value: 68.5,
    unit: '%',
    status: 'normal',
    threshold: { warning: 80, critical: 95 }
  },
  {
    name: 'ディスク使用率',
    value: 82.1,
    unit: '%',
    status: 'warning',
    threshold: { warning: 80, critical: 95 }
  },
  {
    name: 'API応答時間',
    value: 245,
    unit: 'ms',
    status: 'normal',
    threshold: { warning: 500, critical: 1000 }
  },
];

const systemStatuses: SystemStatus[] = [
  {
    name: 'Webサーバー',
    status: 'online',
    uptime: '15日 4時間',
    lastCheck: '30秒前'
  },
  {
    name: 'APIサーバー',
    status: 'online',
    uptime: '15日 4時間',
    lastCheck: '30秒前'
  },
  {
    name: 'データベース',
    status: 'online',
    uptime: '15日 4時間',
    lastCheck: '30秒前'
  },
  {
    name: 'Redisキャッシュ',
    status: 'degraded',
    uptime: '2日 8時間',
    lastCheck: '1分前'
  },
];

const statusColors = {
  normal: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    ring: 'ring-green-200'
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    ring: 'ring-yellow-200'
  },
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-200'
  },
  online: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: CheckCircleIcon,
    iconColor: 'text-green-500'
  },
  offline: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-red-500'
  },
  degraded: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-500'
  }
};

const metricIcons = {
  'CPU使用率': CpuChipIcon,
  'メモリ使用率': CircleStackIcon,
  'ディスク使用率': ServerIcon,
  'API応答時間': SignalIcon,
};

interface MetricCardProps {
  metric: SystemMetric;
}

function MetricCard({ metric }: MetricCardProps) {
  const IconComponent = metricIcons[metric.name as keyof typeof metricIcons] || ServerIcon;
  const colors = statusColors[metric.status];
  
  // プログレスバーの値計算
  const getProgressValue = () => {
    if (metric.unit === '%') return metric.value;
    if (metric.name === 'API応答時間') {
      return Math.min((metric.value / metric.threshold.critical) * 100, 100);
    }
    return metric.value;
  };
  
  const progressValue = getProgressValue();
  
  return (
    <div className="bg-white border border-calm-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <IconComponent className="h-5 w-5 text-calm-500" />
          <span className="text-sm font-medium text-calm-700">{metric.name}</span>
        </div>
        <span className={cn(
          'px-2 py-1 rounded-lg text-xs font-medium',
          colors.bg,
          colors.text
        )}>
          {metric.status === 'normal' ? '正常' : 
           metric.status === 'warning' ? '警告' : '異常'}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-calm-900">
            {metric.value.toFixed(1)}
          </span>
          <span className="text-sm text-calm-500">{metric.unit}</span>
        </div>
        
        {/* プログレスバー */}
        <div className="w-full bg-calm-200 rounded-full h-2">
          <div 
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              metric.status === 'normal' ? 'bg-green-500' :
              metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${Math.min(progressValue, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-calm-500">
          <span>警告: {metric.threshold.warning}{metric.unit}</span>
          <span>異常: {metric.threshold.critical}{metric.unit}</span>
        </div>
      </div>
    </div>
  );
}

interface StatusCardProps {
  status: SystemStatus;
}

function StatusCard({ status }: StatusCardProps) {
  const colors = statusColors[status.status as keyof typeof statusColors];
  const IconComponent = colors.icon;
  
  return (
    <div className="bg-white border border-calm-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <IconComponent className={cn('h-5 w-5', colors.iconColor)} />
          <span className="font-medium text-calm-900">{status.name}</span>
        </div>
        <span className={cn(
          'px-2 py-1 rounded-lg text-xs font-medium',
          colors.bg,
          colors.text
        )}>
          {status.status === 'online' ? 'オンライン' :
           status.status === 'offline' ? 'オフライン' : '劣化'}
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-calm-600">稼働時間:</span>
          <span className="text-calm-900">{status.uptime}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-calm-600">最終チェック:</span>
          <span className="text-calm-500">{status.lastCheck}</span>
        </div>
      </div>
    </div>
  );
}

export default function SystemMonitor() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // 自動更新のシミュレーション
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // 30秒ごとに更新
    
    return () => clearInterval(interval);
  }, []);
  
  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <div className="space-y-6">
      {/* システムメトリクス */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>システムメトリクス</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-calm-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>最終更新: {formatLastUpdate(lastUpdate)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* システムステータス */}
      <Card>
        <CardHeader>
          <CardTitle>システムステータス</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStatuses.map((status, index) => (
              <StatusCard key={index} status={status} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
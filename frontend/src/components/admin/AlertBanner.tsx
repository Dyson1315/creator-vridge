'use client';

import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type AlertType = 'warning' | 'info' | 'success' | 'error';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  dismissible?: boolean;
}

// モックアラートデータ
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'API応答時間が遅いです',
    message: '過去15分間のAPI応答時間が平均800msで、基準値を上回っています。',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    dismissible: true,
  },
  {
    id: '2',
    type: 'info',
    title: '定期メンテナンスのお知らせ',
    message: '今夜23:00-24:00にシステムメンテナンスを実施します。',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    dismissible: true,
  },
];

const alertStyles = {
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: InformationCircleIcon,
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircleIcon,
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    messageColor: 'text-green-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700',
  },
};

export default function AlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    return timestamp.toLocaleDateString('ja-JP');
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-calm-200">
      {alerts.map((alert) => {
        const style = alertStyles[alert.type];
        const IconComponent = style.icon;
        
        return (
          <div
            key={alert.id}
            className={cn(
              'px-6 py-3 border-l-4',
              style.bg,
              style.border.replace('border-', 'border-l-')
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <IconComponent className={cn('h-5 w-5 mt-0.5', style.iconColor)} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className={cn('text-sm font-medium', style.titleColor)}>
                      {alert.title}
                    </h3>
                    <span className="text-xs text-calm-500">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  </div>
                  <p className={cn('text-sm mt-1', style.messageColor)}>
                    {alert.message}
                  </p>
                </div>
              </div>
              
              {alert.dismissible && (
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className={cn(
                    'ml-4 p-1 rounded-lg hover:bg-white/50 transition-colors',
                    style.iconColor
                  )}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
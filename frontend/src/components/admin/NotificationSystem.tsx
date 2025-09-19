'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type NotificationType = 'alert' | 'info' | 'success' | 'warning';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface Notification {
  id: string;
  type: NotificationType;
  priority: Priority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionRequired?: boolean;
  source: string;
}

// モック通知データ
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    priority: 'critical',
    title: '不正ログインの検出',
    message: 'IPアドレス 192.168.1.100からの異常なログイン試行が検出されました。',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    actionRequired: true,
    source: 'セキュリティシステム'
  },
  {
    id: '2',
    type: 'warning',
    priority: 'high',
    title: 'API応答時間の遅延',
    message: '過去30分間のAPI応答時間が平均800msで、基準値を上回っています。',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionRequired: false,
    source: '監視システム'
  },
  {
    id: '3',
    type: 'info',
    priority: 'medium',
    title: '新しいユーザー登録',
    message: '本日は127人の新規ユーザーが登録しました。',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    actionRequired: false,
    source: 'ユーザー管理'
  },
  {
    id: '4',
    type: 'success',
    priority: 'low',
    title: 'バックアップ完了',
    message: '定期バックアップが正常に完了しました。',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
    actionRequired: false,
    source: 'バックアップシステム'
  },
];

const typeStyles = {
  alert: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-red-500',
    titleColor: 'text-red-900'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-900'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: InformationCircleIcon,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircleIcon,
    iconColor: 'text-green-500',
    titleColor: 'text-green-900'
  }
};

const priorityStyles = {
  critical: 'border-l-4 border-l-red-600',
  high: 'border-l-4 border-l-orange-500',
  medium: 'border-l-4 border-l-yellow-500',
  low: 'border-l-4 border-l-blue-500'
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead, onDismiss }: NotificationItemProps) {
  const style = typeStyles[notification.type];
  const IconComponent = style.icon;
  
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    return timestamp.toLocaleDateString('ja-JP');
  };
  
  return (
    <div className={cn(
      'p-4 rounded-lg border transition-all duration-200',
      style.bg,
      style.border,
      priorityStyles[notification.priority],
      !notification.read && 'shadow-md',
      notification.read && 'opacity-75'
    )}>
      <div className="flex items-start space-x-3">
        <IconComponent className={cn('h-5 w-5 mt-0.5', style.iconColor)} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className={cn('text-sm font-medium', style.titleColor)}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
                {notification.actionRequired && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    アクション必要
                  </span>
                )}
              </div>
              
              <p className="text-sm text-calm-700 mt-1">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4 text-xs text-calm-500">
                  <span>{notification.source}</span>
                  <span>{formatTimestamp(notification.timestamp)}</span>
                  <span className="capitalize">
                    {notification.priority === 'critical' ? '緊急' :
                     notification.priority === 'high' ? '高' :
                     notification.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onMarkRead(notification.id)}
                      className="text-xs"
                    >
                      既読にする
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDismiss(notification.id)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  
  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };
  
  const handleDismiss = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionRequired':
        return notification.actionRequired;
      default:
        return true;
    }
  });
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired).length;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5" />
              <span>通知センター</span>
            </CardTitle>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                {unreadCount}件の未読
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <CogIcon className="h-4 w-4" />
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                全て既読にする
              </Button>
            )}
          </div>
        </div>
        
        {/* フィルター */}
        <div className="flex space-x-2 mt-4">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            すべて ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            未読 ({unreadCount})
          </Button>
          <Button
            variant={filter === 'actionRequired' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('actionRequired')}
          >
            アクション必要 ({actionRequiredCount})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss}
              />
            ))
          ) : (
            <div className="text-center py-8 text-calm-500">
              <BellIcon className="h-12 w-12 mx-auto mb-3 text-calm-300" />
              <p>表示する通知がありません</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
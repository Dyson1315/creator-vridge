'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  UsersIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CogIcon,
  ChartPieIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AdminSidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'ダッシュボード概要',
    href: '/admin',
    icon: ChartBarIcon,
    current: false,
  },
  {
    name: 'ユーザー管理',
    href: '/admin/users',
    icon: UsersIcon,
    current: false,
  },
  {
    name: '取引監視',
    href: '/admin/transactions',
    icon: CreditCardIcon,
    current: false,
  },
  {
    name: 'コンテンツ管理',
    href: '/admin/content',
    icon: DocumentTextIcon,
    current: false,
  },
  {
    name: 'システム監視',
    href: '/admin/system',
    icon: ShieldCheckIcon,
    current: false,
  },
  {
    name: 'レポート',
    href: '/admin/reports',
    icon: ChartPieIcon,
    current: false,
  },
  {
    name: 'アラート管理',
    href: '/admin/alerts',
    icon: ExclamationTriangleIcon,
    current: false,
  },
  {
    name: '設定',
    href: '/admin/settings',
    icon: CogIcon,
    current: false,
  },
];

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn('flex flex-col w-64 bg-white border-r border-calm-200', className)}>
      {/* サイドバーヘッダー */}
      <div className="flex items-center h-16 px-6 border-b border-calm-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-calm-900">管理者</h2>
            <p className="text-xs text-calm-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'text-calm-600 hover:bg-calm-50 hover:text-calm-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 transition-colors',
                  isActive ? 'text-primary-500' : 'text-calm-400 group-hover:text-calm-500'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* サイドバーフッター */}
      <div className="p-4 border-t border-calm-200">
        <div className="flex items-center space-x-3 p-3 bg-calm-50 rounded-xl">
          <div className="w-2 h-2 bg-secondary-400 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <p className="text-xs font-medium text-calm-900">システム稼働中</p>
            <p className="text-xs text-calm-500">99.8% 稼働率</p>
          </div>
        </div>
      </div>
    </div>
  );
}
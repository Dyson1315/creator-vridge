'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';

// パス名からページタイトルを取得
const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/admin': 'ダッシュボード概要',
    '/admin/users': 'ユーザー管理',
    '/admin/transactions': '取引監視',
    '/admin/content': 'コンテンツ管理',
    '/admin/system': 'システム監視',
    '/admin/reports': 'レポート',
    '/admin/alerts': 'アラート管理',
    '/admin/settings': '設定',
  };
  
  return routes[pathname] || '管理者ダッシュボード';
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="bg-white border-b border-calm-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* ページタイトル */}
        <div>
          <h1 className="text-2xl font-bold text-calm-900">{pageTitle}</h1>
          <p className="text-sm text-calm-500 mt-1">
            リアルタイムデータとシステムの状態を監視しています
          </p>
        </div>
        
        {/* 右上操作エリア */}
        <div className="flex items-center space-x-4">
          {/* 検索 */}
          <div className="relative hidden lg:block">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-calm-400" />
            <input
              type="text"
              placeholder="検索..."
              className="pl-10 pr-4 py-2 w-64 text-sm border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          
          {/* 通知 */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <BellIcon className="h-5 w-5" />
              {/* 未読通知バッジ */}
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">3</span>
              </span>
            </Button>
          </div>
          
          {/* ユーザー情報 */}
          <div className="flex items-center space-x-3 pl-4 border-l border-calm-200">
            <div className="text-right">
              <p className="text-sm font-medium text-calm-900">
                {user?.profile?.displayName || '管理者'}
              </p>
              <p className="text-xs text-calm-500">システム管理者</p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {(user?.profile?.displayName || 'A').charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
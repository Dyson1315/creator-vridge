'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  userType: 'VTUBER' | 'ARTIST';
}

export default function DashboardHeader({ onMenuClick, userType }: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-calm-200 lg:pl-0">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* モバイルメニューボタン */}
        <button
          type="button"
          className="lg:hidden -m-2.5 p-2.5 text-calm-700"
          onClick={onMenuClick}
        >
          <span className="sr-only">メニューを開く</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* ページタイトル（モバイル） */}
        <div className="lg:hidden">
          <h1 className="text-lg font-semibold text-calm-900">
            ダッシュボード
          </h1>
        </div>

        {/* 右側のアクション */}
        <div className="flex items-center gap-x-4">
          {/* 通知ボタン */}
          <button
            type="button"
            className="relative -m-2.5 p-2.5 text-calm-400 hover:text-calm-500"
          >
            <span className="sr-only">通知を表示</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {/* 通知バッジ */}
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary-400 text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* ユーザーメニュー */}
          <div className="relative">
            <button
              type="button"
              className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <span className="sr-only">ユーザーメニューを開く</span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {user?.profile?.displayName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>

            {/* ユーザーメニュードロップダウン */}
            {isUserMenuOpen && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-2xl bg-white py-2 shadow-soft ring-1 ring-calm-200 focus:outline-none">
                <div className="px-4 py-3 border-b border-calm-200">
                  <p className="text-sm font-medium text-calm-900">
                    {user?.profile?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-calm-500">
                    {userType === 'VTUBER' ? 'VTuber' : '絵師'} アカウント
                  </p>
                </div>
                
                <a
                  href="/dashboard/shared/profile"
                  className="block px-4 py-2 text-sm text-calm-700 hover:bg-calm-50 transition-colors"
                >
                  プロフィール
                </a>
                <a
                  href="/dashboard/shared/settings"
                  className="block px-4 py-2 text-sm text-calm-700 hover:bg-calm-50 transition-colors"
                >
                  設定
                </a>
                <div className="border-t border-calm-200 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-calm-700 hover:bg-calm-50 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ユーザーメニューが開いている時のオーバーレイ */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
}
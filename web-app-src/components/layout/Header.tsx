'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

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
    <header className="bg-white border-b border-calm-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="text-xl font-bold text-primary-400">
              CreatorVridge
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-calm-600 hover:text-primary-400 transition-colors"
                >
                  ダッシュボード
                </Link>
                <Link
                  href="/matches"
                  className="text-calm-600 hover:text-primary-400 transition-colors"
                >
                  マッチング
                </Link>
                <Link
                  href="/profile"
                  className="text-calm-600 hover:text-primary-400 transition-colors"
                >
                  プロフィール
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  className="text-calm-600 hover:text-primary-400 transition-colors"
                >
                  CreatorVridgeとは
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-calm-600 hover:text-primary-400 transition-colors"
                >
                  使い方
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-calm-600">
                  <span className="font-medium">{user?.profile?.displayName || user?.email}</span>
                  <div className="text-xs">
                    {user?.userType === 'VTUBER' ? 'VTuber' : '絵師'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  ログアウト
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/auth/login')}
                >
                  ログイン
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/auth/register')}
                >
                  新規登録
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
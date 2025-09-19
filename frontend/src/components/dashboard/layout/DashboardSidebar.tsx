'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface DashboardSidebarProps {
  userType: 'VTUBER' | 'ARTIST';
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ userType, isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  // VTuber用ナビゲーション
  const vtuberNavigation: SidebarItem[] = [
    {
      name: 'ダッシュボード',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      name: 'マッチング',
      href: '/dashboard/vtuber/matching',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      badge: 'new',
    },
    {
      name: 'プロジェクト',
      href: '/dashboard/vtuber/projects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: '収益管理',
      href: '/dashboard/vtuber/earnings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
  ];

  // 絵師用ナビゲーション
  const artistNavigation: SidebarItem[] = [
    {
      name: 'ダッシュボード',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      name: '依頼一覧',
      href: '/dashboard/artist/requests',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      badge: '3',
    },
    {
      name: 'ポートフォリオ',
      href: '/dashboard/artist/portfolio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: '収益管理',
      href: '/dashboard/artist/earnings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
  ];

  // 共通ナビゲーション
  const commonNavigation: SidebarItem[] = [
    {
      name: 'メッセージ',
      href: '/dashboard/shared/messages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: '2',
    },
    {
      name: 'プロフィール',
      href: '/dashboard/shared/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: '設定',
      href: '/dashboard/shared/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const navigation = userType === 'VTUBER' ? vtuberNavigation : artistNavigation;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* デスクトップサイドバー */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-calm-200 px-6 pb-4">
          {/* ロゴ */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <span className="text-lg font-bold text-primary-400">
                CreatorVridge
              </span>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              {/* メインナビゲーション */}
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-calm-700 hover:text-primary-600 hover:bg-calm-50'
                        )}
                      >
                        <span className={cn(
                          'flex-shrink-0',
                          isActive(item.href) ? 'text-primary-600' : 'text-calm-400 group-hover:text-primary-600'
                        )}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            'ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                            item.badge === 'new' 
                              ? 'bg-secondary-100 text-secondary-800'
                              : 'bg-primary-100 text-primary-800'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* 共通ナビゲーション */}
              <li>
                <div className="text-xs font-semibold leading-6 text-calm-400 mb-2">
                  共通機能
                </div>
                <ul role="list" className="-mx-2 space-y-1">
                  {commonNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-calm-700 hover:text-primary-600 hover:bg-calm-50'
                        )}
                      >
                        <span className={cn(
                          'flex-shrink-0',
                          isActive(item.href) ? 'text-primary-600' : 'text-calm-400 group-hover:text-primary-600'
                        )}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* モバイルサイドバー */}
      <div className={cn(
        'fixed inset-y-0 z-50 flex w-64 flex-col transition-transform lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-calm-200 px-6 pb-4">
          {/* モバイル用ヘッダー */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <span className="text-lg font-bold text-primary-400">
                CreatorVridge
              </span>
            </Link>
            <button
              onClick={onClose}
              className="text-calm-400 hover:text-calm-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* モバイル用ナビゲーション（デスクトップと同じ構造） */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-calm-700 hover:text-primary-600 hover:bg-calm-50'
                        )}
                      >
                        <span className={cn(
                          'flex-shrink-0',
                          isActive(item.href) ? 'text-primary-600' : 'text-calm-400 group-hover:text-primary-600'
                        )}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            'ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                            item.badge === 'new' 
                              ? 'bg-secondary-100 text-secondary-800'
                              : 'bg-primary-100 text-primary-800'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li>
                <div className="text-xs font-semibold leading-6 text-calm-400 mb-2">
                  共通機能
                </div>
                <ul role="list" className="-mx-2 space-y-1">
                  {commonNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-calm-700 hover:text-primary-600 hover:bg-calm-50'
                        )}
                      >
                        <span className={cn(
                          'flex-shrink-0',
                          isActive(item.href) ? 'text-primary-600' : 'text-calm-400 group-hover:text-primary-600'
                        )}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
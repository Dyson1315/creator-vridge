'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AlertBanner from './AlertBanner';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function AdminLayout({ children, className }: AdminLayoutProps) {
  return (
    <div className="h-screen flex bg-calm-50">
      {/* サイドバー */}
      <AdminSidebar />
      
      {/* メインコンテント */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <AdminHeader />
        
        {/* アラートバナー */}
        <AlertBanner />
        
        {/* メインコンテンツ */}
        <main className={cn('flex-1 overflow-auto p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
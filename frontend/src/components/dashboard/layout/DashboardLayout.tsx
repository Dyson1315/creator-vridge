'use client';

import React, { useState } from 'react';
import { User } from '@/lib/api';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'VTUBER' | 'ARTIST';
}

export default function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-calm-50">
      {/* モバイル用サイドバーオーバーレイ */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <DashboardSidebar 
        userType={userType} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* メインコンテンツエリア */}
      <div className="lg:pl-64">
        {/* ヘッダー */}
        <DashboardHeader 
          onMenuClick={() => setSidebarOpen(true)}
          userType={userType}
        />

        {/* メインコンテンツ */}
        <main className="min-h-screen pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
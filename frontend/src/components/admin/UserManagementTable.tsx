'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type UserType = 'VTUBER' | 'ARTIST';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
type AuthLevel = 'BASIC' | 'ADVANCED' | 'EXPERT';

interface User {
  id: string;
  email: string;
  displayName: string;
  userType: UserType;
  status: UserStatus;
  authLevel?: AuthLevel;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  transactionCount: number;
  totalEarnings: number;
}

// モックデータ
const mockUsers: User[] = [
  {
    id: '1',
    email: 'artist1@example.com',
    displayName: '田中絵師',
    userType: 'ARTIST',
    status: 'ACTIVE',
    authLevel: 'ADVANCED',
    createdAt: '2024-01-15',
    lastLoginAt: '2024-02-20',
    transactionCount: 15,
    totalEarnings: 2500,
  },
  {
    id: '2',
    email: 'vtuber1@example.com',
    displayName: '佐藤VTuber',
    userType: 'VTUBER',
    status: 'SUSPENDED',
    createdAt: '2024-02-01',
    lastLoginAt: '2024-02-18',
    transactionCount: 3,
    totalEarnings: 450,
  },
  {
    id: '3',
    email: 'artist2@example.com',
    displayName: '高橋アート',
    userType: 'ARTIST',
    status: 'ACTIVE',
    authLevel: 'EXPERT',
    createdAt: '2023-12-10',
    lastLoginAt: '2024-02-21',
    transactionCount: 42,
    totalEarnings: 8900,
  },
];

const statusStyles = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
};

const statusLabels = {
  ACTIVE: 'アクティブ',
  SUSPENDED: '停止中',
  PENDING: '承認待ち',
};

const authLevelLabels = {
  BASIC: 'ベーシック',
  ADVANCED: 'アドバンス',
  EXPERT: 'エキスパート',
};

export default function UserManagementTable() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<UserType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // フィルタリングロジック
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || user.userType === filterType;
    const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // ページネーション
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleStatusToggle = (userId: string) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
        };
      }
      return user;
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ユーザー管理</CardTitle>
        
        {/* 検索・フィルター */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-calm-400" />
            <input
              type="text"
              placeholder="名前またはメールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-sm border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as UserType | 'ALL')}
              className="px-3 py-2 text-sm border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="ALL">すべてのタイプ</option>
              <option value="VTUBER">VTuber</option>
              <option value="ARTIST">絵師</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'ALL')}
              className="px-3 py-2 text-sm border border-calm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="ALL">すべてのステータス</option>
              <option value="ACTIVE">アクティブ</option>
              <option value="SUSPENDED">停止中</option>
              <option value="PENDING">承認待ち</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* テーブル */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-calm-200">
                <th className="text-left py-3 px-4 font-medium text-calm-600">ユーザー</th>
                <th className="text-left py-3 px-4 font-medium text-calm-600">タイプ</th>
                <th className="text-left py-3 px-4 font-medium text-calm-600">認証レベル</th>
                <th className="text-left py-3 px-4 font-medium text-calm-600">ステータス</th>
                <th className="text-left py-3 px-4 font-medium text-calm-600">取引数</th>
                <th className="text-left py-3 px-4 font-medium text-calm-600">総売上</th>
                <th className="text-left py-3 px-4 font-medium text-calm-600">最終ログイン</th>
                <th className="text-left py-3 px-4 font-medium text-calm-600">アクション</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-calm-100 hover:bg-calm-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.displayName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-calm-900">{user.displayName}</div>
                        <div className="text-sm text-calm-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-calm-600">
                      {user.userType === 'VTUBER' ? 'VTuber' : '絵師'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {user.authLevel ? (
                      <span className="text-sm text-calm-600">
                        {authLevelLabels[user.authLevel]}
                      </span>
                    ) : (
                      <span className="text-sm text-calm-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      statusStyles[user.status]
                    )}>
                      {statusLabels[user.status]}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-calm-600">
                    {user.transactionCount}件
                  </td>
                  <td className="py-4 px-4 text-sm text-calm-600">
                    ${user.totalEarnings.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-calm-500">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : '未ログイン'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStatusToggle(user.id)}
                        className={user.status === 'SUSPENDED' ? 'text-green-600' : 'text-red-600'}
                      >
                        {user.status === 'SUSPENDED' ? (
                          <PlayIcon className="h-4 w-4" />
                        ) : (
                          <PauseIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-calm-600">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} / {filteredUsers.length}件
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8"
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
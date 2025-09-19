'use client';

import { useAuthStore } from '@/store/auth';
import VTuberDashboard from '@/components/dashboard/vtuber/VTuberDashboard';
import ArtistDashboard from '@/components/dashboard/artist/ArtistDashboard';

export default function Dashboard() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-calm-600">読み込み中...</div>
      </div>
    );
  }

  // ユーザータイプに応じてダッシュボードを切り替え
  if (user.userType === 'VTUBER') {
    return <VTuberDashboard />;
  } else if (user.userType === 'ARTIST') {
    return <ArtistDashboard />;
  }

  return (
    <div className="text-center py-8">
      <h1 className="text-2xl font-bold text-calm-900 mb-4">
        CreatorVridge ダッシュボード
      </h1>
      <p className="text-calm-600">
        ユーザータイプが設定されていません。プロフィールを確認してください。
      </p>
    </div>
  );
}
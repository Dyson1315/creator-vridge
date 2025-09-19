'use client';

import StatCard from '@/components/dashboard/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function VTuberDashboard() {
  return (
    <div className="space-y-6">
      {/* ウェルカムセクション */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-calm-900 mb-2">
          おかえりなさい！
        </h1>
        <p className="text-calm-600">
          理想の絵師との出会いが、あなたの創作活動を次のレベルへ導きます
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="進行中プロジェクト"
          value="3"
          subtitle="2件が今週完成予定"
          trend={{ value: 15, isPositive: true }}
          icon={<span className="text-lg">🎨</span>}
        />
        <StatCard
          title="新着マッチング"
          value="7"
          subtitle="AI適合度80%以上"
          icon={<span className="text-lg">✨</span>}
        />
        <StatCard
          title="今月の支出"
          value="¥48,500"
          subtitle="予算内です"
          trend={{ value: -8, isPositive: false }}
          icon={<span className="text-lg">💰</span>}
        />
        <StatCard
          title="完了プロジェクト"
          value="12"
          subtitle="満足度平均4.8★"
          trend={{ value: 25, isPositive: true }}
          icon={<span className="text-lg">🏆</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* マッチング提案 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">🤝</span>
              おすすめマッチング
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">A{i}</span>
                  </div>
                  <div>
                    <div className="font-medium">アーティスト{i}</div>
                    <div className="text-sm text-calm-600">適合度: 95%</div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  詳細
                </Button>
              </div>
            ))}
            <Button className="w-full mt-4">
              もっと見る
            </Button>
          </CardContent>
        </Card>

        {/* プロジェクト進捗 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              プロジェクト進捗
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Vtuberアバター制作', phase: '線画', progress: 60 },
              { name: 'ロゴデザイン', phase: '着色', progress: 80 },
              { name: 'サムネイル', phase: 'ラフ', progress: 30 },
            ].map((project, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{project.name}</span>
                  <span className="text-sm text-calm-600">{project.phase}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-400 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="text-xs text-calm-500 text-right">
                  {project.progress}% 完成
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            クイックアクション
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 flex flex-col items-center gap-1">
              <span className="text-lg">🔍</span>
              絵師を探す
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
              <span className="text-lg">💬</span>
              メッセージ
            </Button>
            <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
              <span className="text-lg">📊</span>
              レポート
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
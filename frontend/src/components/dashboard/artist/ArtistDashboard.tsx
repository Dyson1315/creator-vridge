'use client';

import StatCard from '@/components/dashboard/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ArtistDashboard() {
  return (
    <div className="space-y-6">
      {/* ウェルカムセクション */}
      <div className="bg-gradient-to-r from-secondary-50 to-primary-50 p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-calm-900 mb-2">
          創作活動お疲れさまです！
        </h1>
        <p className="text-calm-600">
          あなたの才能で多くのVTuberの夢を実現しましょう
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="新着依頼"
          value="5"
          subtitle="今週: 3件が緊急依頼"
          icon={<span className="text-lg">📥</span>}
        />
        <StatCard
          title="進行中案件"
          value="4"
          subtitle="平均進捗率: 75%"
          trend={{ value: 12, isPositive: true }}
          icon={<span className="text-lg">🎨</span>}
        />
        <StatCard
          title="今月の収益"
          value="¥152,800"
          subtitle="先月より好調"
          trend={{ value: 23, isPositive: true }}
          icon={<span className="text-lg">💰</span>}
        />
        <StatCard
          title="評価スコア"
          value="4.9"
          subtitle="レビュー89件"
          icon={<span className="text-lg">⭐</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 新着依頼 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              新着依頼
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'VTuberアバター立ち絵', budget: '¥35,000', deadline: '7日後', priority: 'high' },
              { title: 'ロゴデザイン', budget: '¥18,000', deadline: '10日後', priority: 'medium' },
              { title: 'エモート8種類', budget: '¥24,000', deadline: '14日後', priority: 'low' },
            ].map((request, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{request.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    request.priority === 'high' ? 'bg-red-100 text-red-700' :
                    request.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {request.priority === 'high' ? '緊急' : 
                     request.priority === 'medium' ? '通常' : '余裕'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-calm-600">
                  <span>{request.budget}</span>
                  <span>{request.deadline}</span>
                </div>
                <Button size="sm" className="w-full mt-2">
                  詳細を見る
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              すべての依頼を見る
            </Button>
          </CardContent>
        </Card>

        {/* ポートフォリオ統計 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">🖼️</span>
              ポートフォリオ統計
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-calm-900">42</div>
                <div className="text-sm text-calm-600">作品数</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-calm-900">1.2K</div>
                <div className="text-sm text-calm-600">総閲覧数</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">人気カテゴリ</h5>
              {[
                { category: 'VTuberアバター', count: 18, percentage: 43 },
                { category: 'ロゴデザイン', count: 12, percentage: 29 },
                { category: 'イラスト', count: 8, percentage: 19 },
                { category: 'その他', count: 4, percentage: 9 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-400 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-calm-600 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 対応状況とクイックアクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              対応状況
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium text-green-800">対応可能</div>
                <div className="text-sm text-green-600">新規案件を受け付けています</div>
              </div>
              <Button size="sm" variant="outline">
                変更
              </Button>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">今後のスケジュール</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>今週</span>
                  <span className="text-yellow-600">80% 稼働</span>
                </div>
                <div className="flex justify-between">
                  <span>来週</span>
                  <span className="text-green-600">40% 稼働</span>
                </div>
                <div className="flex justify-between">
                  <span>再来週</span>
                  <span className="text-green-600">20% 稼働</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              クイックアクション
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-16 flex flex-col items-center gap-1">
                <span className="text-lg">📤</span>
                作品アップロード
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                <span className="text-lg">💬</span>
                メッセージ
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                <span className="text-lg">📊</span>
                売上レポート
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center gap-1">
                <span className="text-lg">⚙️</span>
                設定
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
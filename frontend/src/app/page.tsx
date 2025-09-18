'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-calm-900 mb-6">
              VTuber×絵師の
              <br />
              <span className="text-primary-400">理想のマッチング</span>
            </h1>
            <p className="text-lg md:text-xl text-calm-600 mb-8 max-w-3xl mx-auto">
              CreatorVridgeは、VTuberと絵師をマッチングする特化型プラットフォームです。
              <br />
              安全で信頼性の高い環境で、理想の創造的コラボレーションを実現しましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push('/auth/register')}
                className="text-lg px-8 py-4"
              >
                無料で始める
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/how-it-works')}
                className="text-lg px-8 py-4"
              >
                使い方を見る
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-calm-900 mb-4">
              なぜCreatorVridgeなのか
            </h2>
            <p className="text-lg text-calm-600">
              両者の不安を解消し、安心してマッチングできる仕組み
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card hover className="text-center animate-slide-up">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🤖</div>
                <CardTitle className="mb-3">AI画像分析</CardTitle>
                <p className="text-calm-600">
                  高精度なAI画像分析により、絵柄や色調を自動で判定。
                  理想のアーティストを効率的に見つけられます。
                </p>
              </CardContent>
            </Card>

            <Card hover className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🔒</div>
                <CardTitle className="mb-3">安全な取引</CardTitle>
                <p className="text-calm-600">
                  エスクロー決済システムにより、代金の安全性を確保。
                  段階的な情報開示で匿名性も保護します。
                </p>
              </CardContent>
            </Card>

            <Card hover className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">💬</div>
                <CardTitle className="mb-3">コミュニケーション支援</CardTitle>
                <p className="text-calm-600">
                  AI攻撃的表現検出や言い換え提案機能で、
                  円滑なコミュニケーションをサポートします。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-calm-900 mb-4">
              簡単3ステップ
            </h2>
            <p className="text-lg text-calm-600">
              初心者でも安心して利用できるシンプルな流れ
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-400 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-calm-900 mb-3">
                プロフィール作成
              </h3>
              <p className="text-calm-600">
                あなたのスキルや希望条件を登録。
                ポートフォリオをアップロードして魅力をアピール。
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-400 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-calm-900 mb-3">
                AIマッチング
              </h3>
              <p className="text-calm-600">
                AIが最適な相手を提案。
                価格帯やスケジュールも考慮した精度の高いマッチング。
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-400 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-calm-900 mb-3">
                安全な取引
              </h3>
              <p className="text-calm-600">
                エスクロー決済で安心取引。
                進捗管理機能で品質の高い制作をサポート。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-calm-900 mb-6">
            今すぐCreatorVridgeを始めよう
          </h2>
          <p className="text-lg text-calm-600 mb-8">
            理想のパートナーとの出会いが、あなたの創作活動を次のレベルへ導きます
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth/register?type=vtuber')}
              className="text-lg px-8 py-4"
            >
              VTuberとして参加
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/auth/register?type=artist')}
              className="text-lg px-8 py-4"
            >
              絵師として参加
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
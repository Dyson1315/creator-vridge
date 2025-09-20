'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <CardTitle className="text-2xl text-red-600">
              ダッシュボードでエラーが発生しました
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-calm-600">
              ダッシュボードの読み込み中に問題が発生しました。
              <br />
              データの取得に失敗したか、一時的な問題の可能性があります。
            </p>

            <div className="space-y-4">
              <Button onClick={reset} size="lg">
                ダッシュボードを再読み込み
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                >
                  ホームページに戻る
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/auth/logout'}
                >
                  ログアウト
                </Button>
              </div>
            </div>

            {/* 開発環境でのエラー詳細 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-gray-50 p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-calm-700 mb-2">
                  エラー詳細 (開発環境)
                </summary>
                <pre className="text-xs text-red-600 overflow-auto whitespace-pre-wrap">
                  {error.message}
                  {error.stack && (
                    <>
                      <br />
                      <br />
                      Stack trace:
                      <br />
                      {error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>ヒント:</strong> ネットワーク接続を確認するか、
                しばらく時間をおいてから再度お試しください。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
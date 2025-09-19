'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* エラーアイコン */}
        <div className="mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-lg font-medium text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            エラーが発生しました
          </div>
        </div>

        {/* エラーメッセージ */}
        <h1 className="text-2xl md:text-3xl font-bold text-calm-900 mb-4">
          申し訳ございません
        </h1>
        
        <p className="text-calm-600 mb-8 leading-relaxed">
          予期しないエラーが発生しました。
          <br />
          しばらく時間をおいてから再度お試しください。
        </p>

        {/* アクションボタン */}
        <div className="space-y-4">
          <Button 
            onClick={reset}
            size="lg" 
            className="w-full sm:w-auto"
          >
            再試行
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={() => window.location.href = '/'}
            >
              ホームページに戻る
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </Button>
          </div>
        </div>

        {/* エラー詳細（開発環境のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 p-4 bg-white/50 rounded-lg text-left">
            <summary className="cursor-pointer text-sm font-medium text-calm-700 mb-2">
              エラー詳細 (開発環境)
            </summary>
            <pre className="text-xs text-red-600 overflow-auto">
              {error.message}
              {error.digest && (
                <>
                  <br />
                  <br />
                  Digest: {error.digest}
                </>
              )}
            </pre>
          </details>
        )}

        {/* 追加情報 */}
        <div className="mt-8 p-4 bg-white/50 rounded-lg">
          <p className="text-sm text-calm-500">
            問題が継続する場合は、お手数ですがサポートまでお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404アイコン */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-primary-200 mb-4">404</div>
          <div className="text-4xl mb-4">🔍</div>
        </div>

        {/* エラーメッセージ */}
        <h1 className="text-2xl md:text-3xl font-bold text-calm-900 mb-4">
          ページが見つかりません
        </h1>
        
        <p className="text-calm-600 mb-8 leading-relaxed">
          お探しのページは存在しないか、移動または削除された可能性があります。
          <br />
          URLを確認するか、ホームページから再度アクセスしてください。
        </p>

        {/* アクションボタン */}
        <div className="space-y-4">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              ホームページに戻る
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                ログイン
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                新規登録
              </Button>
            </Link>
          </div>
        </div>

        {/* 追加情報 */}
        <div className="mt-12 p-4 bg-white/50 rounded-lg">
          <p className="text-sm text-calm-500">
            問題が解決しない場合は、お手数ですがサポートまでお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
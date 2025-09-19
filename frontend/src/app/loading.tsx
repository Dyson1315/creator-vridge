export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <div className="text-center">
        {/* ローディングスピナー */}
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-400 border-r-transparent mb-4"></div>
        
        {/* ローディングメッセージ */}
        <h2 className="text-lg font-medium text-calm-900 mb-2">
          読み込み中...
        </h2>
        
        <p className="text-sm text-calm-600">
          しばらくお待ちください
        </p>
      </div>
    </div>
  );
}
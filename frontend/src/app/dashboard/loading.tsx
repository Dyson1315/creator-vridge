export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* ウェルカムセクション スケルトン */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-lg animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>

        {/* 統計カード スケルトン */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
              </div>
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-full"></div>
            </div>
          ))}
        </div>

        {/* メインコンテンツ スケルトン */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
              <div className="p-6 border-b">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-gray-300 rounded"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* クイックアクション スケルトン */}
        <div className="bg-white rounded-lg shadow-sm border animate-pulse">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-gray-300 rounded"></div>
              <div className="h-6 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
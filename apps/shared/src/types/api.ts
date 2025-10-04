// API共通型定義
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API エンドポイント定義
export interface ApiEndpoints {
  // 認証
  auth: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
  };
  // ユーザー
  users: {
    profile: string;
    update: string;
  };
  // 作品
  artworks: {
    list: string;
    detail: string;
    upload: string;
  };
  // 推薦
  recommendations: {
    get: string;
    feedback: string;
  };
}
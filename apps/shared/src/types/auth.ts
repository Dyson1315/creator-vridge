// 認証関連型定義
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    userType: 'VTUBER' | 'ARTIST';
    profile?: {
      displayName: string;
      avatarUrl?: string;
    };
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  userType: 'VTUBER' | 'ARTIST';
  displayName: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  userType: string;
  iat: number;
  exp: number;
}
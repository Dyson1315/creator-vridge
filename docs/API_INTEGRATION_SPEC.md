# API連携仕様書

## 概要

VRidge Creator ダッシュボードにおけるバックエンドAPI連携の詳細仕様です。データフェッチング、状態管理、エラーハンドリングの標準化を目的とします。

## APIクライアント設定

### 基本設定

```typescript
// lib/api.ts
import { create } from 'zustand';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

const API_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new ApiError(response.status, response.statusText);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ApiError(500, error.message);
    }
    
    return new ApiError(500, 'Unknown error occurred');
  }
}

export const apiClient = new ApiClient(API_CONFIG);
```

### エラーハンドリング

```typescript
// types/api.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## ダッシュボードAPI仕様

### 統計情報API

```typescript
// hooks/useDashboardStats.ts
interface DashboardStats {
  activeProjects: number;
  totalMessages: number;
  matchingScore: number;
  earnings: number;
  trends: {
    projects: { value: number; change: number };
    messages: { value: number; change: number };
    matches: { value: number; change: number };
    earnings: { value: number; change: number };
  };
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await apiClient.request<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5分
    refetchOnWindowFocus: false,
  });
};

// APIエンドポイント: GET /api/dashboard/stats
// レスポンス例:
{
  "data": {
    "activeProjects": 12,
    "totalMessages": 45,
    "matchingScore": 85,
    "earnings": 125000,
    "trends": {
      "projects": { "value": 12, "change": 8.2 },
      "messages": { "value": 45, "change": -5.1 },
      "matches": { "value": 23, "change": 12.7 },
      "earnings": { "value": 125000, "change": 15.3 }
    }
  }
}
```

### プロジェクトAPI

```typescript
// hooks/useProjects.ts
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  deadline: string;
  budget: {
    amount: number;
    currency: string;
  };
  collaborator?: {
    id: string;
    name: string;
    avatar: string;
    role: 'vtuber' | 'artist';
  };
  progress: number;
  lastActivity: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const useProjects = (params?: {
  status?: string;
  limit?: number;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async (): Promise<PaginatedResponse<Project>> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.page) searchParams.append('page', params.page.toString());
      
      const response = await apiClient.request<PaginatedResponse<Project>>(
        `/projects?${searchParams.toString()}`
      );
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2分
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.request<ApiResponse<Project>>('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
};

// APIエンドポイント: GET /api/projects
// クエリパラメータ: status, limit, page, search
// レスポンス例:
{
  "data": [
    {
      "id": "proj_123",
      "title": "新作Live2Dモデル制作",
      "description": "配信用の新しいLive2Dモデルの制作依頼",
      "status": "active",
      "deadline": "2024-12-15T23:59:59Z",
      "budget": {
        "amount": 50000,
        "currency": "JPY"
      },
      "collaborator": {
        "id": "user_456",
        "name": "山田太郎",
        "avatar": "https://example.com/avatar.jpg",
        "role": "artist"
      },
      "progress": 35,
      "lastActivity": "2024-11-15T10:30:00Z",
      "priority": "high",
      "tags": ["Live2D", "モデル制作", "配信"],
      "createdAt": "2024-11-01T09:00:00Z",
      "updatedAt": "2024-11-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### メッセージAPI

```typescript
// hooks/useMessages.ts
interface Message {
  id: string;
  threadId: string;
  from: {
    id: string;
    name: string;
    avatar: string;
    role: 'vtuber' | 'artist';
  };
  to: {
    id: string;
    name: string;
    avatar: string;
    role: 'vtuber' | 'artist';
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  timestamp: string;
  isRead: boolean;
  projectId?: string;
  replyTo?: string;
}

interface MessageThread {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    role: 'vtuber' | 'artist';
  }>;
  lastMessage: Message;
  unreadCount: number;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export const useMessageThreads = () => {
  return useQuery({
    queryKey: ['message-threads'],
    queryFn: async (): Promise<MessageThread[]> => {
      const response = await apiClient.request<ApiResponse<MessageThread[]>>('/messages/threads');
      return response.data;
    },
    refetchInterval: 30000, // 30秒ごとに更新
  });
};

export const useMessages = (threadId: string) => {
  return useQuery({
    queryKey: ['messages', threadId],
    queryFn: async (): Promise<PaginatedResponse<Message>> => {
      const response = await apiClient.request<PaginatedResponse<Message>>(
        `/messages/threads/${threadId}/messages`
      );
      return response;
    },
    enabled: !!threadId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageData: {
      threadId: string;
      content: string;
      type?: 'text' | 'image' | 'file';
      attachments?: File[];
      replyTo?: string;
    }) => {
      const formData = new FormData();
      formData.append('content', messageData.content);
      formData.append('type', messageData.type || 'text');
      
      if (messageData.replyTo) {
        formData.append('replyTo', messageData.replyTo);
      }
      
      messageData.attachments?.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await apiClient.request<ApiResponse<Message>>(
        `/messages/threads/${messageData.threadId}/messages`,
        {
          method: 'POST',
          body: formData,
          headers: {}, // FormDataの場合はContent-Typeを自動設定
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
    },
  });
};
```

### マッチングAPI

```typescript
// hooks/useMatching.ts
interface MatchingCandidate {
  id: string;
  name: string;
  avatar: string;
  role: 'vtuber' | 'artist';
  specialties: string[];
  experience: string;
  rating: number;
  completedProjects: number;
  responseTime: string;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  availability: 'available' | 'busy' | 'unavailable';
  portfolio: Array<{
    id: string;
    title: string;
    thumbnail: string;
    description: string;
  }>;
  matchScore: number;
  matchReasons: string[];
}

export const useMatchingRecommendations = (criteria?: {
  specialty?: string;
  budget?: number;
  deadline?: string;
  experience?: string;
}) => {
  return useQuery({
    queryKey: ['matching', 'recommendations', criteria],
    queryFn: async (): Promise<MatchingCandidate[]> => {
      const searchParams = new URLSearchParams();
      if (criteria?.specialty) searchParams.append('specialty', criteria.specialty);
      if (criteria?.budget) searchParams.append('budget', criteria.budget.toString());
      if (criteria?.deadline) searchParams.append('deadline', criteria.deadline);
      if (criteria?.experience) searchParams.append('experience', criteria.experience);
      
      const response = await apiClient.request<ApiResponse<MatchingCandidate[]>>(
        `/matching/recommendations?${searchParams.toString()}`
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10分
  });
};

export const useSendMatchRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestData: {
      candidateId: string;
      projectId?: string;
      message: string;
      budget?: number;
      deadline?: string;
    }) => {
      const response = await apiClient.request<ApiResponse<{ requestId: string }>>(
        '/matching/requests',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matching'] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
    },
  });
};
```

### アナリティクスAPI

```typescript
// hooks/useAnalytics.ts
interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    profileViews: number;
    projectInquiries: number;
    matchRequests: number;
    completedProjects: number;
    earnings?: number;
    rating: number;
  };
  trends: Array<{
    date: string;
    profileViews: number;
    inquiries: number;
    matches: number;
    earnings?: number;
  }>;
  topPerformingContent: Array<{
    id: string;
    title: string;
    type: 'portfolio' | 'project' | 'profile';
    views: number;
    engagement: number;
  }>;
  audienceInsights: {
    demographics: {
      age: Record<string, number>;
      location: Record<string, number>;
      interests: Record<string, number>;
    };
    behavior: {
      peakActivityHours: number[];
      averageSessionDuration: number;
      returnVisitorRate: number;
    };
  };
}

export const useAnalytics = (period: 'day' | 'week' | 'month' | 'year' = 'week') => {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async (): Promise<AnalyticsData> => {
      const response = await apiClient.request<ApiResponse<AnalyticsData>>(
        `/analytics?period=${period}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5分
  });
};
```

## リアルタイム更新

### WebSocket接続

```typescript
// hooks/useWebSocket.ts
interface WebSocketMessage {
  type: 'message' | 'notification' | 'project_update' | 'match_request';
  data: any;
  timestamp: string;
}

export const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`);
    
    ws.onopen = () => {
      setConnectionStatus('connected');
      setSocket(ws);
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  return { socket, connectionStatus, sendMessage };
};
```

### 通知システム

```typescript
// hooks/useNotifications.ts
interface Notification {
  id: string;
  type: 'message' | 'project' | 'match' | 'system' | 'payment';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  timestamp: string;
  actions?: Array<{
    label: string;
    action: string;
    variant: 'primary' | 'secondary';
  }>;
}

export const useNotifications = () => {
  const { socket } = useWebSocket();
  const queryClient = useQueryClient();

  const { data: notifications = [], ...query } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const response = await apiClient.request<ApiResponse<Notification[]>>('/notifications');
      return response.data;
    },
  });

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      if (message.type === 'notification') {
        queryClient.setQueryData<Notification[]>(['notifications'], (old = []) => {
          return [message.data, ...old];
        });
        
        // ブラウザ通知を表示
        if (Notification.permission === 'granted') {
          new Notification(message.data.title, {
            body: message.data.message,
            icon: '/icon-192x192.png',
          });
        }
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.request(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) => {
        return old.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        );
      });
    },
  });

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length,
    markAsRead: markAsRead.mutate,
    ...query,
  };
};
```

## エラーハンドリング戦略

### グローバルエラーハンドラー

```typescript
// hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const showNotification = useNotificationStore(state => state.showNotification);

  return useCallback((error: ApiError) => {
    const errorMessages: Record<number, string> = {
      400: 'リクエストに問題があります。入力内容を確認してください。',
      401: 'ログインが必要です。再度ログインしてください。',
      403: 'この操作を行う権限がありません。',
      404: 'お探しのデータが見つかりません。',
      429: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
      500: 'サーバーエラーが発生しました。しばらく待ってから再試行してください。',
    };

    const message = errorMessages[error.status] || error.message || '予期しないエラーが発生しました。';

    showNotification({
      type: 'error',
      title: 'エラー',
      message,
      autoHide: error.status !== 500 ? 5000 : undefined,
    });

    // 認証エラーの場合はログイン画面にリダイレクト
    if (error.status === 401) {
      window.location.href = '/auth/login';
    }
  }, [showNotification]);
};
```

### 再試行機能

```typescript
// hooks/useRetry.ts
export const useRetryableQuery = <T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    retryCondition?: (error: ApiError) => boolean;
  } = {}
) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryCondition = (error) => error.status >= 500,
  } = options;

  return useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      if (failureCount >= maxRetries) return false;
      if (error instanceof ApiError && !retryCondition(error)) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(retryDelay * Math.pow(2, attemptIndex), 30000),
  });
};
```

## キャッシュ戦略

### クエリキーの標準化

```typescript
// lib/queryKeys.ts
export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (params?: any) => [...queryKeys.projects.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },
  messages: {
    all: ['messages'] as const,
    threads: () => [...queryKeys.messages.all, 'threads'] as const,
    thread: (threadId: string) => [...queryKeys.messages.all, 'thread', threadId] as const,
  },
  matching: {
    all: ['matching'] as const,
    recommendations: (criteria?: any) => [...queryKeys.matching.all, 'recommendations', criteria] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    data: (period: string) => [...queryKeys.analytics.all, 'data', period] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
} as const;
```

### キャッシュ無効化戦略

```typescript
// utils/cacheInvalidation.ts
export const invalidateRelatedQueries = (
  queryClient: QueryClient,
  action: string,
  entityType: string,
  entityId?: string
) => {
  const invalidationMap: Record<string, string[]> = {
    'project.created': ['projects', 'dashboard.stats'],
    'project.updated': ['projects', 'dashboard.stats'],
    'project.deleted': ['projects', 'dashboard.stats'],
    'message.sent': ['messages', 'notifications'],
    'match.requested': ['matching', 'notifications'],
    'match.accepted': ['projects', 'matching', 'notifications'],
  };

  const queriesToInvalidate = invalidationMap[`${entityType}.${action}`] || [];
  
  queriesToInvalidate.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  });
};
```

## 認証・認可

### トークン管理

```typescript
// utils/auth.ts
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};
```

### 権限チェック

```typescript
// hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    const rolePermissions: Record<string, string[]> = {
      vtuber: ['project.create', 'project.view', 'message.send', 'matching.request'],
      artist: ['project.view', 'project.apply', 'message.send', 'portfolio.manage'],
      admin: ['*'], // すべての権限
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [user]);

  return { hasPermission };
};
```

## パフォーマンス最適化

### 仮想化とページネーション

```typescript
// hooks/useVirtualList.ts
export const useVirtualList = <T>(
  items: T[],
  {
    itemHeight,
    containerHeight,
    overscan = 5,
  }: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
  }));

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
};
```

### 無限スクロール

```typescript
// hooks/useInfiniteScroll.ts
export const useInfiniteQuery = <T>(
  queryKey: any[],
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<PaginatedResponse<T>>,
  options?: {
    initialPageParam?: number;
    getNextPageParam?: (lastPage: PaginatedResponse<T>) => number | undefined;
  }
) => {
  return useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam: options?.initialPageParam ?? 1,
    getNextPageParam: options?.getNextPageParam ?? ((lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    }),
  });
};
```

## テスト支援

### APIモック

```typescript
// __tests__/mocks/apiMocks.ts
export const mockApiClient = {
  request: jest.fn(),
};

export const mockDashboardStats: DashboardStats = {
  activeProjects: 12,
  totalMessages: 45,
  matchingScore: 85,
  earnings: 125000,
  trends: {
    projects: { value: 12, change: 8.2 },
    messages: { value: 45, change: -5.1 },
    matches: { value: 23, change: 12.7 },
    earnings: { value: 125000, change: 15.3 },
  },
};

export const mockProjects: Project[] = [
  {
    id: 'proj_1',
    title: 'Test Project',
    description: 'Test Description',
    status: 'active',
    deadline: '2024-12-31T23:59:59Z',
    budget: { amount: 50000, currency: 'JPY' },
    progress: 50,
    lastActivity: '2024-11-15T10:30:00Z',
    priority: 'high',
    tags: ['test'],
    createdAt: '2024-11-01T09:00:00Z',
    updatedAt: '2024-11-15T10:30:00Z',
  },
];
```

## 設定とデプロイ

### 環境変数

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### ビルド最適化

```typescript
// next.config.mjs
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  webpack: (config) => {
    config.optimization.splitChunks.chunks = 'all';
    return config;
  },
};
```
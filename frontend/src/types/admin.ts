// 管理者ダッシュボード関連の型定義

export interface AdminMetrics {
  activeUsers: number;
  newUsers: number;
  monthlyRevenue: number;
  systemUptime: number;
  apiResponseTime: number;
  errorRate: number;
}

export interface SystemHealth {
  cpu: {
    usage: number;
    status: 'normal' | 'warning' | 'critical';
  };
  memory: {
    usage: number;
    status: 'normal' | 'warning' | 'critical';
  };
  disk: {
    usage: number;
    status: 'normal' | 'warning' | 'critical';
  };
  database: {
    connectionCount: number;
    queryTime: number;
    status: 'online' | 'offline' | 'degraded';
  };
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  userType: 'VTUBER' | 'ARTIST';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  authLevel?: 'BASIC' | 'ADVANCED' | 'EXPERT';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  transactionCount: number;
  totalEarnings: number;
  riskScore?: number;
}

export interface AdminTransaction {
  id: string;
  matchId: string;
  vtuberUserId: string;
  artistUserId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  completedAt?: string;
  fees: {
    platform: number;
    payment: number;
    total: number;
  };
  riskFlags: string[];
}

export interface AdminAlert {
  id: string;
  type: 'security' | 'performance' | 'business' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  actionRequired: boolean;
  metadata?: Record<string, any>;
}

export interface AdminReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  description: string;
  generatedAt: string;
  data: {
    userGrowth: {
      new: number;
      active: number;
      churn: number;
    };
    revenue: {
      total: number;
      growth: number;
      breakdown: Record<string, number>;
    };
    platform: {
      matches: number;
      completionRate: number;
      satisfaction: number;
    };
    quality: {
      disputeRate: number;
      resolutionTime: number;
      userRatings: number;
    };
  };
}

export interface AdminActivity {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: {
    type: 'user' | 'transaction' | 'content' | 'system';
    id: string;
    name?: string;
  };
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

// API レスポンス型
export interface AdminDashboardData {
  metrics: AdminMetrics;
  systemHealth: SystemHealth;
  recentAlerts: AdminAlert[];
  recentActivity: AdminActivity[];
  chartData: {
    userActivity: Array<{ timestamp: string; value: number }>;
    apiRequests: Array<{ timestamp: string; value: number }>;
    revenue: Array<{ timestamp: string; value: number }>;
  };
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    userType?: 'VTUBER' | 'ARTIST';
    status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    authLevel?: 'BASIC' | 'ADVANCED' | 'EXPERT';
    search?: string;
  };
}

export interface AdminTransactionListResponse {
  transactions: AdminTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalAmount: number;
    completedCount: number;
    pendingCount: number;
    failedCount: number;
  };
}

// フォーム型
export interface AdminUserUpdateRequest {
  status?: 'ACTIVE' | 'SUSPENDED';
  authLevel?: 'BASIC' | 'ADVANCED' | 'EXPERT';
  notes?: string;
}

export interface AdminAlertUpdateRequest {
  acknowledged: boolean;
  notes?: string;
}

export interface AdminReportGenerateRequest {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  includeCharts: boolean;
  format: 'json' | 'csv' | 'pdf';
}

// フィルター・検索型
export interface AdminSearchFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string[];
  type?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdminTableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any) => React.ReactNode;
}

export interface AdminTableProps {
  columns: AdminTableColumn[];
  data: any[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  selection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[]) => void;
  };
  actions?: {
    bulk?: Array<{
      key: string;
      label: string;
      onClick: (selectedRowKeys: string[]) => void;
    }>;
    row?: Array<{
      key: string;
      label: string;
      icon?: React.ElementType;
      onClick: (record: any) => void;
    }>;
  };
}
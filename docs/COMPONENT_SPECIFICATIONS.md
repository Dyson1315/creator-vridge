# ダッシュボードコンポーネント仕様書

## 概要

VRidge Creator ダッシュボードで使用する全コンポーネントの詳細仕様とAPIドキュメントです。

## レイアウトコンポーネント

### DashboardLayout

メインのダッシュボードレイアウトコンポーネント

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: boolean;
  className?: string;
}

// 使用例
<DashboardLayout sidebar={true}>
  <DashboardContent />
</DashboardLayout>
```

**実装ポイント:**
- レスポンシブサイドバー制御
- モバイルでのオーバーレイ表示
- キーボードナビゲーション対応

### Sidebar

ナビゲーション用サイドバーコンポーネント

```typescript
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  userRole: 'vtuber' | 'artist' | 'admin';
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number;
  roles: string[];
}
```

**ナビゲーション構造:**
```typescript
const navigationItems: NavigationItem[] = [
  {
    label: 'ダッシュボード',
    href: '/dashboard',
    icon: HomeIcon,
    roles: ['vtuber', 'artist', 'admin']
  },
  {
    label: 'プロジェクト',
    href: '/dashboard/projects',
    icon: FolderIcon,
    roles: ['vtuber', 'artist']
  },
  {
    label: 'メッセージ',
    href: '/dashboard/messages',
    icon: ChatBubbleLeftIcon,
    badge: 3,
    roles: ['vtuber', 'artist']
  },
  {
    label: 'マッチング',
    href: '/dashboard/matching',
    icon: HeartIcon,
    roles: ['vtuber', 'artist']
  },
  {
    label: 'アナリティクス',
    href: '/dashboard/analytics',
    icon: ChartBarIcon,
    roles: ['vtuber', 'artist', 'admin']
  },
  {
    label: '設定',
    href: '/dashboard/settings',
    icon: CogIcon,
    roles: ['vtuber', 'artist', 'admin']
  }
];
```

## ウィジェットコンポーネント

### StatsCard

統計情報表示カード

```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'flat';
  loading?: boolean;
  onClick?: () => void;
}

// 使用例
<StatsCard
  title="アクティブプロジェクト"
  value={12}
  change={{
    value: 8.2,
    type: 'increase',
    period: '先月比'
  }}
  icon={FolderIcon}
  trend="up"
/>
```

### ProjectWidget

プロジェクト一覧・管理ウィジェット

```typescript
interface Project {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  deadline: Date;
  collaborator?: {
    id: string;
    name: string;
    avatar: string;
    role: 'vtuber' | 'artist';
  };
  progress: number; // 0-100
  lastActivity: Date;
  priority: 'low' | 'medium' | 'high';
}

interface ProjectWidgetProps {
  projects: Project[];
  maxItems?: number;
  showCreateButton?: boolean;
  onProjectClick: (project: Project) => void;
  onCreateProject?: () => void;
  loading?: boolean;
}
```

**状態表示:**
```typescript
const statusConfig = {
  draft: {
    color: 'calm-400',
    label: '下書き',
    icon: DocumentIcon
  },
  active: {
    color: 'primary-400',
    label: '進行中',
    icon: PlayIcon
  },
  completed: {
    color: 'secondary-400',
    label: '完了',
    icon: CheckIcon
  },
  cancelled: {
    color: 'red-400',
    label: 'キャンセル',
    icon: XMarkIcon
  }
};
```

### MessageWidget

メッセージ・コミュニケーション管理ウィジェット

```typescript
interface Message {
  id: string;
  from: {
    id: string;
    name: string;
    avatar: string;
    role: 'vtuber' | 'artist';
  };
  content: string;
  timestamp: Date;
  isRead: boolean;
  projectId?: string;
  type: 'direct' | 'project' | 'system';
}

interface MessageWidgetProps {
  messages: Message[];
  maxItems?: number;
  showComposeButton?: boolean;
  onMessageClick: (message: Message) => void;
  onCompose?: () => void;
  loading?: boolean;
}
```

### AnalyticsWidget

分析・統計情報ウィジェット

```typescript
interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    views: number;
    matches: number;
    projects: number;
    earnings?: number; // アーティストのみ
    collaborations: number;
  };
  trends: {
    [key: string]: {
      current: number;
      previous: number;
      change: number;
    };
  };
  chartData: ChartDataPoint[];
}

interface AnalyticsWidgetProps {
  data: AnalyticsData;
  period: 'day' | 'week' | 'month' | 'year';
  onPeriodChange: (period: string) => void;
  loading?: boolean;
}
```

### MatchingRecommendations

マッチング推奨ウィジェット

```typescript
interface MatchingCandidate {
  id: string;
  name: string;
  avatar: string;
  role: 'vtuber' | 'artist';
  compatibility: number; // 0-100
  skills: string[];
  experience: string;
  rating: number;
  projects: number;
  matchReason: string;
}

interface MatchingRecommendationsProps {
  candidates: MatchingCandidate[];
  maxItems?: number;
  onCandidateClick: (candidate: MatchingCandidate) => void;
  onRefresh?: () => void;
  loading?: boolean;
}
```

## アクションコンポーネント

### QuickActions

クイックアクション集約コンポーネント

```typescript
interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  onClick: () => void;
  disabled?: boolean;
  badge?: number;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface QuickActionsProps {
  actions: QuickAction[];
  layout?: 'grid' | 'list';
  maxItems?: number;
}

// 標準アクション定義
const standardActions: QuickAction[] = [
  {
    id: 'create-project',
    label: 'プロジェクト作成',
    icon: PlusIcon,
    onClick: () => router.push('/dashboard/projects/create'),
    variant: 'primary'
  },
  {
    id: 'browse-artists',
    label: 'アーティスト検索',
    icon: MagnifyingGlassIcon,
    onClick: () => router.push('/dashboard/matching'),
    variant: 'secondary'
  },
  {
    id: 'check-messages',
    label: 'メッセージ確認',
    icon: ChatBubbleLeftIcon,
    onClick: () => router.push('/dashboard/messages'),
    badge: unreadCount,
    variant: 'outline'
  }
];
```

### NotificationBar

通知バーコンポーネント

```typescript
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible: boolean;
  autoHide?: number; // ms
}

interface NotificationBarProps {
  notifications: Notification[];
  maxVisible?: number;
  position?: 'top' | 'bottom';
  onDismiss: (id: string) => void;
}
```

### UserProfileSummary

ユーザープロフィール要約コンポーネント

```typescript
interface UserProfile {
  id: string;
  name: string;
  role: 'vtuber' | 'artist';
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  stats: {
    projects: number;
    rating: number;
    experience: string;
    joinDate: Date;
  };
  currentProject?: {
    id: string;
    title: string;
    progress: number;
  };
}

interface UserProfileSummaryProps {
  profile: UserProfile;
  showStats?: boolean;
  showCurrentProject?: boolean;
  onProfileClick?: () => void;
  onStatusChange?: (status: string) => void;
}
```

## チャートコンポーネント

### LineChart

線グラフコンポーネント（時系列データ用）

```typescript
interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showPoints?: boolean;
  animated?: boolean;
  onPointClick?: (point: ChartDataPoint, index: number) => void;
}
```

### BarChart

棒グラフコンポーネント（カテゴリ別データ用）

```typescript
interface BarChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  horizontal?: boolean;
  showValues?: boolean;
  animated?: boolean;
  onBarClick?: (point: ChartDataPoint, index: number) => void;
}
```

### DonutChart

ドーナツグラフコンポーネント（割合表示用）

```typescript
interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  size?: number;
  thickness?: number;
  showLabels?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  onSegmentClick?: (segment: any, index: number) => void;
}
```

## 共通Props・インターフェース

### 基本コンポーネントProps

```typescript
interface BaseComponentProps {
  className?: string;
  testId?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
  skeleton?: boolean;
}

interface ErrorProps {
  error?: string | Error;
  onRetry?: () => void;
  errorBoundary?: boolean;
}
```

### アニメーション設定

```typescript
const animationPresets = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulseSoft: 'animate-pulse-soft',
  none: ''
};

interface AnimationProps {
  animation?: keyof typeof animationPresets;
  delay?: number;
  duration?: number;
}
```

## 実装ガイドライン

### 1. アクセシビリティ要件
- すべてのインタラクティブ要素にfocus状態
- キーボード操作対応（Tab, Enter, Space, Arrow keys）
- スクリーンリーダー対応（aria-*属性）
- 十分なカラーコントラスト（4.5:1以上）

### 2. レスポンシブデザイン
- Mobile First approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)
- Grid systemの活用

### 3. パフォーマンス最適化
- React.memo()による不要な再レンダリング防止
- Virtual scrolling（リストが100件以上）
- 画像の遅延読み込み

### 4. エラーハンドリング
- 適切なfallback UI
- エラーバウンダリーの実装
- ユーザーフレンドリーなエラーメッセージ

### 5. テスト要件
- 単体テスト（Jest + React Testing Library）
- 統合テスト（重要なユーザーフロー）
- Visual regression test（Chromatic）
- アクセシビリティテスト（axe-core）
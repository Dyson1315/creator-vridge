# VRidge Creator ダッシュボード コーディング規約

## 概要

VRidge Creator ダッシュボード開発における統一されたコーディング規約です。品質、保守性、チーム開発の効率性を最大化するための標準を定義します。

## 言語・フレームワーク規約

### TypeScript

#### 基本設定

```typescript
// tsconfig.json - strict mode必須
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### 型定義規約

```typescript
// ✅ 推奨：明示的な型定義
interface UserProfile {
  readonly id: string;
  name: string;
  email: string;
  role: 'vtuber' | 'artist' | 'admin';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ 推奨：Generic型の活用
interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: readonly string[];
}

// ✅ 推奨：Union型による状態管理
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ❌ 禁止：any型の使用
const userData: any = fetchUser(); // NG

// ❌ 禁止：型アサーション（特別な理由がない限り）
const user = data as User; // NG

// ✅ 推奨：型ガードの使用
function isUser(data: unknown): data is User {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'name' in data;
}
```

#### null/undefined処理

```typescript
// ✅ 推奨：Optional Chaining
const userName = user?.profile?.name ?? 'Unknown';

// ✅ 推奨：Nullish Coalescing
const displayName = user.displayName ?? user.name ?? 'Anonymous';

// ✅ 推奨：型ガードによる安全な処理
function processUser(user: User | null) {
  if (!user) {
    return null;
  }
  return user.name.toUpperCase();
}

// ❌ 禁止：不安全なアクセス
const name = user.name; // userがnullableな場合
```

### React

#### コンポーネント定義

```typescript
// ✅ 推奨：関数コンポーネント（Arrow Function）
export const DashboardCard = ({ 
  title, 
  children, 
  className,
  ...props 
}: DashboardCardProps) => {
  return (
    <div className={cn('dashboard-card', className)} {...props}>
      <h3>{title}</h3>
      {children}
    </div>
  );
};

// ✅ 推奨：Props型定義
interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'elevated';
  onClick?: () => void;
}

// ✅ 推奨：defaultPropsの代わりにデフォルト引数
export const Button = ({ 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
  ...props 
}: ButtonProps) => {
  // implementation
};

// ❌ 禁止：function宣言
function DashboardCard() { } // NG

// ❌ 禁止：React.FC型
const DashboardCard: React.FC<Props> = () => { }; // NG
```

#### Hooks使用規約

```typescript
// ✅ 推奨：適切な依存配列
useEffect(() => {
  fetchUserData(userId);
}, [userId]); // userIdが変更された時のみ実行

// ✅ 推奨：カスタムフック分離
const useDashboardData = (userId: string) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchDashboard(userId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { data, loading, error };
};

// ✅ 推奨：メモ化の適切な使用
const expensiveCalculation = useMemo(() => {
  return data.reduce((sum, item) => sum + item.value, 0);
}, [data]);

const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// ❌ 禁止：不要な依存配列
useEffect(() => {
  console.log('Component mounted');
}, []); // 空配列で良い場合

useEffect(() => {
  setCount(count + 1);
}, [count]); // 無限ループの危険性
```

#### コンポーネント構造

```typescript
// ✅ 推奨：コンポーネント構造の標準化
export const ProjectCard = ({ project, onEdit, onDelete }: ProjectCardProps) => {
  // 1. Hooks（状態管理）
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. カスタムフック
  const { user } = useAuth();
  const { mutate: updateProject } = useUpdateProject();

  // 3. 計算・派生値
  const canEdit = useMemo(() => {
    return user?.id === project.authorId || user?.role === 'admin';
  }, [user, project.authorId]);

  // 4. イベントハンドラー
  const handleEdit = useCallback(() => {
    if (canEdit) {
      onEdit(project.id);
    }
  }, [canEdit, onEdit, project.id]);

  const handleDelete = useCallback(async () => {
    if (!canEdit) return;
    
    try {
      setIsLoading(true);
      await deleteProject(project.id);
      onDelete(project.id);
    } catch (err) {
      setError('削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, project.id, onDelete]);

  // 5. Effect（副作用）
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 6. 早期リターン
  if (!project) {
    return <ProjectCardSkeleton />;
  }

  // 7. JSX返却
  return (
    <Card className="project-card">
      {/* implementation */}
    </Card>
  );
};
```

### Next.js App Router

#### ページコンポーネント

```typescript
// ✅ 推奨：ページコンポーネント構造
// app/dashboard/projects/page.tsx
import { Metadata } from 'next';
import { ProjectList } from '@/components/projects/ProjectList';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';

export const metadata: Metadata = {
  title: 'プロジェクト一覧 | VRidge Creator',
  description: 'あなたのプロジェクト一覧を管理できます。',
};

interface ProjectsPageProps {
  searchParams: {
    status?: string;
    page?: string;
  };
}

export default function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const status = searchParams.status ?? 'all';
  const page = parseInt(searchParams.page ?? '1', 10);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
          <CreateProjectButton />
        </div>
        <ProjectList status={status} page={page} />
      </div>
    </DashboardLayout>
  );
}
```

#### レイアウトコンポーネント

```typescript
// ✅ 推奨：レイアウト構造
// app/dashboard/layout.tsx
import { DashboardSidebar } from '@/components/dashboard/layout/DashboardSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard requiredRole={['vtuber', 'artist']}>
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
```

## CSS/Tailwind CSS

### クラス名規約

```typescript
// ✅ 推奨：Tailwindクラスの構造化
const cardClasses = cn(
  // Layout
  'flex flex-col',
  'w-full max-w-md',
  'p-6 space-y-4',
  
  // Appearance
  'bg-white rounded-xl',
  'border border-gray-200',
  'shadow-soft',
  
  // States
  'hover:shadow-lg',
  'focus-within:ring-2 focus-within:ring-primary-400',
  'transition-all duration-200',
  
  // Responsive
  'sm:max-w-lg md:max-w-xl',
  
  // Conditional
  {
    'opacity-50 pointer-events-none': disabled,
    'border-red-300 bg-red-50': hasError,
  },
  
  // External
  className
);

// ✅ 推奨：カスタムCSS（必要最小限）
// styles/components.css
@layer components {
  .dashboard-card {
    @apply bg-white rounded-xl border border-calm-200 p-6;
    @apply shadow-soft hover:shadow-lg transition-shadow duration-200;
  }
  
  .btn-primary {
    @apply bg-primary-400 text-white font-medium px-4 py-2 rounded-lg;
    @apply hover:bg-primary-500 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2;
    @apply disabled:opacity-50 disabled:pointer-events-none;
    @apply transition-colors duration-150;
  }
}

// ❌ 禁止：インラインスタイル（特別な理由がない限り）
<div style={{ marginTop: '20px', color: 'red' }}> // NG
```

### レスポンシブデザイン

```typescript
// ✅ 推奨：Mobile First設計
const responsiveClasses = cn(
  // Mobile (default)
  'grid grid-cols-1 gap-4',
  'text-sm',
  
  // Tablet
  'sm:grid-cols-2 sm:gap-6',
  'sm:text-base',
  
  // Desktop
  'lg:grid-cols-3 lg:gap-8',
  'lg:text-lg',
  
  // Large Desktop
  '2xl:grid-cols-4'
);

// ✅ 推奨：コンテナサイズの統一
const containerClasses = cn(
  'container mx-auto',
  'px-4 sm:px-6 lg:px-8',
  'max-w-7xl'
);
```

## 状態管理（Zustand）

### ストア定義

```typescript
// ✅ 推奨：型安全なストア定義
interface DashboardState {
  // State
  readonly stats: DashboardStats | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastUpdated: Date | null;
  
  // Actions
  readonly fetchStats: () => Promise<void>;
  readonly clearError: () => void;
  readonly reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  stats: null,
  loading: false,
  error: null,
  lastUpdated: null,

  // Actions
  fetchStats: async () => {
    const currentState = get();
    
    // Prevent duplicate requests
    if (currentState.loading) return;

    set({ loading: true, error: null });

    try {
      const stats = await fetchDashboardStats();
      set({ 
        stats, 
        loading: false, 
        lastUpdated: new Date() 
      });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set({
    stats: null,
    loading: false,
    error: null,
    lastUpdated: null,
  }),
}));

// ✅ 推奨：セレクターフック
export const useDashboardStats = () => {
  return useDashboardStore(state => state.stats);
};

export const useDashboardLoading = () => {
  return useDashboardStore(state => state.loading);
};

export const useDashboardActions = () => {
  return useDashboardStore(state => ({
    fetchStats: state.fetchStats,
    clearError: state.clearError,
    reset: state.reset,
  }));
};
```

### 永続化

```typescript
// ✅ 推奨：選択的永続化
interface UserPreferencesState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  language: 'ja' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      language: 'ja',
      notifications: {
        email: true,
        push: true,
        desktop: false,
      },
      
      // Actions...
    }),
    {
      name: 'user-preferences',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
        notifications: state.notifications,
      }),
    }
  )
);
```

## エラーハンドリング

### 統一的エラー処理

```typescript
// ✅ 推奨：カスタムエラークラス
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field: string) {
    super(message, 'VALIDATION_ERROR', 400, '入力内容に問題があります');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, 'お探しの項目が見つかりません');
  }
}

// ✅ 推奨：エラーバウンダリー
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ログ送信
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 外部サービスへの報告（Sentry等）
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// ✅ 推奨：フォームバリデーション
const projectSchema = z.object({
  title: z.string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内で入力してください'),
  description: z.string()
    .min(10, '説明は10文字以上で入力してください')
    .max(1000, '説明は1000文字以内で入力してください'),
  deadline: z.date()
    .min(new Date(), '締切は現在より後の日付を選択してください'),
  budget: z.number()
    .min(1000, '予算は1000円以上で設定してください')
    .max(1000000, '予算は100万円以内で設定してください'),
});

type ProjectFormData = z.infer<typeof projectSchema>;
```

## パフォーマンス最適化

### コンポーネント最適化

```typescript
// ✅ 推奨：React.memo使用
export const ProjectCard = React.memo<ProjectCardProps>(({ 
  project, 
  onEdit, 
  onDelete 
}) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for complex objects
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.updatedAt === nextProps.project.updatedAt
  );
});

// ✅ 推奨：適切なkey設定
{projects.map(project => (
  <ProjectCard
    key={`${project.id}-${project.updatedAt}`} // 安定したkey
    project={project}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
))}

// ✅ 推奨：レンダリング最適化
const ProjectList = ({ projects }: ProjectListProps) => {
  // 重い計算のメモ化
  const sortedProjects = useMemo(() => {
    return projects.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [projects]);

  // コールバックのメモ化
  const handleEdit = useCallback((projectId: string) => {
    router.push(`/dashboard/projects/${projectId}/edit`);
  }, [router]);

  return (
    <div className="space-y-4">
      {sortedProjects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
};
```

### バンドル最適化

```typescript
// ✅ 推奨：動的インポート
const AnalyticsChart = dynamic(
  () => import('@/components/charts/AnalyticsChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // クライアントサイドでのみ読み込み
  }
);

// ✅ 推奨：条件付き読み込み
const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  {
    loading: () => <div>Loading admin panel...</div>,
  }
);

export const Dashboard = ({ user }: DashboardProps) => {
  return (
    <div>
      <DashboardHeader />
      <DashboardContent />
      {user.role === 'admin' && <AdminPanel />}
    </div>
  );
};
```

## テストコード規約

### 単体テスト

```typescript
// ✅ 推奨：テスト構造
describe('DashboardCard', () => {
  // テストデータの準備
  const mockProject = {
    id: 'test-id',
    title: 'Test Project',
    status: 'active' as const,
    progress: 50,
  };

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('displays project information correctly', () => {
      render(
        <DashboardCard 
          project={mockProject} 
          {...mockHandlers} 
        />
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows correct status indicator', () => {
      render(
        <DashboardCard 
          project={mockProject} 
          {...mockHandlers} 
        />
      );

      const statusIndicator = screen.getByTestId('project-status');
      expect(statusIndicator).toHaveClass('status-active');
    });
  });

  describe('User Interactions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DashboardCard 
          project={mockProject} 
          {...mockHandlers} 
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith('test-id');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <DashboardCard 
          project={mockProject} 
          {...mockHandlers} 
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <DashboardCard 
          project={mockProject} 
          {...mockHandlers} 
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await user.tab();
      expect(editButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockHandlers.onEdit).toHaveBeenCalled();
    });
  });
});
```

### API Hook テスト

```typescript
// ✅ 推奨：カスタムフックテスト
describe('useDashboardStats', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('fetches dashboard stats successfully', async () => {
    const mockStats = { activeProjects: 5, totalMessages: 10 };
    
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockStats
    });

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStats);
  });

  it('handles error states correctly', async () => {
    const mockError = new Error('API Error');
    
    (apiClient.request as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
```

## コメント・ドキュメント

### JSDoc規約

```typescript
/**
 * ダッシュボード用の統計カードコンポーネント
 * 
 * @description プロジェクト数、メッセージ数などの統計情報を
 * 視覚的に分かりやすく表示するカードUI
 * 
 * @example
 * ```tsx
 * <StatsCard
 *   title="アクティブプロジェクト"
 *   value={12}
 *   change={{ value: 8.2, type: 'increase', period: '先月比' }}
 *   icon={FolderIcon}
 * />
 * ```
 */
export interface StatsCardProps {
  /** カードのタイトル */
  title: string;
  
  /** 表示する統計値 */
  value: string | number;
  
  /** 前期比較データ（オプション） */
  change?: {
    /** 変化量（%） */
    value: number;
    /** 変化の種類 */
    type: 'increase' | 'decrease' | 'neutral';
    /** 比較期間の説明 */
    period: string;
  };
  
  /** 表示するアイコン */
  icon: React.ComponentType<{ className?: string }>;
  
  /** ローディング状態 */
  loading?: boolean;
  
  /** クリック時のハンドラー */
  onClick?: () => void;
}

/**
 * 統計カードコンポーネント
 * 
 * @param props - StatsCardProps
 * @returns 統計情報を表示するカード要素
 */
export const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  loading = false,
  onClick 
}: StatsCardProps) => {
  // Implementation
};
```

### インラインコメント

```typescript
export const ProjectTimeline = ({ projectId }: ProjectTimelineProps) => {
  // プロジェクトのタイムラインデータを取得
  const { data: timeline, isLoading } = useProjectTimeline(projectId);
  
  // 日付でソートして表示用データを準備
  const sortedEvents = useMemo(() => {
    if (!timeline) return [];
    
    return timeline
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(event => ({
        ...event,
        // 日本語の相対時間表示に変換
        relativeTime: formatDistanceToNow(new Date(event.createdAt), {
          addSuffix: true,
          locale: ja,
        }),
      }));
  }, [timeline]);

  // ローディング中はスケルトンを表示
  if (isLoading) {
    return <TimelineSkeleton />;
  }

  // データがない場合は空状態を表示
  if (!timeline || timeline.length === 0) {
    return (
      <EmptyState
        title="タイムラインデータがありません"
        description="プロジェクトの活動が記録されると、ここに表示されます。"
        icon={ClockIcon}
      />
    );
  }

  return (
    <div className="space-y-4">
      {sortedEvents.map((event) => (
        <TimelineEvent
          key={event.id}
          event={event}
          // ボーダーの色を種類によって変更
          borderColor={getEventBorderColor(event.type)}
        />
      ))}
    </div>
  );
};
```

## Git規約

### コミットメッセージ

```bash
# ✅ 推奨：Conventional Commits
feat(dashboard): add project statistics widget
fix(auth): resolve login redirect issue
docs(api): update authentication endpoints
style(ui): improve button hover states
refactor(hooks): optimize data fetching logic
test(components): add unit tests for StatsCard
chore(deps): update dependencies to latest versions

# ❌ 禁止
update stuff
fix bug
changes
wip
```

### ブランチ名

```bash
# ✅ 推奨：機能ブランチ
feature/dashboard-analytics-widget
feature/project-management-ui
fix/login-redirect-bug
fix/performance-optimization
hotfix/critical-security-patch
refactor/api-hooks-structure

# ❌ 禁止
my-branch
temp
test123
feature1
```

## セキュリティ規約

### 入力値の検証

```typescript
// ✅ 推奨：バリデーション必須
const createProject = async (data: unknown) => {
  // 1. スキーマによる検証
  const validatedData = projectCreateSchema.parse(data);
  
  // 2. 権限チェック
  if (!hasPermission(user, 'project.create')) {
    throw new ForbiddenError('プロジェクト作成権限がありません');
  }
  
  // 3. サニタイゼーション
  const sanitizedData = {
    ...validatedData,
    title: sanitizeHtml(validatedData.title),
    description: sanitizeHtml(validatedData.description),
  };
  
  // 4. API呼び出し
  return await apiClient.request('/projects', {
    method: 'POST',
    body: JSON.stringify(sanitizedData),
  });
};

// ❌ 禁止：直接的なHTML表示
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // NG

// ✅ 推奨：適切なエスケープ
<div>{sanitizeHtml(userInput)}</div>
```

### 機密情報の取り扱い

```typescript
// ✅ 推奨：環境変数による設定
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT ?? '10000', 10),
};

// ❌ 禁止：ハードコーディング
const API_CONFIG = {
  baseURL: 'https://api.example.com', // NG
  secretKey: 'my-secret-key-123', // NG
};

// ✅ 推奨：ログ出力の制御
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data);
  }
};

// ❌ 禁止：本番環境での機密情報ログ出力
console.log('User token:', userToken); // NG
```

## パフォーマンス規約

### 計測・監視

```typescript
// ✅ 推奨：パフォーマンス計測
const ComponentWithPerf = () => {
  useEffect(() => {
    const startTime = performance.now();
    
    // 重い処理
    heavyOperation();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 開発環境でのパフォーマンス監視
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`Heavy operation took ${duration}ms`);
    }
    
    // 本番環境での分析送信
    if (process.env.NODE_ENV === 'production') {
      analytics.track('heavy_operation_duration', { duration });
    }
  }, []);
};

// ✅ 推奨：メモ化の適切な使用
const ExpensiveComponent = React.memo(({ items }: Props) => {
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      processed: expensiveProcessing(item),
    }));
  }, [items]);

  return <div>{/* render */}</div>;
});
```

このコーディング規約に従うことで、VRidge Creator ダッシュボードの品質、保守性、セキュリティを確保し、チーム開発の効率性を最大化できます。
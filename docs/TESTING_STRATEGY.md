# VRidge Creator ダッシュボード テスト戦略

## 概要

VRidge Creator ダッシュボードにおける包括的なテスト戦略です。品質保証、回帰防止、継続的な改善を目的とした多層テストアプローチを定義します。

## テスト戦略の基本方針

### テストピラミッド

```
                  E2E Tests (5%)
               ┌─────────────────┐
               │ User Journeys   │
               │ Critical Flows  │
               └─────────────────┘
            Integration Tests (25%)
         ┌───────────────────────────┐
         │ Component Integration     │
         │ API Integration          │
         │ User Interactions        │
         └───────────────────────────┘
      Unit Tests (70%)
   ┌─────────────────────────────────────┐
   │ Functions, Hooks, Components        │
   │ Business Logic, Utilities           │
   │ State Management                    │
   └─────────────────────────────────────┘
```

### 品質ゲート

- **Unit Tests**: 90%以上のカバレッジ
- **Integration Tests**: 主要ユーザーフローの80%以上
- **E2E Tests**: クリティカルパスの100%
- **Performance**: Core Web Vitals基準値内
- **Accessibility**: WCAG 2.1 AA準拠

## Unit Tests（単体テスト）

### テストフレームワーク設定

```typescript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/**/layout.tsx',
    '!src/app/**/page.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### セットアップファイル

```typescript
// jest.setup.js
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'user-123',
    name: 'テストユーザー',
    email: 'test@example.com',
    role: 'vtuber',
    avatar: 'https://example.com/avatar.jpg',
    ...overrides,
  }),
  
  createMockProject: (overrides = {}) => ({
    id: 'project-123',
    title: 'テストプロジェクト',
    description: 'テスト用のプロジェクト説明',
    status: 'active',
    progress: 50,
    deadline: '2024-12-31',
    budget: { amount: 50000, currency: 'JPY' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    ...overrides,
  }),
};
```

### コンポーネントテスト

```typescript
// __tests__/components/dashboard/StatsCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StatsCard } from '@/components/dashboard/widgets/StatsCard';
import { FolderIcon } from '@heroicons/react/24/outline';

expect.extend(toHaveNoViolations);

describe('StatsCard', () => {
  const defaultProps = {
    title: 'アクティブプロジェクト',
    value: 12,
    icon: FolderIcon,
  };

  describe('Rendering', () => {
    it('displays title and value correctly', () => {
      render(<StatsCard {...defaultProps} />);
      
      expect(screen.getByText('アクティブプロジェクト')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('renders icon component', () => {
      render(<StatsCard {...defaultProps} />);
      
      const icon = screen.getByTestId('stats-card-icon');
      expect(icon).toBeInTheDocument();
    });

    it('shows loading state when loading prop is true', () => {
      render(<StatsCard {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('stats-card-skeleton')).toBeInTheDocument();
      expect(screen.queryByText('12')).not.toBeInTheDocument();
    });

    it('displays change information when provided', () => {
      const propsWithChange = {
        ...defaultProps,
        change: {
          value: 8.2,
          type: 'increase' as const,
          period: '先月比',
        },
      };

      render(<StatsCard {...propsWithChange} />);
      
      expect(screen.getByText('↗ 8.2%')).toBeInTheDocument();
      expect(screen.getByText('先月比')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when card is clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<StatsCard {...defaultProps} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when card is in loading state', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <StatsCard 
          {...defaultProps} 
          onClick={handleClick} 
          loading={true} 
        />
      );
      
      const card = screen.getByTestId('stats-card-skeleton');
      await user.click(card);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<StatsCard {...defaultProps} onClick={handleClick} />);
      
      const card = screen.getByRole('button');
      
      // Tab to focus
      await user.tab();
      expect(card).toHaveFocus();
      
      // Enter to activate
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Space to activate
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Visual Variants', () => {
    it('applies correct styling for increase trend', () => {
      const propsWithIncrease = {
        ...defaultProps,
        change: { value: 5.5, type: 'increase' as const, period: '先月比' },
      };

      render(<StatsCard {...propsWithIncrease} />);
      
      const changeElement = screen.getByText('↗ 5.5%');
      expect(changeElement).toHaveClass('text-green-600');
    });

    it('applies correct styling for decrease trend', () => {
      const propsWithDecrease = {
        ...defaultProps,
        change: { value: -3.2, type: 'decrease' as const, period: '先月比' },
      };

      render(<StatsCard {...propsWithDecrease} />);
      
      const changeElement = screen.getByText('↘ 3.2%');
      expect(changeElement).toHaveClass('text-red-600');
    });

    it('applies correct styling for neutral trend', () => {
      const propsWithNeutral = {
        ...defaultProps,
        change: { value: 0, type: 'neutral' as const, period: '先月比' },
      };

      render(<StatsCard {...propsWithNeutral} />);
      
      const changeElement = screen.getByText('→ 0%');
      expect(changeElement).toHaveClass('text-gray-600');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<StatsCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels', () => {
      render(<StatsCard {...defaultProps} onClick={() => {}} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'アクティブプロジェクト: 12');
    });

    it('has sufficient color contrast', () => {
      render(<StatsCard {...defaultProps} />);
      
      const title = screen.getByText('アクティブプロジェクト');
      const value = screen.getByText('12');
      
      // テキストカラーのコントラスト比を検証
      expect(title).toHaveStyle('color: rgb(55 65 81)'); // text-gray-700
      expect(value).toHaveStyle('color: rgb(17 24 39)'); // text-gray-900
    });
  });

  describe('Error States', () => {
    it('handles invalid change values gracefully', () => {
      const propsWithInvalidChange = {
        ...defaultProps,
        change: {
          value: NaN,
          type: 'increase' as const,
          period: '先月比',
        },
      };

      render(<StatsCard {...propsWithInvalidChange} />);
      
      // NaNの場合は変化情報を表示しない
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });
  });
});
```

### カスタムフックテスト

```typescript
// __tests__/hooks/useDashboardStats.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardStats } from '@/hooks/api/useDashboardStats';
import { apiClient } from '@/lib/api';

// APIクライアントをモック
jest.mock('@/lib/api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockApiClient.request.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(null);
  });

  it('returns data on successful fetch', async () => {
    const mockData = {
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

    mockApiClient.request.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles API errors correctly', async () => {
    const mockError = new Error('API Error');
    mockApiClient.request.mockRejectedValue(mockError);

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('caches data for 5 minutes', async () => {
    const mockData = { activeProjects: 12 };
    mockApiClient.request.mockResolvedValue({ data: mockData });

    const { result: result1 } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    // 同じフックを再度呼び出し
    const { result: result2 } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    // キャッシュから取得されるため、APIは1回のみ呼び出される
    expect(mockApiClient.request).toHaveBeenCalledTimes(1);
    expect(result2.current.data).toEqual(mockData);
  });
});
```

### ユーティリティ関数テスト

```typescript
// __tests__/utils/date.test.ts
import {
  formatDate,
  formatRelativeTime,
  isValidDate,
  calculateDaysUntilDeadline,
} from '@/utils/date';

describe('date utilities', () => {
  describe('formatDate', () => {
    it('formats date in Japanese locale', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toBe('2024年1月15日');
    });

    it('handles invalid dates', () => {
      const invalidDate = new Date('invalid');
      const formatted = formatDate(invalidDate);
      
      expect(formatted).toBe('Invalid Date');
    });

    it('formats with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date, 'yyyy/MM/dd');
      
      expect(formatted).toBe('2024/01/15');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // 固定時刻でテスト
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('formats recent time correctly', () => {
      const recentDate = new Date('2024-01-15T10:25:00Z'); // 5分前
      const formatted = formatRelativeTime(recentDate);
      
      expect(formatted).toBe('5分前');
    });

    it('formats days correctly', () => {
      const yesterday = new Date('2024-01-14T10:30:00Z');
      const formatted = formatRelativeTime(yesterday);
      
      expect(formatted).toBe('1日前');
    });

    it('formats future dates correctly', () => {
      const tomorrow = new Date('2024-01-16T10:30:00Z');
      const formatted = formatRelativeTime(tomorrow);
      
      expect(formatted).toBe('1日後');
    });
  });

  describe('isValidDate', () => {
    it('returns true for valid dates', () => {
      const validDate = new Date('2024-01-15');
      expect(isValidDate(validDate)).toBe(true);
    });

    it('returns false for invalid dates', () => {
      const invalidDate = new Date('invalid');
      expect(isValidDate(invalidDate)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe('calculateDaysUntilDeadline', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calculates days until future deadline', () => {
      const deadline = new Date('2024-01-20T23:59:59Z');
      const days = calculateDaysUntilDeadline(deadline);
      
      expect(days).toBe(5);
    });

    it('returns negative for past deadlines', () => {
      const pastDeadline = new Date('2024-01-10T23:59:59Z');
      const days = calculateDaysUntilDeadline(pastDeadline);
      
      expect(days).toBe(-5);
    });

    it('returns 0 for today deadline', () => {
      const todayDeadline = new Date('2024-01-15T23:59:59Z');
      const days = calculateDaysUntilDeadline(todayDeadline);
      
      expect(days).toBe(0);
    });
  });
});
```

## Integration Tests（統合テスト）

### コンポーネント統合テスト

```typescript
// __tests__/integration/ProjectManagement.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectList } from '@/components/projects/ProjectList';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Project Management Integration', () => {
  const mockProjects = [
    global.testUtils.createMockProject({
      id: 'project-1',
      title: 'プロジェクト1',
      status: 'active',
    }),
    global.testUtils.createMockProject({
      id: 'project-2',
      title: 'プロジェクト2',
      status: 'completed',
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays project list and handles interactions', async () => {
    // APIモックの設定
    mockApiClient.request
      .mockResolvedValueOnce({
        data: mockProjects,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      })
      .mockResolvedValueOnce({ data: { id: 'new-project' } }); // 作成API

    const user = userEvent.setup();

    render(<ProjectList />, { wrapper: createTestWrapper() });

    // ローディング状態の確認
    expect(screen.getByTestId('project-list-loading')).toBeInTheDocument();

    // データ表示の確認
    await waitFor(() => {
      expect(screen.getByText('プロジェクト1')).toBeInTheDocument();
      expect(screen.getByText('プロジェクト2')).toBeInTheDocument();
    });

    // フィルタリング機能のテスト
    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    await user.selectOptions(statusFilter, 'active');

    await waitFor(() => {
      expect(screen.getByText('プロジェクト1')).toBeInTheDocument();
      expect(screen.queryByText('プロジェクト2')).not.toBeInTheDocument();
    });

    // プロジェクト作成のテスト
    const createButton = screen.getByRole('button', { name: /create project/i });
    await user.click(createButton);

    // モーダルが開く
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // フォーム入力
    await user.type(screen.getByLabelText(/title/i), '新しいプロジェクト');
    await user.type(screen.getByLabelText(/description/i), 'プロジェクトの説明');

    // 送信
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // API呼び出しの確認
    await waitFor(() => {
      expect(mockApiClient.request).toHaveBeenCalledWith(
        '/projects',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('新しいプロジェクト'),
        })
      );
    });
  });

  it('handles error states correctly', async () => {
    // API エラーのモック
    mockApiClient.request.mockRejectedValue(new Error('Network Error'));

    render(<ProjectList />, { wrapper: createTestWrapper() });

    // エラー状態の確認
    await waitFor(() => {
      expect(screen.getByText(/error loading projects/i)).toBeInTheDocument();
    });

    // リトライボタンのテスト
    const retryButton = screen.getByRole('button', { name: /retry/i });
    
    // 成功レスポンスに変更
    mockApiClient.request.mockResolvedValue({
      data: mockProjects,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    const user = userEvent.setup();
    await user.click(retryButton);

    // データが表示される
    await waitFor(() => {
      expect(screen.getByText('プロジェクト1')).toBeInTheDocument();
    });
  });
});
```

### API統合テスト

```typescript
// __tests__/integration/api/dashboard.test.ts
import { apiClient } from '@/lib/api';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/dashboard/stats', (req, res, ctx) => {
    return res(
      ctx.json({
        data: {
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
        },
      })
    );
  }),

  rest.get('/api/projects', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const page = req.url.searchParams.get('page') || '1';
    
    const allProjects = [
      { id: '1', title: 'Project 1', status: 'active' },
      { id: '2', title: 'Project 2', status: 'completed' },
    ];

    const filteredProjects = status
      ? allProjects.filter(p => p.status === status)
      : allProjects;

    return res(
      ctx.json({
        data: filteredProjects,
        pagination: {
          page: parseInt(page),
          limit: 10,
          total: filteredProjects.length,
          totalPages: Math.ceil(filteredProjects.length / 10),
        },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Dashboard API Integration', () => {
  it('fetches dashboard stats successfully', async () => {
    const response = await apiClient.request('/dashboard/stats');
    
    expect(response.data.activeProjects).toBe(12);
    expect(response.data.totalMessages).toBe(45);
    expect(response.data.trends.projects.change).toBe(8.2);
  });

  it('fetches projects with filtering', async () => {
    const response = await apiClient.request('/projects?status=active');
    
    expect(response.data).toHaveLength(1);
    expect(response.data[0].status).toBe('active');
    expect(response.pagination.total).toBe(1);
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/dashboard/stats', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );

    await expect(apiClient.request('/dashboard/stats')).rejects.toThrow();
  });

  it('handles authentication errors', async () => {
    server.use(
      rest.get('/api/dashboard/stats', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
      })
    );

    await expect(apiClient.request('/dashboard/stats')).rejects.toThrow();
  });
});
```

## E2E Tests（End-to-End テスト）

### Playwright設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### クリティカルパステスト

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('/auth/login');
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');
    
    // ダッシュボードページの表示確認
    await expect(page).toHaveURL('/dashboard');
  });

  test('displays dashboard stats correctly', async ({ page }) => {
    // 統計カードの表示確認
    await expect(page.locator('[data-testid=stats-card]')).toHaveCount(4);
    
    // 各統計カードの内容確認
    await expect(page.locator('[data-testid=active-projects-stat]')).toBeVisible();
    await expect(page.locator('[data-testid=total-messages-stat]')).toBeVisible();
    await expect(page.locator('[data-testid=matching-score-stat]')).toBeVisible();
    await expect(page.locator('[data-testid=earnings-stat]')).toBeVisible();
  });

  test('navigates to projects page', async ({ page }) => {
    // サイドバーのプロジェクトリンクをクリック
    await page.click('[data-testid=sidebar-projects-link]');
    
    // プロジェクトページに移動
    await expect(page).toHaveURL('/dashboard/projects');
    await expect(page.locator('h1')).toContainText('プロジェクト一覧');
  });

  test('creates new project successfully', async ({ page }) => {
    // プロジェクト作成ボタンをクリック
    await page.click('[data-testid=create-project-button]');
    
    // モーダルが開く
    await expect(page.locator('[role=dialog]')).toBeVisible();
    
    // フォーム入力
    await page.fill('[data-testid=project-title-input]', 'E2Eテストプロジェクト');
    await page.fill('[data-testid=project-description-input]', 'E2Eテスト用のプロジェクト説明');
    await page.selectOption('[data-testid=project-category-select]', 'Live2D');
    await page.fill('[data-testid=project-budget-input]', '50000');
    await page.fill('[data-testid=project-deadline-input]', '2024-12-31');
    
    // 送信
    await page.click('[data-testid=submit-project-button]');
    
    // 成功メッセージの確認
    await expect(page.locator('[data-testid=success-notification]')).toBeVisible();
    await expect(page.locator('[data-testid=success-notification]')).toContainText('プロジェクトが作成されました');
    
    // プロジェクト一覧に新しいプロジェクトが表示される
    await expect(page.locator('[data-testid=project-card]')).toContainText('E2Eテストプロジェクト');
  });

  test('handles responsive navigation', async ({ page }) => {
    // モバイルビューサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ハンバーガーメニューボタンが表示される
    await expect(page.locator('[data-testid=mobile-menu-button]')).toBeVisible();
    
    // ハンバーガーメニューをクリック
    await page.click('[data-testid=mobile-menu-button]');
    
    // モバイルナビゲーションが開く
    await expect(page.locator('[data-testid=mobile-navigation]')).toBeVisible();
    
    // ナビゲーションリンクが表示される
    await expect(page.locator('[data-testid=mobile-nav-projects]')).toBeVisible();
    await expect(page.locator('[data-testid=mobile-nav-messages]')).toBeVisible();
  });

  test('performs search functionality', async ({ page }) => {
    // プロジェクトページに移動
    await page.goto('/dashboard/projects');
    
    // 検索ボックスに入力
    await page.fill('[data-testid=project-search-input]', 'Live2D');
    
    // 検索実行（Enterキー）
    await page.press('[data-testid=project-search-input]', 'Enter');
    
    // 検索結果の確認
    await expect(page.locator('[data-testid=project-card]')).toHaveCount(2);
    await expect(page.locator('[data-testid=search-results-count]')).toContainText('2件');
    
    // 検索結果にLive2Dが含まれることを確認
    const projectCards = page.locator('[data-testid=project-card]');
    await expect(projectCards.first()).toContainText('Live2D');
  });
});
```

### アクセシビリティテスト

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('dashboard page meets WCAG standards', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tabキーでナビゲーション
    await page.keyboard.press('Tab');
    
    // 最初のフォーカス可能要素（スキップリンクまたはメインナビ）
    let focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // サイドバーナビゲーションをキーボードで操作
    await page.keyboard.press('Tab');
    focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('role', 'link');
    
    // Enterキーでリンクを実行
    await page.keyboard.press('Enter');
    
    // ページ遷移の確認
    await expect(page).toHaveURL(/\/dashboard\//);
  });

  test('screen reader support', async ({ page }) => {
    await page.goto('/dashboard');
    
    // ARIA ラベルの確認
    const statsCards = page.locator('[data-testid=stats-card]');
    const firstCard = statsCards.first();
    
    await expect(firstCard).toHaveAttribute('aria-label');
    await expect(firstCard).toHaveAttribute('role', 'button');
    
    // ランドマークの確認
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // 見出し構造の確認
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toHaveText(/ダッシュボード/);
  });

  test('color contrast compliance', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // カラーコントラストの違反がないことを確認
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(colorContrastViolations).toEqual([]);
  });
});
```

## Visual Regression Testing

### Chromatic設定

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### ストーリー例

```typescript
// src/components/dashboard/widgets/StatsCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { FolderIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { StatsCard } from './StatsCard';

const meta: Meta<typeof StatsCard> = {
  title: 'Dashboard/Widgets/StatsCard',
  component: StatsCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'アクティブプロジェクト',
    value: 12,
    icon: FolderIcon,
  },
};

export const WithIncrease: Story = {
  args: {
    title: 'アクティブプロジェクト',
    value: 12,
    change: {
      value: 8.2,
      type: 'increase',
      period: '先月比',
    },
    icon: FolderIcon,
  },
};

export const WithDecrease: Story = {
  args: {
    title: 'メッセージ数',
    value: 45,
    change: {
      value: -5.1,
      type: 'decrease',
      period: '先月比',
    },
    icon: ChatBubbleLeftIcon,
  },
};

export const Loading: Story = {
  args: {
    title: 'アクティブプロジェクト',
    value: 12,
    icon: FolderIcon,
    loading: true,
  },
};

export const Clickable: Story = {
  args: {
    title: 'アクティブプロジェクト',
    value: 12,
    icon: FolderIcon,
    onClick: () => alert('Card clicked!'),
  },
};

// レスポンシブテスト用
export const Mobile: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
```

## Performance Testing

### Web Vitals監視

```typescript
// __tests__/performance/webVitals.test.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('dashboard page meets Core Web Vitals', async ({ page }) => {
    // パフォーマンス監視の開始
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    // Web Vitalsメトリクスの取得
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            vitals.lcp = entries[entries.length - 1].startTime;
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID (First Input Delay) - シミュレーション
        vitals.fid = 0; // 自動テストでは実際の測定困難
        
        // CLS (Cumulative Layout Shift)
        new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          vitals.cls = cls;
        }).observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => resolve(vitals), 3000);
      });
    });
    
    // Core Web Vitals閾値の検証
    expect(vitals.lcp).toBeLessThan(2500); // 2.5秒以下
    expect(vitals.cls).toBeLessThan(0.1);  // 0.1以下
  });

  test('bundle size is within limits', async ({ page }) => {
    const response = await page.goto('/dashboard');
    
    // JavaScriptバンドルサイズの確認
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((r: any) => r.name.includes('.js'))
        .map((r: any) => ({
          name: r.name,
          size: r.transferSize,
        }));
    });
    
    const totalJSSize = resources.reduce((sum, r) => sum + r.size, 0);
    
    // 合計JavaScriptサイズが500KB以下であることを確認
    expect(totalJSSize).toBeLessThan(500 * 1024);
  });

  test('image optimization works correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 画像の最適化確認
    const images = await page.evaluate(() => {
      return Array.from(document.images).map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.offsetWidth,
        displayHeight: img.offsetHeight,
      }));
    });
    
    // 画像のサイズが適切であることを確認
    for (const img of images) {
      const widthRatio = img.naturalWidth / img.displayWidth;
      const heightRatio = img.naturalHeight / img.displayHeight;
      
      // 2倍以上のサイズの画像がないことを確認
      expect(widthRatio).toBeLessThan(2);
      expect(heightRatio).toBeLessThan(2);
    }
  });
});
```

## CI/CD パイプライン

### GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload E2E artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  visual-regression:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build-storybook
```

## テスト実行スクリプト

```json
// package.json (scripts部分)
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathIgnorePatterns=integration e2e",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "build-storybook": "storybook build",
    "storybook": "storybook dev -p 6006",
    "chromatic": "npx chromatic"
  }
}
```

このテスト戦略により、VRidge Creator ダッシュボードの品質を多角的に保証し、継続的な改善を実現します。
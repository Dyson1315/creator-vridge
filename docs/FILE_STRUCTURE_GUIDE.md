# ファイル構造ガイド

## 概要

VRidge Creator ダッシュボードプロジェクトのファイル構造とディレクトリ組織の標準化ガイドです。保守性、拡張性、チーム開発の効率性を重視した構造を定義します。

## プロジェクト全体構造

```
creator-vridge/
├── frontend/                    # フロントエンドアプリケーション
│   ├── src/
│   ├── public/
│   ├── docs/                   # フロントエンド専用ドキュメント
│   ├── __tests__/              # テストファイル
│   ├── .env.local              # 環境変数
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/                     # バックエンドAPI
├── docs/                       # プロジェクト全体ドキュメント
│   ├── DASHBOARD_IMPLEMENTATION_GUIDE.md
│   ├── COMPONENT_SPECIFICATIONS.md
│   ├── API_INTEGRATION_SPEC.md
│   ├── FILE_STRUCTURE_GUIDE.md
│   ├── CODING_STANDARDS.md
│   └── TESTING_STRATEGY.md
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

## フロントエンド詳細構造

### src/ ディレクトリ

```
frontend/src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 認証関連のルートグループ
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/              # ダッシュボード関連ページ
│   │   ├── layout.tsx          # ダッシュボード専用レイアウト
│   │   ├── page.tsx            # メインダッシュボード
│   │   ├── projects/
│   │   │   ├── page.tsx        # プロジェクト一覧
│   │   │   ├── create/
│   │   │   │   └── page.tsx    # プロジェクト作成
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # プロジェクト詳細
│   │   │       └── edit/
│   │   │           └── page.tsx # プロジェクト編集
│   │   ├── messages/
│   │   │   ├── page.tsx        # メッセージ一覧
│   │   │   └── [threadId]/
│   │   │       └── page.tsx    # メッセージスレッド
│   │   ├── matching/
│   │   │   ├── page.tsx        # マッチング画面
│   │   │   └── recommendations/
│   │   │       └── page.tsx    # おすすめ表示
│   │   ├── analytics/
│   │   │   └── page.tsx        # アナリティクス
│   │   └── settings/
│   │       ├── page.tsx        # 設定トップ
│   │       ├── profile/
│   │       │   └── page.tsx    # プロフィール設定
│   │       ├── notifications/
│   │       │   └── page.tsx    # 通知設定
│   │       └── security/
│   │           └── page.tsx    # セキュリティ設定
│   ├── api/                    # API Routes（必要に応じて）
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   ├── globals.css             # グローバルスタイル
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # ホームページ
│   ├── loading.tsx             # グローバルローディング
│   ├── error.tsx               # グローバルエラー
│   └── not-found.tsx           # 404ページ
├── components/                 # 再利用可能コンポーネント
│   ├── ui/                     # 基本UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Progress.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Tabs.tsx
│   │   └── index.ts            # 一括エクスポート
│   ├── forms/                  # フォーム関連コンポーネント
│   │   ├── FormField.tsx
│   │   ├── ValidationError.tsx
│   │   ├── FileUpload.tsx
│   │   ├── DatePicker.tsx
│   │   └── RichTextEditor.tsx
│   ├── layout/                 # レイアウト関連
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── Breadcrumb.tsx
│   ├── dashboard/              # ダッシュボード専用コンポーネント
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── TopBar.tsx
│   │   ├── widgets/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ProjectWidget.tsx
│   │   │   ├── MessageWidget.tsx
│   │   │   ├── AnalyticsWidget.tsx
│   │   │   ├── MatchingRecommendations.tsx
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── QuickActions.tsx
│   │   │   ├── NotificationBar.tsx
│   │   │   ├── UserProfileSummary.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── SearchBar.tsx
│   │   └── charts/
│   │       ├── LineChart.tsx
│   │       ├── BarChart.tsx
│   │       ├── DonutChart.tsx
│   │       ├── AreaChart.tsx
│   │       └── ChartContainer.tsx
│   ├── auth/                   # 認証関連コンポーネント
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── PasswordReset.tsx
│   │   └── AuthGuard.tsx
│   ├── projects/               # プロジェクト関連
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── ProjectStatus.tsx
│   │   └── ProjectTimeline.tsx
│   ├── messages/               # メッセージ関連
│   │   ├── MessageThread.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageAttachment.tsx
│   │   └── ThreadList.tsx
│   ├── matching/               # マッチング関連
│   │   ├── CandidateCard.tsx
│   │   ├── MatchingFilters.tsx
│   │   ├── SkillTag.tsx
│   │   └── RatingDisplay.tsx
│   └── common/                 # 汎用コンポーネント
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── EmptyState.tsx
│       ├── ConfirmDialog.tsx
│       └── InfiniteScroll.tsx
├── hooks/                      # カスタムフック
│   ├── api/                    # API関連フック
│   │   ├── useDashboard.ts
│   │   ├── useProjects.ts
│   │   ├── useMessages.ts
│   │   ├── useMatching.ts
│   │   ├── useAnalytics.ts
│   │   └── useNotifications.ts
│   ├── ui/                     # UI関連フック
│   │   ├── useModal.ts
│   │   ├── useToast.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useClickOutside.ts
│   │   └── useMediaQuery.ts
│   ├── utils/                  # ユーティリティフック
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   ├── useWebSocket.ts
│   │   ├── useInfiniteScroll.ts
│   │   ├── useVirtualList.ts
│   │   └── useErrorHandler.ts
│   └── index.ts                # 一括エクスポート
├── lib/                        # ライブラリ・ユーティリティ
│   ├── api.ts                  # APIクライアント
│   ├── auth.ts                 # 認証ユーティリティ
│   ├── utils.ts                # 汎用ユーティリティ
│   ├── constants.ts            # 定数定義
│   ├── config.ts               # 設定管理
│   ├── validation.ts           # バリデーション関数
│   ├── queryKeys.ts            # React Query キー
│   ├── websocket.ts            # WebSocket管理
│   └── storage.ts              # ストレージ管理
├── store/                      # 状態管理（Zustand）
│   ├── auth.ts                 # 認証状態
│   ├── dashboard.ts            # ダッシュボード状態
│   ├── notifications.ts        # 通知状態
│   ├── ui.ts                   # UI状態（モーダル、サイドバーなど）
│   ├── projects.ts             # プロジェクト状態
│   ├── messages.ts             # メッセージ状態
│   └── index.ts                # ストア統合
├── types/                      # TypeScript型定義
│   ├── api.ts                  # API関連型
│   ├── auth.ts                 # 認証関連型
│   ├── dashboard.ts            # ダッシュボード関連型
│   ├── projects.ts             # プロジェクト関連型
│   ├── messages.ts             # メッセージ関連型
│   ├── matching.ts             # マッチング関連型
│   ├── analytics.ts            # アナリティクス関連型
│   ├── ui.ts                   # UI関連型
│   ├── common.ts               # 共通型
│   └── index.ts                # 型の一括エクスポート
├── styles/                     # スタイル関連
│   ├── globals.css             # グローバルスタイル
│   ├── components.css          # コンポーネント専用スタイル
│   └── utilities.css           # ユーティリティクラス
└── utils/                      # ヘルパー関数
    ├── date.ts                 # 日付関連
    ├── format.ts               # フォーマット関連
    ├── validation.ts           # バリデーション
    ├── string.ts               # 文字列操作
    ├── array.ts                # 配列操作
    ├── object.ts               # オブジェクト操作
    └── browser.ts              # ブラウザ関連
```

## ファイル命名規則

### コンポーネント

```typescript
// PascalCase for components
Components: PascalCase
├── DashboardLayout.tsx         ✅ 正
├── dashboardLayout.tsx         ❌ 誤
├── dashboard-layout.tsx        ❌ 誤
└── DASHBOARD_LAYOUT.tsx        ❌ 誤

// Index files for re-exports
├── index.ts                    ✅ 正（再エクスポート用）
├── index.tsx                   ❌ 誤（コンポーネント以外）
```

### フック・ユーティリティ

```typescript
// camelCase for hooks and utilities
Hooks: camelCase with 'use' prefix
├── useDashboard.ts             ✅ 正
├── UseDashboard.ts             ❌ 誤
├── use-dashboard.ts            ❌ 誤
└── dashboard.ts                ❌ 誤（useプレフィックス必須）

Utilities: camelCase
├── dateUtils.ts                ✅ 正
├── DateUtils.ts                ❌ 誤
├── date-utils.ts               ❌ 誤
└── date_utils.ts               ❌ 誤
```

### ページ・レイアウト

```typescript
// Next.js App Router conventions
Pages: lowercase
├── page.tsx                    ✅ 正
├── layout.tsx                  ✅ 正
├── loading.tsx                 ✅ 正
├── error.tsx                   ✅ 正
├── not-found.tsx               ✅ 正
├── Page.tsx                    ❌ 誤
└── index.tsx                   ❌ 誤（App Routerでは不要）
```

### ディレクトリ

```typescript
// lowercase with hyphens for multi-word
Directories: lowercase, hyphens for multi-word
├── dashboard/                  ✅ 正
├── message-threads/            ✅ 正
├── user-settings/              ✅ 正
├── Dashboard/                  ❌ 誤
├── messageThreads/             ❌ 誤
└── user_settings/              ❌ 誤
```

## インポート・エクスポート規則

### インポート順序

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';

// 3. Internal components (absolute imports)
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// 4. Internal hooks
import { useDashboard } from '@/hooks/api/useDashboard';
import { useAuth } from '@/hooks/utils/useAuth';

// 5. Internal utilities
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

// 6. Types (separate import)
import type { DashboardStats } from '@/types/dashboard';
import type { ComponentProps } from 'react';

// 7. Relative imports (last)
import './DashboardLayout.css';
```

### エクスポート規則

```typescript
// Named exports preferred
export const DashboardLayout = ({ children }: Props) => {
  // component implementation
};

export default DashboardLayout; // ページコンポーネントのみ

// Index files for re-exports
// components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
```

## 設定ファイル構造

### TypeScript設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

### Tailwind設定

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // カスタムテーマ設定
    },
  },
  plugins: [],
};
```

### ESLint設定

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "pathGroups": [
          {
            "pattern": "@/**",
            "group": "internal"
          }
        ]
      }
    ]
  }
}
```

## テストファイル構造

```
__tests__/
├── components/                 # コンポーネントテスト
│   ├── ui/
│   │   ├── Button.test.tsx
│   │   └── Card.test.tsx
│   └── dashboard/
│       ├── DashboardLayout.test.tsx
│       └── StatsCard.test.tsx
├── hooks/                      # フックテスト
│   ├── useDashboard.test.ts
│   └── useAuth.test.ts
├── utils/                      # ユーティリティテスト
│   ├── date.test.ts
│   └── validation.test.ts
├── pages/                      # ページテスト（E2E）
│   ├── dashboard.test.tsx
│   └── login.test.tsx
├── mocks/                      # モックデータ
│   ├── api.ts
│   ├── components.tsx
│   └── handlers.ts
├── fixtures/                   # テストデータ
│   ├── users.ts
│   ├── projects.ts
│   └── messages.ts
└── setup/                      # テスト設定
    ├── jest.config.js
    ├── setupTests.ts
    └── testUtils.tsx
```

## 静的ファイル構造

```
public/
├── images/                     # 画像ファイル
│   ├── icons/
│   │   ├── logo.svg
│   │   ├── favicon.ico
│   │   └── apple-touch-icon.png
│   ├── avatars/
│   │   └── default-avatar.png
│   ├── illustrations/
│   │   ├── empty-state.svg
│   │   └── error-404.svg
│   └── backgrounds/
│       └── dashboard-bg.jpg
├── fonts/                      # フォントファイル
│   ├── inter-var.woff2
│   └── noto-sans-jp.woff2
├── docs/                       # 公開ドキュメント
│   └── api-reference.html
└── manifest.json               # PWA manifest
```

## 環境設定ファイル

```
# 環境変数ファイル
├── .env                        # デフォルト環境変数
├── .env.local                  # ローカル環境（git無視）
├── .env.development           # 開発環境
├── .env.staging              # ステージング環境
└── .env.production           # 本番環境

# Git設定
├── .gitignore                # Git無視ファイル
└── .gitattributes           # Git属性設定

# 開発ツール設定
├── .vscode/                  # VS Code設定
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
├── .prettierrc              # Prettier設定
├── .prettierignore         # Prettier無視ファイル
├── .eslintrc.json          # ESLint設定
└── .eslintignore           # ESLint無視ファイル
```

## ドキュメント構造

```
docs/
├── development/                # 開発ドキュメント
│   ├── SETUP.md               # セットアップガイド
│   ├── CONTRIBUTING.md        # コントリビューションガイド
│   ├── DEPLOYMENT.md          # デプロイガイド
│   └── TROUBLESHOOTING.md     # トラブルシューティング
├── design/                     # デザインドキュメント
│   ├── DESIGN_SYSTEM.md       # デザインシステム
│   ├── UI_GUIDELINES.md       # UIガイドライン
│   └── ACCESSIBILITY.md       # アクセシビリティガイド
├── api/                       # API仕様
│   ├── README.md              # API概要
│   ├── authentication.md     # 認証仕様
│   ├── dashboard.md          # ダッシュボードAPI
│   └── projects.md           # プロジェクトAPI
└── architecture/              # アーキテクチャ
    ├── OVERVIEW.md           # システム概要
    ├── SECURITY.md           # セキュリティ設計
    └── PERFORMANCE.md        # パフォーマンス最適化
```

## ベストプラクティス

### 1. ファイル分割指針

```typescript
// ✅ 適切な分割
// components/dashboard/widgets/StatsCard.tsx (100行)
// components/dashboard/widgets/StatsCard.styles.ts (20行)
// components/dashboard/widgets/StatsCard.test.tsx (50行)

// ❌ 不適切（1ファイルが大きすぎ）
// components/dashboard/widgets/StatsCard.tsx (500行)
```

### 2. 依存関係の管理

```typescript
// ✅ 適切な依存関係
components/ui/Button.tsx          // 依存なし
components/dashboard/StatsCard.tsx // Button に依存
pages/dashboard/page.tsx          // StatsCard に依存

// ❌ 循環依存
components/A.tsx → components/B.tsx → components/A.tsx
```

### 3. パフォーマンス考慮

```typescript
// ✅ 動的インポート（重いコンポーネント）
const AnalyticsChart = dynamic(() => import('@/components/charts/AnalyticsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

// ✅ 適切なコード分割
const DashboardPage = lazy(() => import('./DashboardPage'));
const ProjectsPage = lazy(() => import('./ProjectsPage'));
```

### 4. メンテナビリティ

```typescript
// ✅ 明確なファイル責任
// StatsCard.tsx - 統計カード表示のみ
// StatsCard.hooks.ts - データフェッチロジック
// StatsCard.utils.ts - 計算・フォーマット関数
// StatsCard.types.ts - 型定義

// ❌ 責任が混在
// StatsCard.tsx - 表示+ロジック+型定義+スタイル
```

## 移行・リファクタリング指針

### 既存ファイルの整理

1. **段階的移行**
   - 新機能は新構造で実装
   - 既存機能は修正時に移行
   - レガシーコードは別ディレクトリで管理

2. **互換性維持**
   - エイリアスを使用した段階的移行
   - 既存のインポートパスを保持
   - 適切な移行期間の設定

3. **ドキュメント更新**
   - 移行状況の追跡
   - 新旧構造の対応表作成
   - チーム共有とレビュー実施
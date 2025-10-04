# CreatorVridge - VTuber×絵師マッチングプラットフォーム

VTuberと絵師を効率的にマッチングする特化型プラットフォーム。AI推薦システムによる高精度なマッチングと安全で信頼性の高い環境での創造的コラボレーションを実現します。

## 🚀 特徴

- **🤖 AI推薦システム**: ハイブリッド推薦（協調フィルタリング + コンテンツベース）による高精度な作品・絵師推薦
- **🔄 ランダム表示機能**: 大量推薦リストからランダム6個を表示し、更新ボタンで異なる組み合わせを表示
- **🛡️ 強化されたセキュリティ**: 包括的な入力検証、SQLインジェクション対策、監査ログ
- **⚡ 高パフォーマンス**: 非同期処理による高速レスポンス（推薦生成：3ms以下）
- **🎨 作品分析**: AI分析データに基づく詳細な作品特徴分析とスコアリング
- **📊 行動ログ分析**: ユーザー行動を学習した個人化推薦

## 📋 実装状況

### ✅ 完了済み機能

- **🔐 認証システム** - JWT認証、ログイン/登録フォーム、セッション管理
- **👤 ユーザーダッシュボード** - VTuber/Artist別の専用ダッシュボード
- **🤖 AI推薦エンジン** - ハイブリッド推薦システム（協調フィルタリング + コンテンツベース）
- **🎲 ランダム表示** - 大量リストからランダム6個選択・更新機能
- **📈 分析データ管理** - 作品特徴分析、ユーザープロファイル、類似度計算
- **🛡️ セキュリティ強化** - 包括的入力検証、レート制限、監査ログ
- **🎨 作品推薦** - リアルタイム推薦、フィードバック学習
- **📱 レスポンシブデザイン** - モバイルファースト設計

### 🚧 開発中機能

- **👥 絵師推薦** - 作品ベースの絵師マッチング機能
- **📊 詳細分析** - より深い行動分析とパーソナライゼーション

### 📝 予定機能

- **💬 メッセージング** - チャット、ファイル共有、通知
- **💰 支払いシステム** - エスクロー決済、請求書
- **📁 ポートフォリオ** - 作品ギャラリー、AI画像分析

## 🛠 技術スタック

### 🖥️ フロントエンド (Port 3000)

- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Zustand** - 状態管理
- **React Hook Form** - フォーム管理

### 🔧 バックエンド (Port 3002)

- **Node.js 20** - ランタイム
- **Express.js** - Webフレームワーク
- **TypeScript** - 型安全性
- **Prisma** - ORM
- **PostgreSQL 15** - データベース
- **JWT** - 認証
- **bcrypt** - パスワードハッシュ化
- **Helmet.js** - セキュリティヘッダー

### 🤖 AI推薦サービス (Port 8000)

- **Node.js** - ランタイム
- **Express.js** - APIフレームワーク
- **TypeScript** - 型安全性
- **協調フィルタリング** - ユーザーベース・アイテムベース
- **コンテンツベースフィルタリング** - 作品特徴分析
- **ハイブリッド推薦** - 重み付き統合アルゴリズム

### 🗄️ データベース

- **PostgreSQL 15** - メインデータベース
- **Prisma** - ORM・スキーマ管理
- **分析データファイル** - AI推薦用事前計算データ

### 🔧 開発・運用

- **Docker** - コンテナ化（将来対応）
- **npm workspaces** - モノリポ管理
- **ESLint & Prettier** - コード品質
- **TypeScript** - 型安全性

## 📋 前提条件

- **Node.js** 20以上
- **npm** 
- **PostgreSQL** 15以上
- **Git**

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone <https://github.com/your-org/creator-vridge.git>
cd creator-vridge
```

### 2. 依存関係のインストール

```bash
# ルートで全プロジェクトの依存関係をインストール
npm install
```

### 3. 環境変数の設定

```bash
# バックエンド環境変数をコピー・編集
cp apps/backend/.env.example apps/backend/.env

# フロントエンド環境変数をコピー・編集
cp apps/frontend/.env.local.example apps/frontend/.env.local

# AI推薦サービス環境変数をコピー・編集
cp apps/ai-service/.env.example apps/ai-service/.env
```

### 4. データベースセットアップ

```bash
# PostgreSQLを起動（ローカルまたはDocker）
# 接続情報を環境変数ファイルに設定

# データベースマイグレーション
cd apps/backend
npm run db:migrate

# シードデータ投入
npm run db:seed
```

### 5. 開発サーバー起動

```bash
# ルートディレクトリで全サービスを並行起動
npm run dev

# または個別起動:
# フロントエンド (Port 3000)
cd apps/frontend && npm run dev

# バックエンド (Port 3002) 
cd apps/backend && npm run dev

# AI推薦サービス (Port 8000)
cd apps/ai-service && npm run dev
```

### 6. アクセス

- **🖥️ フロントエンド**: <http://localhost:3000>
- **🔧 バックエンドAPI**: <http://localhost:3002>
- **🤖 AI推薦サービス**: <http://localhost:8000>
- **📊 Prisma Studio**: <http://localhost:5555> (npm run db:studio)

## 🧪 デモアカウント

開発環境では以下のデモアカウントが利用できます：

### VTuberユーザー

- **Email**: <vtuber1@demo.com>
- **Password**: Demo123!
- **表示名**: MimiKawa

### 絵師ユーザー

- **Email**: <artist1@demo.com>
- **Password**: Demo123!
- **表示名**: PixelMaster

## 🛠 開発ガイド

### ローカル開発環境でのセットアップ

#### バックエンドの個別起動

```bash
cd backend

# 依存関係のインストール
npm install

# データベースの起動（Docker）
docker-compose up postgres redis -d

# データベースマイグレーション
npm run db:migrate

# シードデータの投入
npm run db:seed

# 開発サーバーの起動
npm run dev
```

#### フロントエンドの個別起動

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### データベース管理

```bash
cd backend

# Prisma Studioの起動（データベースGUI）
npm run db:studio

# 新しいマイグレーションの作成
npx prisma migrate dev --name your-migration-name

# データベースのリセット
npx prisma migrate reset
```

## 🧪 テスト

### バックエンドテスト

```bash
cd backend

# 単体テストの実行
npm test

# テストカバレッジの確認
npm run test:coverage
```

### フロントエンドテスト

```bash
cd frontend

# テストの実行
npm test

# リンティング
npm run lint

# 型チェック
npm run type-check
```

## 📦 本番環境構築

### Docker Composeを使用した本番環境

```bash
# 本番イメージのビルド
docker-compose build

# 本番環境の起動
docker-compose up -d

# ヘルスチェック
curl <http://localhost:3000/health>
curl <http://localhost:3001/health>
```

## 🔒 セキュリティ

### 開発環境での注意点

- デフォルトのJWTシークレットは本番環境では使用しない
- データベースパスワードは強力なものに変更する
- 本番環境では適切な環境変数を設定する

### セキュリティ機能

- JWT認証
- パスワードハッシュ化（bcrypt）
- レート制限
- CORS設定
- セキュリティヘッダー（Helmet.js）

## 📚 API ドキュメント

### 主要エンドポイント

#### 認証

- `POST /api/v1/auth/register` - ユーザー登録
- `POST /api/v1/auth/login` - ログイン
- `GET /api/v1/auth/me` - 現在のユーザー情報
- `POST /api/v1/auth/refresh` - トークン更新

#### ユーザー管理

- `GET /api/v1/users/:id/profile` - ユーザープロフィール取得
- `PUT /api/v1/users/profile` - プロフィール更新
- `GET /api/v1/users/search` - ユーザー検索

#### マッチング

- `GET /api/v1/matches/suggestions` - マッチング提案
- `POST /api/v1/matches/request` - マッチングリクエスト
- `GET /api/v1/matches/my-matches` - 自分のマッチング一覧

## 🗂 プロジェクト構造

```text
creator-vridge/
├── apps/                        # アプリケーション
│   ├── frontend/               # Next.js フロントエンド (Port 3000)
│   │   ├── src/
│   │   │   ├── app/           # App Router ページ
│   │   │   ├── components/    # Reactコンポーネント
│   │   │   ├── lib/          # ユーティリティ・API
│   │   │   └── store/        # 状態管理（Zustand）
│   │   └── public/           # 静的ファイル
│   ├── backend/                # Node.js バックエンド (Port 3002)
│   │   ├── src/
│   │   │   ├── routes/       # APIルート
│   │   │   ├── middleware/   # Express ミドルウェア
│   │   │   ├── utils/        # ユーティリティ
│   │   │   └── types/        # TypeScript型定義
│   │   ├── prisma/           # データベーススキーマ・マイグレーション
│   │   └── uploads/          # ファイルアップロード先
│   └── ai-service/             # AI推薦サービス (Port 8000)
│       ├── src/
│       │   ├── services/     # 推薦アルゴリズム
│       │   ├── routes/       # AI API ルート
│       │   └── types/        # TypeScript型定義
│       ├── data/             # 分析データファイル
│       └── scripts/          # データ生成スクリプト
├── scripts/                    # 共通スクリプト
├── .claude/                    # Claude Code 設定
├── package.json               # ワークスペース設定
└── README.md
```

## 🏗️ アーキテクチャ

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  AI Service     │
│   (Port 3000)   │◄──►│   (Port 3002)   │◄──►│   (Port 8000)   │
│                 │    │                 │    │                 │
│ • Next.js       │    │ • Express.js    │    │ • 協調フィルタ   │
│ • TypeScript    │    │ • Prisma ORM    │    │ • コンテンツベース│
│ • Zustand       │    │ • JWT認証       │    │ • ハイブリッド   │
│ • Tailwind      │    │ • セキュリティ  │    │ • 分析データ    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   Database      │
                        │                 │
                        │ • ユーザーデータ │
                        │ • 作品データ    │
                        │ • 行動ログ      │
                        └─────────────────┘
```

## 🚦 開発フロー

### Git ブランチ戦略

- `main` - 本番環境用の安定版
- `develop` - 開発用のメインブランチ
- `feature/*` - 機能開発用ブランチ
- `hotfix/*` - 緊急修正用ブランチ

### コミット規約

```text
feat: 新機能の追加
fix: バグ修正
docs: ドキュメントの更新
style: コードスタイルの修正
refactor: リファクタリング
test: テストの追加・修正
chore: その他の変更
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 🆘 サポート

問題や質問がある場合は、[GitHub Issues](https://github.com/your-org/creator-vridge/issues) でお知らせください。

## 🔄 更新履歴

### v1.1.0 (2025-10-04)

- **🤖 AI推薦システム実装** - ハイブリッド推薦アルゴリズム
- **🎲 ランダム表示機能** - 大量推薦リストからランダム6個選択
- **🛡️ セキュリティ強化** - 包括的入力検証・監査ログ
- **📈 分析データ管理** - 事前計算データによる高速推薦
- **⚡ パフォーマンス最適化** - 非同期処理・レスポンス時間3ms以下

### v1.0.0 (2024-XX-XX)

- 初回リリース
- ユーザー認証・プロフィール管理
- 基本的なダッシュボード機能
- データベーススキーマ設計

---

**CreatorVridge** - VTuberと絵師の理想のマッチングを実現

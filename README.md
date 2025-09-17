# CreatorVridge - VTuber×絵師マッチングプラットフォーム

VTuber志望者と絵師を効率的にマッチングする特化型プラットフォーム。安全で信頼性の高い環境での創造的コラボレーションを実現します。

## 🚀 特徴

- **AI画像分析**: 高精度なAI画像分析による絵柄・色調の自動判定
- **安全な取引**: エスクロー決済システムによる代金の安全性確保
- **段階的情報開示**: 匿名性を保護しながら段階的に情報を開示
- **コミュニケーション支援**: AI攻撃的表現検出・言い換え提案機能
- **不安軽減UI**: 穏やかなカラーパレットと認知負荷最小化設計

## 🛠 技術スタック

### フロントエンド

- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **React Query** - データフェッチ
- **Zustand** - 状態管理
- **React Hook Form** - フォーム管理

### バックエンド

- **Node.js 20** - ランタイム
- **Express.js** - Webフレームワーク
- **TypeScript** - 型安全性
- **Prisma** - ORM
- **PostgreSQL 15** - データベース
- **Redis 7** - キャッシュ・セッション
- **JWT** - 認証

### インフラ

- **Docker** - コンテナ化
- **Docker Compose** - ローカル開発環境
- **GitHub Actions** - CI/CD
- **Cloudflare** - CDN・セキュリティ（本番環境）

## 📋 前提条件

- **Node.js** 20以上
- **npm** または **yarn**
- **Docker** と **Docker Compose**
- **Git**

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <https://github.com/your-org/creator-vridge.git>
cd creator-vridge
```

### 2. 環境変数の設定

```bash
# バックエンド環境変数をコピー
cp backend/.env.example backend/.env

# フロントエンド環境変数をコピー
cp frontend/.env.local.example frontend/.env.local
```

### 3. Docker Composeで開発環境を起動

```bash
# 開発環境の起動
docker-compose -f docker-compose.dev.yml up -d

# ログの確認
docker-compose -f docker-compose.dev.yml logs -f
```

### 4. アクセス

- **フロントエンド**: <http://localhost:3000>
- **バックエンドAPI**: <http://localhost:3001>
- **API Health Check**: <http://localhost:3001/health>

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
├── frontend/                 # Next.js フロントエンド
│   ├── src/
│   │   ├── app/             # App Router ページ
│   │   ├── components/      # Reactコンポーネント
│   │   ├── lib/            # ユーティリティ・API
│   │   └── store/          # 状態管理（Zustand）
│   ├── public/             # 静的ファイル
│   └── tailwind.config.ts  # Tailwind設定
├── backend/                  # Node.js バックエンド
│   ├── src/
│   │   ├── routes/         # APIルート
│   │   ├── middleware/     # Express ミドルウェア
│   │   ├── utils/          # ユーティリティ
│   │   └── types/          # TypeScript型定義
│   ├── prisma/             # データベーススキーマ・マイグレーション
│   └── uploads/            # ファイルアップロード先
├── .github/                  # GitHub Actions ワークフロー
├── docker-compose.yml        # 本番環境用
├── docker-compose.dev.yml    # 開発環境用
└── README.md
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

### v1.0.0 (2024-XX-XX)

- 初回リリース
- 基本的なマッチング機能
- ユーザー認証・プロフィール管理
- エスクロー決済システム

---

**CreatorVridge** - VTuber志望者と絵師の理想のマッチングを実現

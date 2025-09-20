# CreatorVridge 開発ガイド
*新規AIセッション用 開発継続マニュアル*

## 🚀 クイックスタート (新規セッション用)

### 1. 現状確認
```bash
cd /home/dyson/workspace/creator-vridge
pwd  # プロジェクトルート確認
```

### 2. 動作確認
```bash
# 開発環境起動
npm run dev

# 別ターミナルで動作確認
curl http://localhost:3001/health
# → データベース接続状況確認
```

### 3. アクセステスト
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:3001
- ログイン: artist1@demo.com / Demo123!

### 4. 進捗確認
```bash
git status  # ファイル状況確認
git log --oneline -5  # 最新コミット確認
```

## 📋 実装済み機能詳細

### 🔐 認証システム
**場所**: `backend/src/routes/auth.ts`
**機能**: 
- ユーザー登録 (`POST /api/v1/auth/register`)
- ログイン (`POST /api/v1/auth/login`)
- JWT認証・リフレッシュトークン

**テストアカウント**:
```javascript
// VTuberユーザー
{ email: "vtuber1@demo.com", password: "Demo123!", type: "VTUBER", name: "MimiKawa" }
{ email: "vtuber2@demo.com", password: "Demo123!", type: "VTUBER", name: "DragonStorm" }

// 絵師ユーザー
{ email: "artist1@demo.com", password: "Demo123!", type: "ARTIST", name: "PixelMaster" }
{ email: "artist2@demo.com", password: "Demo123!", type: "ARTIST", name: "DarkArtistX" }
```

### 🗄 データベース設計
**場所**: `backend/prisma/schema.prisma`
**主要モデル**:
- `User` - ユーザー基本情報
- `Profile` - プロフィール詳細
- `Match` - マッチング情報
- `Transaction` - 取引履歴
- `Message` - メッセージ (未実装)

**重要なリレーション**:
```sql
User (1) -> (1) Profile
User (1) -> (N) Match (as VTuber)
User (1) -> (N) Match (as Artist)
Match (1) -> (N) Transaction
```

### 🎨 フロントエンド構造
**場所**: `frontend/src/`
**主要コンポーネント**:
- `app/page.tsx` - ランディングページ
- `app/auth/login/page.tsx` - ログインページ
- `components/auth/LoginForm.tsx` - ログインフォーム
- `store/auth.ts` - 認証状態管理 (Zustand)

## 🎯 次期実装タスク詳細

### 🔴 最優先: GitHubプッシュ完了

**現状**: リポジトリ作成済み、コミット待ち
**実行手順**:
```bash
cd /home/dyson/workspace/creator-vridge
git status  # ファイル確認
git commit -m "feat: CreatorVridge initial implementation"
git push -u origin main
```

**完了確認**: https://github.com/Dyson1315/creator-vridge でファイル表示

### 🟡 高優先1: ダッシュボード実装

**目標**: ログイン後のメイン画面作成
**実装場所**: `frontend/src/app/dashboard/`
**必要なファイル**:
```
frontend/src/app/dashboard/
├── page.tsx              # メインダッシュボード
├── vtuber/
│   └── page.tsx          # VTuber専用ダッシュボード
└── artist/
    └── page.tsx          # 絵師専用ダッシュボード
```

**実装内容**:
1. **レイアウト**: ヘッダー・サイドバー・メインコンテンツ
2. **VTuberダッシュボード**:
   - マッチング提案一覧
   - 進行中のプロジェクト
   - プロフィール完成度
   - 最近のメッセージ

3. **絵師ダッシュボード**:
   - 新規依頼一覧
   - ポートフォリオ統計
   - 収益・評価サマリー
   - スケジュール管理

**技術仕様**:
- Next.js App Router使用
- Tailwind CSSでレスポンシブ対応
- Zustandで状態管理
- React QueryでAPI連携

### 🟡 高優先2: マッチング画面実装

**目標**: ユーザー検索・マッチング機能
**実装場所**: `frontend/src/app/matches/`
**API連携**: `backend/src/routes/matches.ts` (基盤あり)

**実装内容**:
1. **検索・フィルタ機能**:
   - スキル別フィルタ
   - 予算範囲指定
   - 評価・経験年数
   - 稼働状況 (Available/Busy)

2. **マッチング表示**:
   - カード形式のユーザー一覧
   - プロフィール画像・基本情報
   - マッチング度スコア表示
   - お気に入り・ブックマーク

3. **マッチングアクション**:
   - マッチングリクエスト送信
   - メッセージ送信
   - プロフィール詳細表示

### 🟢 中優先1: プロフィール編集

**目標**: 詳細プロフィール管理
**実装場所**: `frontend/src/app/profile/`
**API**: `backend/src/routes/users.ts`

**フォーム項目**:
- 基本情報 (表示名、自己紹介)
- スキル・タグ設定
- 料金設定 (最小〜最大)
- 稼働状況・タイムゾーン
- ポートフォリオURL
- 経験年数・実績

### 🟢 中優先2: メッセージング機能

**目標**: 1対1チャット機能
**新規実装**: `frontend/src/app/messages/`
**バックエンド**: `backend/src/routes/messages.ts` (新規作成)

**実装内容**:
1. **メッセージ一覧**: チャット相手リスト
2. **チャット画面**: リアルタイムメッセージ
3. **通知機能**: 新着メッセージ通知
4. **添付ファイル**: 画像・ファイル送信 (将来)

## 🛠 開発パターン・テンプレート

### 新規ページ作成パターン
```typescript
// frontend/src/app/new-page/page.tsx
'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth';

export default function NewPage() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <div>ログインが必要です</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">新規ページ</h1>
        {/* コンテンツ */}
      </div>
    </div>
  );
}
```

### 新規API作成パターン
```typescript
// backend/src/routes/new-api.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req, res) => {
  try {
    // 実装内容
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### コンポーネント作成パターン
```typescript
// frontend/src/components/ui/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  title: string;
  children: React.ReactNode;
}

export default function NewComponent({ title, children }: NewComponentProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
```

## 🔧 よく使用するコマンド

### 開発環境操作
```bash
# 開発サーバー起動
npm run dev

# 個別起動
npm run dev:backend   # バックエンドのみ
npm run dev:frontend  # フロントエンドのみ

# 依存関係管理
npm run install:all   # 全依存関係インストール
```

### データベース操作
```bash
cd backend

# Prisma Studio (データベースGUI)
npx prisma studio

# スキーマ変更後
npx prisma generate      # クライアント再生成
npx prisma migrate dev   # マイグレーション実行

# テストデータ再投入
npx prisma db seed

# データベースリセット
npx prisma migrate reset
```

### ビルド・テスト
```bash
# ビルド
npm run build
npm run build:backend
npm run build:frontend

# テスト実行
npm run test
npm run lint
```

## 🚨 トラブルシューティング

### よくある問題と解決法

#### 1. ポート競合エラー
```
Error: listen EADDRINUSE: address already in use :::3000
```
**解決法**:
```bash
# プロセス確認・終了
lsof -i :3000
kill -9 <PID>

# または
npx kill-port 3000
```

#### 2. TypeScript型エラー
```
TS2305: Module '"@prisma/client"' has no exported member 'UserType'
```
**解決法**:
```bash
cd backend
npx prisma generate
npm install
```

#### 3. データベース接続エラー
```
Can't reach database server at `localhost:5432`
```
**解決法**: SQLite使用中のため正常（PostgreSQL用エラー）
```bash
# 環境変数確認
cat backend/.env
# DATABASE_URL="file:./dev.db" になっているか確認
```

#### 4. ログイン失敗
```
Email or password is incorrect
```
**解決法**:
```bash
cd backend
npx prisma db seed  # テストデータ再投入
```

### デバッグ方法

#### バックエンドログ確認
```bash
# 開発サーバーログを確認
npm run dev:backend
# → ログイン試行やエラーが表示される
```

#### フロントエンドデバッグ
```bash
# ブラウザ開発者ツール
# Console → ネットワークタブでAPI通信確認
# Application → Local Storage で認証状態確認
```

#### データベース状態確認
```bash
cd backend
npx prisma studio
# → http://localhost:5555 でデータ確認
```

## 📝 開発ベストプラクティス

### コード品質
1. **TypeScript**: 厳密な型定義使用
2. **ESLint**: コード品質チェック
3. **Prettier**: コードフォーマット統一
4. **コミット**: 機能単位でのコミット

### セキュリティ
1. **認証**: JWT + httpOnly cookie
2. **バリデーション**: Joi スキーマ検証
3. **CORS**: 適切なオリジン設定
4. **SQL**: Prisma ORM使用（SQLインジェクション対策）

### パフォーマンス
1. **画像**: Next.js Image コンポーネント使用
2. **API**: React Query でキャッシュ管理
3. **バンドル**: 動的インポート活用
4. **データベース**: 適切なインデックス設定

---

**🎯 次回セッション推奨フロー**:
1. 📋 PROJECT_STATUS.md で現状確認
2. 🚀 `npm run dev` で動作確認
3. 🔍 Git状況確認・プッシュ完了
4. 💻 ダッシュボード実装開始
5. 📊 進捗をTodoWriteで記録
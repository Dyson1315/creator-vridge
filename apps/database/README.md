# CreatorVridge データベース管理

## 🚀 クイックスタート

### データベース確認
```bash
npm run db:check
```

### Prisma Studio起動（GUIでデータベース確認）
```bash
npm run db:studio
```
http://localhost:5555 でアクセス

### PostgreSQL直接接続
```bash
npm run db:psql
```
パスワードは`.env`ファイルに記載されています

## 📋 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `npm run db:check` | データベース状況確認 |
| `npm run db:studio` | Prisma Studio起動 |
| `npm run db:generate` | Prismaクライアント生成 |
| `npm run db:push` | スキーマをデータベースに反映 |
| `npm run db:seed` | テストデータ投入 |
| `npm run db:reset` | データベースリセット＋シード |
| `npm run db:migrate` | マイグレーション作成・実行 |
| `npm run db:backup` | データベースバックアップ |
| `npm run db:psql` | PostgreSQL直接接続 |

## 🔧 設定情報

- **Database**: `creator_vridge_db`
- **User**: `creator_user`
- **Host**: `localhost:5432`
- **Schema**: `prisma/schema.prisma`

## 📊 テーブル構成

### 基本テーブル
- `users` - ユーザー情報
- `profiles` - プロフィール情報
- `artworks` - 作品情報
- `user_likes` - いいね情報

### AI推薦システム
- `user_preference_profiles` - ユーザー嗜好プロファイル
- `artwork_analysis` - 作品分析結果
- `precomputed_recommendations` - 事前計算推薦結果

### その他
- `matches` - マッチング情報
- `messages` - メッセージ
- `contracts` - 契約情報
- `transactions` - 取引情報
- `behavior_logs` - 行動ログ
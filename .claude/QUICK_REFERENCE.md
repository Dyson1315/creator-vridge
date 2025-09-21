# CreatorVridge クイックリファレンス

## 🚀 即座にできること

### 開発環境起動
```bash
cd /home/dyson/workspace/creator-vridge
npm run dev
# フロントエンド: http://localhost:3000
# バックエンド: http://localhost:3001
```

### テストアカウント
- **VTuber**: `vtuber1@demo.com` / `Demo123!`
- **絵師**: `artist1@demo.com` / `Demo123!`

## 📋 現在の状況

- ✅ **基盤**: 完全動作 (認証・DB・UI)
- ✅ **推薦システム**: 基本実装完了 (作品・絵師・いいね機能)
- ✅ **最新マージ**: fix/recommendation-display (commit: ece5f77)
- 🚧 **現在**: 推薦システム本格実装中
- 🎯 **次期**: Phase1 データ基盤強化

## 🔥 最優先タスク

1. **推薦システムPhase1: データ基盤強化**
   - 作品データ拡張 (8件 → 50-100件)
   - ユーザー行動ログ強化
   - 絵師プロフィール充実

2. **データ収集改善**
   - 閲覧時間・スクロール深度追跡
   - 検索クエリ・ブックマーク機能
   - 詳細フィードバック収集

## 📂 重要ファイル

- **進捗**: `.claude/PROJECT_STATUS.md`
- **開発ガイド**: `.claude/DEVELOPMENT_GUIDE.md`
- **認証API**: `backend/src/routes/auth.ts`
- **推薦API**: `backend/src/routes/recommendations.ts`
- **DB設計**: `backend/prisma/schema.prisma`
- **DBシード**: `backend/prisma/seed.ts`
- **ダッシュボード**: `frontend/src/components/dashboard/vtuber/`

## 🛠 よく使うコマンド

```bash
# 開発環境
npm run dev              # 同時起動
npm run install:all      # 依存関係

# データベース
cd backend
npx prisma studio        # DB GUI
npx prisma db seed       # テストデータ

# Git
git status
git add .
git commit -m "message"
git push
```

## 🆘 トラブル時

- **ポート競合**: `npx kill-port 3000`
- **型エラー**: `npx prisma generate`
- **ログイン失敗**: `npx prisma db seed`
- **詳細**: `.claude/DEVELOPMENT_GUIDE.md` 参照

## 🎯 推薦システム状況

### ✅ 実装済み
- おすすめ作品・絵師表示
- いいね機能（♡ボタン）
- 基本推薦アルゴリズム（スタイル・カテゴリ・タグベース）
- エラーハンドリング・UI安定性

### 🚧 Phase1計画（データ基盤強化）
- 作品データ拡張（8→50-100件）
- ユーザー行動ログ強化
- 絵師プロフィール充実
- データ収集改善

---

**次回セッション開始時**: 推薦システムPhase1実装 → データ拡張 → 行動ログ強化
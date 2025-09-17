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

- ✅ **進捗**: 54% (14/26タスク完了)
- ✅ **基盤**: 完全動作 (認証・DB・UI)
- 🚧 **現在**: GitHubプッシュ待ち
- 🎯 **次期**: ダッシュボード実装

## 🔥 最優先タスク

1. **GitHubプッシュ完了**
   ```bash
   git commit -m "feat: CreatorVridge initial implementation"
   git push -u origin main
   ```

2. **ダッシュボード実装開始**
   - 場所: `frontend/src/app/dashboard/`
   - VTuber・絵師別UI作成

## 📂 重要ファイル

- **進捗**: `.claude/PROJECT_STATUS.md`
- **開発ガイド**: `.claude/DEVELOPMENT_GUIDE.md`
- **認証API**: `backend/src/routes/auth.ts`
- **DB設計**: `backend/prisma/schema.prisma`
- **フロントエンド**: `frontend/src/app/`

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

---

**次回セッション開始時**: PROJECT_STATUS.md → 動作確認 → GitHubプッシュ → ダッシュボード実装
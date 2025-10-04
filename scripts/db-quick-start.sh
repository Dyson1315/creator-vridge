#!/bin/bash

# CreatorVridge データベース クイックスタート
echo "🐘 CreatorVridge データベース管理"
echo "================================"

cd /home/dyson/workspace/creator-vridge/apps/database

echo "1. データベース確認"
echo "2. Prisma Studio起動"
echo "3. PostgreSQL直接接続"
echo "4. データベースリセット"
echo "5. 終了"

read -p "選択してください (1-5): " choice

case $choice in
  1)
    echo "📊 データベース状況確認中..."
    npm run db:check
    ;;
  2)
    echo "🎨 Prisma Studio起動中..."
    echo "ブラウザで http://localhost:5555 にアクセスしてください"
    npm run db:studio
    ;;
  3)
    echo "💻 PostgreSQL接続中..."
    echo "パスワードは.envファイルに記載されています"
    npm run db:psql
    ;;
  4)
    echo "🔄 データベースリセット中..."
    npm run db:reset
    ;;
  5)
    echo "👋 終了します"
    exit 0
    ;;
  *)
    echo "❌ 無効な選択です"
    exit 1
    ;;
esac
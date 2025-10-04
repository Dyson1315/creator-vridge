# Guidelines

This document defines the project's rules, objectives, and progress management methods. Please proceed with the project according to the following content.

## Top-Level Rules

- To maximize efficiency, **if you need to execute multiple independent processes, invoke those tools concurrently, not sequentially**.
- **You must think exclusively in English**. However, you are required to **respond in Japanese**.
- To understand how to use a library, **always use the Contex7 MCP** to retrieve the latest information.
- For temporary notes for design, create a markdown in `.tmp` and save it.
- **After using Write or Edit tools, ALWAYS verify the actual file contents using the Read tool**, regardless of what the system-reminder says. The system-reminder may incorrectly show "(no content)" even when the file has been successfully written.
- Please respond critically and without pandering to my opinions, but please don't be forceful in your criticism.

## Programming Rules

- Avoid hard-coding values unless absolutely necessary.
- Do not use `any` or `unknown` types in TypeScript.
- You must not use a TypeScript `class` unless it is absolutely necessary (e.g., extending the `Error` class for custom error handling that requires `instanceof` checks).

## Development Style - Specification-Driven Development

### Overview

When receiving development tasks, please follow the 5-stage workflow below. This ensures requirement clarification, structured design, comprehensive testing, and efficient implementation.

### 5-Stage Workflow

#### Stage 1: Requirements

- Analyze user requests and convert them into clear functional requirements
- Document requirements in `.tmp/requirements.md`
- Use `/requirements` command for detailed template

#### Stage 2: Design

- Create technical design based on requirements
- Document design in `.tmp/design.md`
- Use `/design` command for detailed template

#### Stage 3: Test Design

- Create comprehensive test specification based on design
- Document test cases in `.tmp/test_design.md`
- Use `/test-design` command for detailed template

#### Stage 4: Task List

- Break down design and test cases into implementable units
- Document in `.tmp/tasks.md`
- Use `/tasks` command for detailed template
- Manage major tasks with TodoWrite tool

#### Stage 5: Implementation

- Implement according to task list
- For each task:
  - Update task to in_progress using TodoWrite
  - Execute implementation and testing
  - Run lint and typecheck
  - Update task to completed using TodoWrite

### Workflow Commands

- `/spec` - Start the complete specification-driven development workflow
- `/requirements` - Execute Stage 1: Requirements only
- `/design` - Execute Stage 2: Design only (requires requirements)
- `/test-design` - Execute Stage 3: Test design only (requires design)
- `/tasks` - Execute Stage 4: Task breakdown only (requires design and test design)

### Important Notes

- Each stage depends on the deliverables of the previous stage
- Please obtain user confirmation before proceeding to the next stage
- Always use this workflow for complex tasks or new feature development
- Simple fixes or clear bug fixes can be implemented directly

# CreatorVridge AI推薦システム 完成版情報

## 🎉 実装完了状況 (2025-10-04)

### ✅ 完全実装済み
- **🤖 ハイブリッド推薦システム**: 協調フィルタリング + コンテンツベースフィルタリング
- **🎲 ランダム表示機能**: 大量推薦リスト(50件)からランダム6個選択・更新
- **⚡ 高性能処理**: 推薦生成時間3ms以下の超高速レスポンス
- **🛡️ セキュリティ強化**: 包括的入力検証・SQLインジェクション対策・監査ログ
- **📊 分析データ管理**: 事前計算データによる高速推薦システム
- **🔄 リアルタイム更新**: "ランダム更新"ボタンによる即座の再表示

### 🏗️ アーキテクチャ（完成版）
- **マイクロサービス構成**: Frontend (3000) → Backend (3002) → AI Service (8000) → PostgreSQL
- **軽量通信プロトコル**: AI APIは軽量なID+スコア形式でデータ転送
- **分散処理**: 各サービスが独立して動作し、相互連携
- **フォールバック機能**: AI障害時の人気作品推薦による可用性確保

### 📈 パフォーマンス実績
- **推薦生成**: 3ms以下（目標200-400ms → 実績3ms）
- **大量リスト生成**: 50件を瞬時に計算
- **ランダム選択**: 即座の6件選択・表示
- **フロントエンド応答**: スムーズなUI更新

## ディレクトリ構造（完成版）
```
creator-vridge/
├── apps/                          # マイクロサービス群
│   ├── frontend/                  # Next.js 14 + TypeScript (Port 3000)
│   │   ├── src/components/dashboard/vtuber/RecommendedArtworks.tsx  # ランダム推薦コンポーネント
│   │   └── src/lib/api.ts         # API クライアント（bulk推薦対応）
│   ├── backend/                   # Node.js + Express API (Port 3002)
│   │   ├── src/routes/recommendations.ts   # 推薦API（bulk対応）
│   │   ├── src/utils/aiRecommendationClient.ts  # AI通信クライアント
│   │   └── prisma/                # データベース管理
│   └── ai-service/               # AI推薦サービス (Port 8000)
│       ├── src/services/analysisBasedRecommendation.ts  # ハイブリッド推薦エンジン
│       ├── src/services/dataLoader.ts       # 分析データ管理
│       ├── data/analysis_data.json          # 事前計算データ (235KB)
│       └── scripts/generateAnalysisData.js  # 分析データ生成
├── .claude/                       # Claude Code 設定
│   ├── CLAUDE.md                  # プロジェクト情報（本ファイル）
│   └── QUICK_REFERENCE.md         # クイックリファレンス
└── README.md                      # プロジェクト概要
```

## 🎯 システム現況

### ✅ プロダクション準備完了
全システムが完全実装され、安定稼働中。AI推薦システムは実用レベルに到達し、ユーザーはランダム更新機能により多様な推薦作品を楽しめます。

### 🚀 次期開発方向
- 絵師推薦システムの拡張
- より高度な分析アルゴリズムの導入
- パーソナライゼーション機能の強化

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

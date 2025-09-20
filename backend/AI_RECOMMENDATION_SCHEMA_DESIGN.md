」# AI推薦システム用データベーススキーマ設計

## 概要

VTuber-絵師マッチングプラットフォーム用のAI推薦システムに必要な4つの新しいテーブルを設計しました。既存のユーザー管理システムとの統合を考慮し、SQLite + Prisma ORM環境に最適化されています。

## 新規追加テーブル

### 1. Artwork（作品管理）

**目的**: 絵師の作品情報とAI特徴量の管理

**主要フィールド**:
- `aiFeatureVector`: AI特徴量ベクトル（JSON形式）
- `tags`: 作品タグ（JSON配列）
- `category`: 作品カテゴリ（enum）
- `style`: 作品スタイル
- `isPublic`/`isPortfolio`: 公開設定

**設計理由**:
- AI推薦アルゴリズムに必要な特徴量を柔軟に保存
- 検索とフィルタリングのためのカテゴリ分類
- プライバシー制御のための公開設定

### 2. UserLike（いいね履歴）

**目的**: VTuberによる作品への評価履歴

**主要フィールド**:
- `isLike`: いいね/いいねなしの明示的な評価
- `context`: 学習用コンテキスト情報（JSON）
- ユニーク制約: `(userId, artworkId)`

**設計理由**:
- 明示的なフィードバック収集
- 重複防止のためのユニーク制約
- 機械学習用の追加コンテキスト保存

### 3. RecommendationHistory（推薦履歴）

**目的**: AI推薦結果の追跡とパフォーマンス測定

**主要フィールド**:
- `recommendationId`: バッチ推薦の識別子
- `algorithmVersion`: アルゴリズムバージョン管理
- `position`: 推薦リスト内の順位
- `wasClicked`/`wasViewed`: ユーザー行動追跡
- `viewDuration`: 閲覧時間

**設計理由**:
- A/Bテスト用のアルゴリズムバージョン管理
- CTR（クリック率）とその他のKPI測定
- 推薦品質の継続的改善

### 4. ContractRequest（契約依頼）

**目的**: VTuberから絵師への契約依頼管理

**主要フィールド**:
- 詳細なステータス管理（8段階）
- 予算範囲（最小・最大）
- 優先度レベル
- 成果物と要件（JSON）
- タイムスタンプ追跡

**設計理由**:
- ワークフロー管理の詳細なステータス
- 柔軟な要件定義のためのJSON構造
- 履歴とパフォーマンス分析のためのタイムスタンプ

## インデックス設計

### パフォーマンス最適化戦略

#### 1. Artworkテーブル
```sql
-- 絵師別作品検索（最も頻繁な操作）
CREATE INDEX "artworks_artistUserId_idx" ON "artworks"("artistUserId");

-- カテゴリ・スタイル別フィルタリング
CREATE INDEX "artworks_category_idx" ON "artworks"("category");
CREATE INDEX "artworks_style_idx" ON "artworks"("style");

-- 公開作品の検索
CREATE INDEX "artworks_isPublic_idx" ON "artworks"("isPublic");

-- 時系列検索（最新作品表示）
CREATE INDEX "artworks_createdAt_idx" ON "artworks"("createdAt");
```

#### 2. UserLikeテーブル
```sql
-- ユーザー別いいね履歴（推薦アルゴリズム用）
CREATE INDEX "user_likes_userId_idx" ON "user_likes"("userId");

-- 作品別いいね統計
CREATE INDEX "user_likes_artworkId_idx" ON "user_likes"("artworkId");

-- ポジティブ/ネガティブフィードバック分析
CREATE INDEX "user_likes_isLike_idx" ON "user_likes"("isLike");

-- 時系列分析
CREATE INDEX "user_likes_createdAt_idx" ON "user_likes"("createdAt");

-- 重複防止
CREATE UNIQUE INDEX "user_likes_userId_artworkId_key" ON "user_likes"("userId", "artworkId");
```

#### 3. RecommendationHistoryテーブル
```sql
-- ユーザー別推薦履歴
CREATE INDEX "recommendation_history_userId_idx" ON "recommendation_history"("userId");

-- 作品別推薦統計
CREATE INDEX "recommendation_history_artworkId_idx" ON "recommendation_history"("artworkId");

-- バッチ推薦分析
CREATE INDEX "recommendation_history_recommendationId_idx" ON "recommendation_history"("recommendationId");

-- アルゴリズム性能比較
CREATE INDEX "recommendation_history_algorithmVersion_idx" ON "recommendation_history"("algorithmVersion");

-- CTR分析
CREATE INDEX "recommendation_history_wasClicked_idx" ON "recommendation_history"("wasClicked");
```

#### 4. ContractRequestテーブル
```sql
-- ユーザー別契約依頼管理
CREATE INDEX "contract_requests_vtuberUserId_idx" ON "contract_requests"("vtuberUserId");
CREATE INDEX "contract_requests_artistUserId_idx" ON "contract_requests"("artistUserId");

-- ステータス別フィルタリング
CREATE INDEX "contract_requests_status_idx" ON "contract_requests"("status");

-- 優先度管理
CREATE INDEX "contract_requests_priority_idx" ON "contract_requests"("priority");

-- 締切管理
CREATE INDEX "contract_requests_deadline_idx" ON "contract_requests"("deadline");
```

## パフォーマンス考慮事項

### 1. クエリ最適化

**頻繁なクエリパターン**:
- ユーザー別作品一覧: `artistUserId` インデックス使用
- 推薦候補検索: `category` + `isPublic` 複合条件
- いいね履歴分析: `userId` + `isLike` 組み合わせ
- 推薦効果測定: `algorithmVersion` + `wasClicked`

**複合インデックスの検討**:
```sql
-- 将来的に追加を検討
CREATE INDEX "artworks_public_category_created" ON "artworks"("isPublic", "category", "createdAt");
CREATE INDEX "user_likes_user_like_created" ON "user_likes"("userId", "isLike", "createdAt");
```

### 2. データサイズ管理

**JSON フィールドの最適化**:
- `aiFeatureVector`: 圧縮アルゴリズムの適用を検討
- `tags`: 正規化によるサイズ削減（将来的にTagsテーブル分離）
- `context`: 必要な情報のみ保存

**アーカイブ戦略**:
- RecommendationHistory: 3ヶ月以上の古いデータの定期アーカイブ
- UserLike: 非アクティブユーザーのデータ圧縮

### 3. 同時実行制御

**ロック競合の回避**:
- UserLike の upsert 操作での適切なトランザクション管理
- ContractRequest のステータス更新での楽観的ロック
- 大量データ処理時のバッチサイズ制限

### 4. 監視・メンテナンス

**定期メンテナンス**:
- インデックス使用率の監視
- 大きくなりがちなテーブルのパーティション検討
- 不要なデータの定期クリーンアップ

**パフォーマンス監視**:
- スロークエリの識別
- インデックス効果の測定
- メモリ使用量の監視

## 移行手順

1. **スキーマ検証**: 新しいPrismaスキーマの構文確認
2. **マイグレーション実行**: 本番前のステージング環境でテスト
3. **データ移行**: 既存データがある場合の変換処理
4. **パフォーマンステスト**: 想定される負荷でのテスト実行
5. **本番デプロイ**: ダウンタイム最小化の戦略

## 今後の拡張性

- 地理的分散対応（リージョン別レプリケーション）
- リアルタイム推薦のためのキャッシュ層
- 機械学習パイプラインとの統合
- スケーラビリティのためのシャーディング戦略
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

/**
 * データベースから作品データを取得して分析ファイルを生成
 */
async function generateAnalysisData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 データベースから作品データを取得中...');
    
    // 作品データの取得
    const artworks = await prisma.artwork.findMany({
      where: {
        isPublic: true
      },
      include: {
        artistUser: {
          include: {
            profile: true
          }
        },
        _count: {
          select: {
            userLikes: {
              where: { isLike: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 取得した作品数: ${artworks.length}`);

    // ユーザー行動データの取得
    const userBehaviors = await prisma.userBehaviorLog.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 1000 // 最新1000件
    });

    console.log(`📈 取得した行動ログ: ${userBehaviors.length}`);

    // ユーザーライクデータの取得
    const userLikes = await prisma.userLike.findMany({
      where: {
        isLike: true
      },
      include: {
        artwork: true,
        user: true
      }
    });

    console.log(`❤️ 取得したライクデータ: ${userLikes.length}`);

    // 作品特徴分析
    const artworkFeatures = artworks.map(artwork => {
      return {
        id: artwork.id,
        title: artwork.title,
        description: artwork.description,
        category: artwork.category,
        style: artwork.style,
        tags: artwork.tags || [],
        artistId: artwork.artistUserId,
        artistName: artwork.artistUser.profile?.displayName || 'Unknown',
        likesCount: artwork._count.userLikes,
        createdAt: artwork.createdAt,
        // 特徴ベクトル生成（簡易版）
        features: {
          category_score: getCategoryScore(artwork.category),
          style_score: getStyleScore(artwork.style),
          tag_vector: getTagVector(artwork.tags || []),
          popularity_score: artwork._count.userLikes,
          recency_score: getRecencyScore(artwork.createdAt)
        }
      };
    });

    // ユーザープロファイル分析
    const userProfiles = {};
    userLikes.forEach(like => {
      if (!userProfiles[like.userId]) {
        userProfiles[like.userId] = {
          userId: like.userId,
          userType: like.user.userType,
          likedArtworks: [],
          preferences: {
            categories: {},
            styles: {},
            tags: {},
            artists: {}
          }
        };
      }
      
      const profile = userProfiles[like.userId];
      profile.likedArtworks.push(like.artworkId);
      
      // カテゴリ偏好
      const category = like.artwork.category;
      profile.preferences.categories[category] = (profile.preferences.categories[category] || 0) + 1;
      
      // スタイル偏好
      if (like.artwork.style) {
        profile.preferences.styles[like.artwork.style] = (profile.preferences.styles[like.artwork.style] || 0) + 1;
      }
      
      // タグ偏好
      if (like.artwork.tags) {
        like.artwork.tags.forEach(tag => {
          profile.preferences.tags[tag] = (profile.preferences.tags[tag] || 0) + 1;
        });
      }
    });

    // 協調フィルタリング用のユーザー-アイテムマトリックス
    const userItemMatrix = {};
    Object.values(userProfiles).forEach(profile => {
      userItemMatrix[profile.userId] = {};
      profile.likedArtworks.forEach(artworkId => {
        userItemMatrix[profile.userId][artworkId] = 1.0;
      });
    });

    // コンテンツベースフィルタリング用のアイテム類似度マトリックス
    const itemSimilarityMatrix = {};
    artworkFeatures.forEach((artwork1, i) => {
      itemSimilarityMatrix[artwork1.id] = {};
      artworkFeatures.forEach((artwork2, j) => {
        if (i !== j) {
          itemSimilarityMatrix[artwork1.id][artwork2.id] = calculateContentSimilarity(artwork1, artwork2);
        }
      });
    });

    // 分析データの統合
    const analysisData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        artworkCount: artworks.length,
        userCount: Object.keys(userProfiles).length,
        behaviorLogCount: userBehaviors.length,
        likeCount: userLikes.length,
        algorithm: 'HYBRID_RECOMMENDATION_v1.0'
      },
      artworks: artworkFeatures,
      userProfiles: Object.values(userProfiles),
      userItemMatrix,
      itemSimilarityMatrix,
      globalStats: {
        popularCategories: getPopularCategories(artworks),
        popularStyles: getPopularStyles(artworks),
        popularTags: getPopularTags(artworks),
        topArtists: getTopArtists(artworks)
      }
    };

    // ファイルに保存
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'analysis_data.json');
    fs.writeFileSync(filePath, JSON.stringify(analysisData, null, 2));
    
    console.log(`✅ 分析データを生成しました: ${filePath}`);
    console.log(`📊 統計:
    - 作品数: ${analysisData.metadata.artworkCount}
    - ユーザー数: ${analysisData.metadata.userCount}
    - 行動ログ数: ${analysisData.metadata.behaviorLogCount}
    - ライク数: ${analysisData.metadata.likeCount}`);

    await prisma.$disconnect();
    return analysisData;

  } catch (error) {
    console.error('❌ 分析データ生成エラー:', error);
    throw error;
  }
}

// ヘルパー関数
function getCategoryScore(category) {
  const scores = {
    'CHARACTER_DESIGN': 1.0,
    'ILLUSTRATION': 0.8,
    'CONCEPT_ART': 0.9,
    'LOGO_DESIGN': 0.7,
    'BACKGROUND_ART': 0.6,
    'COMIC_MANGA': 0.8,
    'ANIMATION': 0.9,
    'UI_UX_DESIGN': 0.7
  };
  return scores[category] || 0.5;
}

function getStyleScore(style) {
  if (!style) return 0.5;
  const scores = {
    'アニメ調': 1.0,
    'リアル調': 0.9,
    'デフォルメ': 0.8,
    'ピクセルアート': 0.7,
    '水彩画風': 0.8,
    '80年代': 0.6,
    'ミニマル': 0.7
  };
  return scores[style] || 0.5;
}

function getTagVector(tags) {
  // 簡易的なタグベクトル（実際はより高度な埋め込みを使用）
  const commonTags = ['キャラクター', 'ファンタジー', 'SF', 'かわいい', 'クール', 'ダーク', 'ポップ', 'レトロ'];
  const vector = new Array(commonTags.length).fill(0);
  tags.forEach(tag => {
    const index = commonTags.findIndex(commonTag => tag.includes(commonTag));
    if (index !== -1) {
      vector[index] = 1.0;
    }
  });
  return vector;
}

function getRecencyScore(createdAt) {
  const now = new Date();
  const daysDiff = (now - new Date(createdAt)) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - daysDiff / 365); // 1年で0になる
}

function calculateContentSimilarity(artwork1, artwork2) {
  let similarity = 0;
  let factors = 0;

  // カテゴリ類似度
  if (artwork1.category === artwork2.category) {
    similarity += 0.3;
  }
  factors += 0.3;

  // スタイル類似度
  if (artwork1.style && artwork2.style && artwork1.style === artwork2.style) {
    similarity += 0.3;
  }
  factors += 0.3;

  // タグ類似度
  const commonTags = artwork1.tags.filter(tag => artwork2.tags.includes(tag));
  const tagSimilarity = commonTags.length / Math.max(artwork1.tags.length, artwork2.tags.length, 1);
  similarity += tagSimilarity * 0.4;
  factors += 0.4;

  return factors > 0 ? similarity / factors : 0;
}

function getPopularCategories(artworks) {
  const categories = {};
  artworks.forEach(artwork => {
    categories[artwork.category] = (categories[artwork.category] || 0) + 1;
  });
  return Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
}

function getPopularStyles(artworks) {
  const styles = {};
  artworks.forEach(artwork => {
    if (artwork.style) {
      styles[artwork.style] = (styles[artwork.style] || 0) + 1;
    }
  });
  return Object.entries(styles)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([style, count]) => ({ style, count }));
}

function getPopularTags(artworks) {
  const tags = {};
  artworks.forEach(artwork => {
    if (artwork.tags) {
      artwork.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    }
  });
  return Object.entries(tags)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
}

function getTopArtists(artworks) {
  const artists = {};
  artworks.forEach(artwork => {
    const artistId = artwork.artistUserId;
    const artistName = artwork.artistUser.profile?.displayName || 'Unknown';
    if (!artists[artistId]) {
      artists[artistId] = {
        id: artistId,
        name: artistName,
        artworkCount: 0,
        totalLikes: 0
      };
    }
    artists[artistId].artworkCount += 1;
    artists[artistId].totalLikes += artwork._count.userLikes;
  });
  
  return Object.values(artists)
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 10);
}

// スクリプト実行
if (require.main === module) {
  generateAnalysisData()
    .then(() => {
      console.log('🎉 分析データ生成完了');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 生成失敗:', error);
      process.exit(1);
    });
}

module.exports = { generateAnalysisData };
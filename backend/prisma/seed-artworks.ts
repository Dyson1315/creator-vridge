import { PrismaClient, ArtworkCategory } from '@prisma/client';

const prisma = new PrismaClient();

const sampleArtworks = [
  {
    title: "幻想的な森の精霊",
    description: "神秘的な森に住む精霊を描いたファンタジーイラストです。柔らかな光の表現と繊細な色彩が特徴です。",
    imageUrl: "https://example.com/images/forest-spirit.jpg",
    thumbnailUrl: "https://example.com/images/forest-spirit-thumb.jpg",
    tags: ["ファンタジー", "精霊", "森", "神秘的", "幻想的"],
    style: "ファンタジーアート",
    category: "ILLUSTRATION" as ArtworkCategory,
    aiFeatureVector: {
      colors: [0.2, 0.8, 0.4, 0.6, 0.3], // 緑系、青系の色調
      style: [0.9, 0.7, 0.8, 0.2, 0.1], // ファンタジー、幻想的
      complexity: 0.8,
      mood: "mystical"
    }
  },
  {
    title: "サイバーパンク都市の夜景",
    description: "未来都市の夜景を描いたサイバーパンク風イラスト。ネオンの光と暗闇のコントラストが印象的です。",
    imageUrl: "https://example.com/images/cyberpunk-city.jpg",
    thumbnailUrl: "https://example.com/images/cyberpunk-city-thumb.jpg",
    tags: ["サイバーパンク", "都市", "夜景", "ネオン", "SF"],
    style: "サイバーパンク",
    category: "CONCEPT_ART" as ArtworkCategory,
    aiFeatureVector: {
      colors: [0.9, 0.1, 0.8, 0.7, 0.9], // 青、紫、ピンク系
      style: [0.1, 0.2, 0.9, 0.8, 0.7], // SF、テクノロジー
      complexity: 0.9,
      mood: "futuristic"
    }
  },
  {
    title: "可愛らしい猫のキャラクター",
    description: "親しみやすく可愛らしい猫のキャラクターデザイン。VTuberのマスコットにも適しています。",
    imageUrl: "https://example.com/images/cute-cat-character.jpg",
    thumbnailUrl: "https://example.com/images/cute-cat-character-thumb.jpg",
    tags: ["キャラクター", "猫", "可愛い", "マスコット", "動物"],
    style: "キャラクターデザイン",
    category: "CHARACTER_DESIGN" as ArtworkCategory,
    aiFeatureVector: {
      colors: [0.8, 0.9, 0.3, 0.9, 0.6], // 暖色系、明るい色調
      style: [0.3, 0.9, 0.2, 0.1, 0.9], // 可愛い、シンプル
      complexity: 0.4,
      mood: "cheerful"
    }
  },
  {
    title: "荘厳な山岳風景",
    description: "雄大な山々と雲海を描いた風景画。自然の美しさと壮大さを表現しました。",
    imageUrl: "https://example.com/images/mountain-landscape.jpg",
    thumbnailUrl: "https://example.com/images/mountain-landscape-thumb.jpg",
    tags: ["風景", "山", "自然", "雲海", "絶景"],
    style: "風景画",
    category: "BACKGROUND" as ArtworkCategory,
    aiFeatureVector: {
      colors: [0.4, 0.6, 0.9, 0.3, 0.2], // 青系、自然色
      style: [0.7, 0.3, 0.1, 0.9, 0.4], // リアリスティック、自然
      complexity: 0.7,
      mood: "serene"
    }
  },
  {
    title: "配信用オーバーレイデザイン",
    description: "VTuberの配信で使用するためのオーバーレイデザイン。シンプルで視認性を重視しました。",
    imageUrl: "https://example.com/images/stream-overlay.jpg",
    thumbnailUrl: "https://example.com/images/stream-overlay-thumb.jpg",
    tags: ["オーバーレイ", "配信", "VTuber", "UI", "デザイン"],
    style: "UIデザイン",
    category: "OVERLAY" as ArtworkCategory,
    aiFeatureVector: {
      colors: [0.5, 0.5, 0.5, 0.8, 0.9], // シンプルなカラーパレット
      style: [0.2, 0.8, 0.3, 0.3, 0.9], // 機能的、シンプル
      complexity: 0.3,
      mood: "professional"
    }
  },
  {
    title: "感情豊かなエモート集",
    description: "VTuberが配信で使用するエモート(感情表現)のセット。表情豊かで使いやすいデザインです。",
    imageUrl: "https://example.com/images/emote-set.jpg",
    thumbnailUrl: "https://example.com/images/emote-set-thumb.jpg",
    tags: ["エモート", "表情", "配信", "感情", "セット"],
    style: "エモートアート",
    category: "EMOTE" as ArtworkCategory,
    aiFeatureVector: {
      colors: [0.7, 0.8, 0.6, 0.9, 0.8], // 明るく親しみやすい色調
      style: [0.4, 0.9, 0.2, 0.2, 0.9], // 表現豊か、コミュニケーション
      complexity: 0.5,
      mood: "expressive"
    }
  }
];

async function seedArtworks() {
  console.log('🎨 Starting artwork seeding...');

  // Get all artist users
  const artists = await prisma.user.findMany({
    where: { userType: 'ARTIST' }
  });

  if (artists.length === 0) {
    console.log('❌ No artist users found. Please run the main seed first.');
    return;
  }

  console.log(`Found ${artists.length} artist users`);

  // Create artworks for each artist
  for (const artist of artists) {
    // Each artist gets 3 artworks
    const artworksForArtist = sampleArtworks.slice(0, 3);
    
    for (const artworkData of artworksForArtist) {
      const artwork = await prisma.artwork.create({
        data: {
          artistUserId: artist.id,
          title: artworkData.title,
          description: artworkData.description,
          imageUrl: artworkData.imageUrl,
          thumbnailUrl: artworkData.thumbnailUrl,
          tags: artworkData.tags,
          style: artworkData.style,
          category: artworkData.category,
          aiFeatureVector: artworkData.aiFeatureVector,
          isPublic: true,
          isPortfolio: true,
          width: 1920,
          height: 1080,
          fileSize: Math.floor(Math.random() * 5000000) + 1000000, // 1-5MB
          mimeType: "image/jpeg"
        }
      });

      console.log(`✅ Created artwork: ${artwork.title} for artist ${artist.id}`);
    }

    // Add remaining artworks to the second artist if there is one
    if (artists.length > 1 && artist.id === artists[1].id) {
      const remainingArtworks = sampleArtworks.slice(3);
      
      for (const artworkData of remainingArtworks) {
        const artwork = await prisma.artwork.create({
          data: {
            artistUserId: artist.id,
            title: artworkData.title,
            description: artworkData.description,
            imageUrl: artworkData.imageUrl,
            thumbnailUrl: artworkData.thumbnailUrl,
            tags: artworkData.tags,
            style: artworkData.style,
            category: artworkData.category,
            aiFeatureVector: artworkData.aiFeatureVector,
            isPublic: true,
            isPortfolio: true,
            width: 1920,
            height: 1080,
            fileSize: Math.floor(Math.random() * 5000000) + 1000000,
            mimeType: "image/jpeg"
          }
        });

        console.log(`✅ Created artwork: ${artwork.title} for artist ${artist.id}`);
      }
    }
  }

  console.log('🎨 Artwork seeding completed!');
}

seedArtworks()
  .catch((e) => {
    console.error('❌ Error seeding artworks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
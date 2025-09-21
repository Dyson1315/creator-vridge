import { PrismaClient, UserType, UserStatus, AvailabilityStatus, ArtworkCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data in development
  if (process.env.NODE_ENV === 'development') {
    await prisma.userLike.deleteMany();
    await prisma.recommendationHistory.deleteMany();
    await prisma.contractRequest.deleteMany();
    await prisma.artwork.deleteMany();
    await prisma.message.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.match.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleared existing data');
  }

  // Create demo users
  const hashedPassword = await bcrypt.hash('Demo123!', 12);

  // VTuber users
  const vtuber1 = await prisma.user.create({
    data: {
      email: 'vtuber1@demo.com',
      passwordHash: hashedPassword,
      userType: UserType.VTUBER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'MimiKawa',
          bio: '新人VTuberです！かわいいキャラクターデザインを探しています。優しくて丁寧なアーティストさんと一緒にお仕事したいです♪',
          skills: ['ゲーム配信', '歌配信', 'お絵描き配信'],
          priceRangeMin: 50,
          priceRangeMax: 200,
          availability: AvailabilityStatus.AVAILABLE,
          timezone: 'Asia/Tokyo',
          preferredCommStyle: 'friendly',
          experience: 0
        }
      }
    },
    include: { profile: true }
  });

  const vtuber2 = await prisma.user.create({
    data: {
      email: 'vtuber2@demo.com',
      passwordHash: hashedPassword,
      userType: UserType.VTUBER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'DragonStorm',
          bio: 'ゲーミングVTuberとして活動予定。クールでかっこいいドラゴンキャラクターを希望します。',
          skills: ['FPS', 'RPG', '配信技術'],
          priceRangeMin: 100,
          priceRangeMax: 500,
          availability: AvailabilityStatus.AVAILABLE,
          timezone: 'America/New_York',
          preferredCommStyle: 'professional',
          experience: 1
        }
      }
    },
    include: { profile: true }
  });

  // Artist users
  const artist1 = await prisma.user.create({
    data: {
      email: 'artist1@demo.com',
      passwordHash: hashedPassword,
      userType: UserType.ARTIST,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'PixelMaster',
          bio: 'プロのイラストレーターです。可愛いキャラクターから幻想的なアートまで幅広く対応できます。特にVTuberキャラクターデザインが得意で、Live2Dモデル制作も対応可能です。コミュニケーションを大切にし、お客様のご要望を丁寧にヒアリングして理想のキャラクターを制作いたします。',
          skills: ['キャラクターデザイン', 'Live2D', 'アニメ調イラスト', 'コンセプトアート', 'VTuberデザイン', 'エモート制作', 'オーバーレイデザイン', 'アバター制作'],
          priceRangeMin: 80,
          priceRangeMax: 300,
          availability: AvailabilityStatus.AVAILABLE,
          timezone: 'Asia/Tokyo',
          preferredCommStyle: 'detailed',
          experience: 5,
          rating: 4.8,
          totalReviews: 23,
          portfolioUrls: [
            'https://pixiv.net/pixelmaster/portfolio1',
            'https://pixiv.net/pixelmaster/portfolio2',
            'https://artstation.com/pixelmaster/characters',
            'https://booth.pm/pixelmaster/live2d',
            'https://twitter.com/pixelmaster_art'
          ]
        }
      }
    },
    include: { profile: true }
  });

  const artist2 = await prisma.user.create({
    data: {
      email: 'artist2@demo.com',
      passwordHash: hashedPassword,
      userType: UserType.ARTIST,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'DarkArtistX',
          bio: 'ダークファンタジー、SF、メカ系のアートが得意なプロフェッショナルアーティストです。複雑で詳細なデザインから、シンプルで力強いコンセプトアートまで幅広く対応可能。ゲーム業界での経験も豊富で、キャラクター、背景、メカニックデザインすべてお任せください。クライアントとは効率的でプロフェッショナルなコミュニケーションを心がけています。',
          skills: ['コンセプトアート', 'メカデザイン', 'ダークファンタジー', '3Dモデリング', '背景デザイン', 'ゲームアート', 'キャラクター設定', 'ワールドビルディング'],
          priceRangeMin: 150,
          priceRangeMax: 800,
          availability: AvailabilityStatus.BUSY,
          timezone: 'Europe/London',
          preferredCommStyle: 'professional',
          experience: 8,
          rating: 4.9,
          totalReviews: 45,
          portfolioUrls: [
            'https://artstation.com/darkartistx/gallery',
            'https://behance.net/darkartistx/mecha',
            'https://darkartistx.portfoliobox.net/fantasy',
            'https://instagram.com/darkartistx_official',
            'https://github.com/darkartistx/3d-models'
          ]
        }
      }
    },
    include: { profile: true }
  });

  // Create demo matches
  const match1 = await prisma.match.create({
    data: {
      vtuberUserId: vtuber1.id,
      artistUserId: artist1.id,
      matchScore: 0.85,
      description: 'かわいい猫耳の女の子キャラクターをお願いします',
      budget: 150,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  });

  const match2 = await prisma.match.create({
    data: {
      vtuberUserId: vtuber2.id,
      artistUserId: artist2.id,
      matchScore: 0.92,
      description: 'ドラゴンをモチーフにしたクールなキャラクター',
      budget: 400,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    }
  });

  // Add more artists for diverse artwork
  const artist3 = await prisma.user.create({
    data: {
      email: 'artist3@demo.com',
      passwordHash: hashedPassword,
      userType: UserType.ARTIST,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'ColorfulArt',
          bio: 'ポップでカラフルなイラストが得意な韓国系アーティストです。明るく楽しい雰囲気の作品を制作し、見る人を元気にするアートを心がけています。K-POPアイドルやストリーマー向けのイラスト制作経験も豊富です。明るく親しみやすいコミュニケーションで、楽しくお仕事させていただきます！',
          skills: ['ポップアート', 'カラフルイラスト', 'ステッカーデザイン', 'キャラクター', 'K-POPスタイル', 'ストリーマーアート', 'エモート', 'グッズデザイン'],
          priceRangeMin: 40,
          priceRangeMax: 250,
          availability: AvailabilityStatus.AVAILABLE,
          timezone: 'Asia/Seoul',
          preferredCommStyle: 'cheerful',
          experience: 3,
          rating: 4.6,
          totalReviews: 18,
          portfolioUrls: [
            'https://pixiv.net/colorfulart/gallery',
            'https://instagram.com/colorfulart_official',
            'https://behance.net/colorfulart/kpop',
            'https://twitter.com/colorfulart_kr',
            'https://booth.pm/colorfulart/stickers'
          ]
        }
      }
    },
    include: { profile: true }
  });

  const artist4 = await prisma.user.create({
    data: {
      email: 'artist4@demo.com',
      passwordHash: hashedPassword,
      userType: UserType.ARTIST,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'MinimalDesign',
          bio: 'シンプルでミニマルなデザインを専門とするドイツ系デザイナーです。無駄を削ぎ落とした美しいデザインで、メッセージを明確に伝えるアートを制作します。企業ブランディングからVTuberロゴまで、幅広いデザインニーズに対応。効率的で明確なコミュニケーションを重視しています。',
          skills: ['ミニマルデザイン', 'ロゴデザイン', 'アイコン', 'ベクターアート', 'ブランディング', 'タイポグラフィ', 'UIデザイン', 'レイアウト'],
          priceRangeMin: 60,
          priceRangeMax: 400,
          availability: AvailabilityStatus.AVAILABLE,
          timezone: 'Europe/Berlin',
          preferredCommStyle: 'minimal',
          experience: 4,
          rating: 4.7,
          totalReviews: 31,
          portfolioUrls: [
            'https://dribbble.com/minimaldesign',
            'https://behance.net/minimaldesign/branding',
            'https://minimal-design.portfolio.site',
            'https://instagram.com/minimal_design_studio',
            'https://github.com/minimaldesign/icons'
          ]
        }
      }
    },
    include: { profile: true }
  });

  const artist5 = await prisma.user.create({
    data: {
      email: 'artist5@demo.com',
      passwordHash: hashedPassword,
      userType: UserType.ARTIST,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: 'RetroVibe',
          bio: 'レトロで懐かしい雰囲気の作品を専門とするアメリカ系アーティストです。80-90年代の黄金時代を彷彿とさせるスタイルが得意で、ノスタルジックな魅力あふれる作品を制作します。ゲーム業界での経験も豊富で、レトロゲーム風のアートやピクセルアートも対応可能。懐かしい時代への愛情を込めて制作いたします。',
          skills: ['レトロアート', 'ピクセルアート', '80年代スタイル', 'ビンテージ', 'ゲームアート', 'ドット絵', 'ヴェイパーウェーブ', 'シンセウェーブ'],
          priceRangeMin: 70,
          priceRangeMax: 350,
          availability: AvailabilityStatus.BUSY,
          timezone: 'America/Los_Angeles',
          preferredCommStyle: 'nostalgic',
          experience: 6,
          rating: 4.8,
          totalReviews: 27,
          portfolioUrls: [
            'https://artstation.com/retrovibe/retro',
            'https://itch.io/retrovibe/pixelart',
            'https://deviantart.com/retrovibe80s',
            'https://twitter.com/retro_vibe_art',
            'https://patreon.com/retrovibeartist'
          ]
        }
      }
    },
    include: { profile: true }
  });

  // Create diverse artworks (50+ pieces)
  const artworks = await Promise.all([
    // Artist1's artworks (kawaii style) - 12 pieces
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'かわいい猫耳少女',
        description: 'ふわふわな猫耳が特徴的な可愛らしい女の子のイラストです',
        imageUrl: 'https://picsum.photos/800/600?random=1',
        thumbnailUrl: 'https://picsum.photos/400/300?random=1',
        tags: ['猫耳', 'かわいい', 'アニメ調', '女の子'],
        style: 'アニメ調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'パステルカラーの魔法少女',
        description: 'パステルカラーで彩られた優しい魔法少女のイラスト',
        imageUrl: 'https://picsum.photos/800/600?random=2',
        thumbnailUrl: 'https://picsum.photos/400/300?random=2',
        tags: ['魔法少女', 'パステル', 'かわいい', 'ファンタジー'],
        style: 'アニメ調',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'うさぎのマスコット',
        description: 'ふわふわなうさぎのマスコットキャラクター',
        imageUrl: 'https://picsum.photos/800/600?random=3',
        thumbnailUrl: 'https://picsum.photos/400/300?random=3',
        tags: ['うさぎ', 'マスコット', 'かわいい', 'ゆるキャラ'],
        style: 'ゆるかわ',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'お花畑の妖精',
        description: 'カラフルなお花畑で踊る小さな妖精たち',
        imageUrl: 'https://picsum.photos/800/600?random=4',
        thumbnailUrl: 'https://picsum.photos/400/300?random=4',
        tags: ['妖精', 'お花', 'ファンタジー', 'かわいい'],
        style: 'アニメ調',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: '桜の精霊',
        description: '春の桜とともに舞い踊る美しい精霊',
        imageUrl: 'https://picsum.photos/800/600?random=9',
        thumbnailUrl: 'https://picsum.photos/400/300?random=9',
        tags: ['桜', '精霊', '春', 'ファンタジー', 'かわいい'],
        style: 'アニメ調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'ちび天使',
        description: '小さくて愛らしい天使のキャラクター',
        imageUrl: 'https://picsum.photos/800/600?random=10',
        thumbnailUrl: 'https://picsum.photos/400/300?random=10',
        tags: ['天使', 'ちび', 'かわいい', '神聖'],
        style: 'ゆるかわ',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'ふわふわパンダ',
        description: 'もちもちふわふわなパンダのイラスト',
        imageUrl: 'https://picsum.photos/800/600?random=11',
        thumbnailUrl: 'https://picsum.photos/400/300?random=11',
        tags: ['パンダ', 'ふわふわ', 'かわいい', '動物'],
        style: 'ゆるかわ',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'マーメイドプリンセス',
        description: '海の底の美しいマーメイド姫',
        imageUrl: 'https://picsum.photos/800/600?random=12',
        thumbnailUrl: 'https://picsum.photos/400/300?random=12',
        tags: ['マーメイド', '海', 'プリンセス', 'ファンタジー'],
        style: 'アニメ調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'キャンディガール',
        description: 'お菓子をモチーフにした甘い女の子',
        imageUrl: 'https://picsum.photos/800/600?random=13',
        thumbnailUrl: 'https://picsum.photos/400/300?random=13',
        tags: ['キャンディ', 'お菓子', 'かわいい', '甘い'],
        style: 'アニメ調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: '星空のユニコーン',
        description: '星空を駆け抜ける幻想的なユニコーン',
        imageUrl: 'https://picsum.photos/800/600?random=14',
        thumbnailUrl: 'https://picsum.photos/400/300?random=14',
        tags: ['ユニコーン', '星空', 'ファンタジー', '幻想的'],
        style: 'アニメ調',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: 'こねこの冒険',
        description: '小さな猫の大きな冒険物語',
        imageUrl: 'https://picsum.photos/800/600?random=15',
        thumbnailUrl: 'https://picsum.photos/400/300?random=15',
        tags: ['猫', '冒険', 'ストーリー', 'かわいい'],
        style: 'ゆるかわ',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist1.id,
        title: '雲の上の城',
        description: 'ふわふわの雲の上に浮かぶ美しいお城',
        imageUrl: 'https://picsum.photos/800/600?random=16',
        thumbnailUrl: 'https://picsum.photos/400/300?random=16',
        tags: ['城', '雲', 'ファンタジー', '空'],
        style: 'アニメ調',
        category: ArtworkCategory.BACKGROUND,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),

    // Artist2's artworks (dark/cool style) - 15 pieces
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'ドラゴンナイト',
        description: '重厚な鎧を身にまとった竜騎士の戦士',
        imageUrl: 'https://picsum.photos/800/600?random=5',
        thumbnailUrl: 'https://picsum.photos/400/300?random=5',
        tags: ['ドラゴン', 'ナイト', 'ファンタジー', 'かっこいい'],
        style: 'リアル調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'サイバーパンクシティ',
        description: 'ネオンが輝く未来都市の風景',
        imageUrl: 'https://picsum.photos/800/600?random=6',
        thumbnailUrl: 'https://picsum.photos/400/300?random=6',
        tags: ['サイバーパンク', '未来', '都市', 'ネオン'],
        style: 'リアル調',
        category: ArtworkCategory.BACKGROUND,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'メカスーツ',
        description: '高性能な戦闘用メカニカルスーツ',
        imageUrl: 'https://picsum.photos/800/600?random=7',
        thumbnailUrl: 'https://picsum.photos/400/300?random=7',
        tags: ['メカ', 'ロボット', 'SF', 'かっこいい'],
        style: 'リアル調',
        category: ArtworkCategory.CONCEPT_ART,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'ダークエルフ',
        description: '神秘的な力を持つダークエルフの魔法使い',
        imageUrl: 'https://picsum.photos/800/600?random=8',
        thumbnailUrl: 'https://picsum.photos/400/300?random=8',
        tags: ['エルフ', 'ダーク', '魔法', 'ファンタジー'],
        style: 'セミリアル',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'スペースマリーン',
        description: '宇宙戦争の最前線で戦う兵士',
        imageUrl: 'https://picsum.photos/800/600?random=17',
        thumbnailUrl: 'https://picsum.photos/400/300?random=17',
        tags: ['宇宙', 'マリーン', 'SF', '戦士'],
        style: 'リアル調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'ネオンサムライ',
        description: 'サイバーパンクな世界の未来サムライ',
        imageUrl: 'https://picsum.photos/800/600?random=18',
        thumbnailUrl: 'https://picsum.photos/400/300?random=18',
        tags: ['サムライ', 'ネオン', 'サイバーパンク', '刀'],
        style: 'リアル調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'ヴァンパイアロード',
        description: '闇を支配する恐ろしきヴァンパイアの王',
        imageUrl: 'https://picsum.photos/800/600?random=19',
        thumbnailUrl: 'https://picsum.photos/400/300?random=19',
        tags: ['ヴァンパイア', 'ダーク', 'ホラー', '王'],
        style: 'ダーク',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'スチームパンク工房',
        description: '歯車と蒸気が織りなす幻想的な工房',
        imageUrl: 'https://picsum.photos/800/600?random=20',
        thumbnailUrl: 'https://picsum.photos/400/300?random=20',
        tags: ['スチームパンク', '工房', '歯車', '蒸気'],
        style: 'スチームパンク',
        category: ArtworkCategory.BACKGROUND,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'アポカリプス戦士',
        description: '終末世界を生き抜く孤高の戦士',
        imageUrl: 'https://picsum.photos/800/600?random=21',
        thumbnailUrl: 'https://picsum.photos/400/300?random=21',
        tags: ['アポカリプス', '戦士', '終末', 'サバイバル'],
        style: 'リアル調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: '巨大ロボット',
        description: '都市を守る巨大な機械の守護者',
        imageUrl: 'https://picsum.photos/800/600?random=22',
        thumbnailUrl: 'https://picsum.photos/400/300?random=22',
        tags: ['ロボット', '巨大', 'メカ', '守護者'],
        style: 'リアル調',
        category: ArtworkCategory.CONCEPT_ART,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'ダークソーサラー',
        description: '禁断の魔法を操る闇の魔法使い',
        imageUrl: 'https://picsum.photos/800/600?random=23',
        thumbnailUrl: 'https://picsum.photos/400/300?random=23',
        tags: ['魔法使い', 'ダーク', '禁断', '魔法'],
        style: 'ダーク',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: '宇宙戦艦',
        description: '星間戦争で活躍する巨大戦艦',
        imageUrl: 'https://picsum.photos/800/600?random=24',
        thumbnailUrl: 'https://picsum.photos/400/300?random=24',
        tags: ['宇宙', '戦艦', 'SF', '宇宙船'],
        style: 'リアル調',
        category: ArtworkCategory.CONCEPT_ART,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'サイボーグ忍者',
        description: '機械化された未来の忍者',
        imageUrl: 'https://picsum.photos/800/600?random=25',
        thumbnailUrl: 'https://picsum.photos/400/300?random=25',
        tags: ['サイボーグ', '忍者', '未来', '機械'],
        style: 'リアル調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'エイリアンクイーン',
        description: '異星の美しくも恐ろしい女王',
        imageUrl: 'https://picsum.photos/800/600?random=26',
        thumbnailUrl: 'https://picsum.photos/400/300?random=26',
        tags: ['エイリアン', '女王', '異星', 'SF'],
        style: 'リアル調',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist2.id,
        title: 'ゴシック教会',
        description: '神秘的で荘厳なゴシック様式の教会',
        imageUrl: 'https://picsum.photos/800/600?random=27',
        thumbnailUrl: 'https://picsum.photos/400/300?random=27',
        tags: ['ゴシック', '教会', '神秘', '建築'],
        style: 'ダーク',
        category: ArtworkCategory.BACKGROUND,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),

    // Artist3's artworks (colorful/pop style) - 12 pieces
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'レインボーユニコーン',
        description: '虹色に輝く魔法のユニコーン',
        imageUrl: 'https://picsum.photos/800/600?random=28',
        thumbnailUrl: 'https://picsum.photos/400/300?random=28',
        tags: ['ユニコーン', 'レインボー', 'カラフル', 'ポップ'],
        style: 'ポップアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'カラフルドラゴン',
        description: 'ポップでキュートなカラフルドラゴン',
        imageUrl: 'https://picsum.photos/800/600?random=29',
        thumbnailUrl: 'https://picsum.photos/400/300?random=29',
        tags: ['ドラゴン', 'カラフル', 'ポップ', 'キュート'],
        style: 'ポップアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'フルーツ天使',
        description: 'フルーツをモチーフにした愛らしい天使',
        imageUrl: 'https://picsum.photos/800/600?random=30',
        thumbnailUrl: 'https://picsum.photos/400/300?random=30',
        tags: ['天使', 'フルーツ', 'カラフル', 'かわいい'],
        style: 'ポップアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'ネオンシティキャット',
        description: 'ネオン街を歩くクールな猫',
        imageUrl: 'https://picsum.photos/800/600?random=31',
        thumbnailUrl: 'https://picsum.photos/400/300?random=31',
        tags: ['猫', 'ネオン', 'シティ', 'クール'],
        style: 'ポップアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'ポップ魔法少女',
        description: 'カラフルでポップな魔法少女',
        imageUrl: 'https://picsum.photos/800/600?random=32',
        thumbnailUrl: 'https://picsum.photos/400/300?random=32',
        tags: ['魔法少女', 'ポップ', 'カラフル', 'キュート'],
        style: 'ポップアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'ファンキーロボット',
        description: 'ディスコで踊るファンキーなロボット',
        imageUrl: 'https://picsum.photos/800/600?random=33',
        thumbnailUrl: 'https://picsum.photos/400/300?random=33',
        tags: ['ロボット', 'ファンキー', 'ディスコ', 'ダンス'],
        style: 'ポップアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'スペースアドベンチャー',
        description: 'カラフルな宇宙での冒険ストーリー',
        imageUrl: 'https://picsum.photos/800/600?random=34',
        thumbnailUrl: 'https://picsum.photos/400/300?random=34',
        tags: ['宇宙', '冒険', 'カラフル', 'ポップ'],
        style: 'ポップアート',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'ポップコーンタワー',
        description: '空に届くほど高いポップコーンの塔',
        imageUrl: 'https://picsum.photos/800/600?random=35',
        thumbnailUrl: 'https://picsum.photos/400/300?random=35',
        tags: ['ポップコーン', 'タワー', 'ポップ', 'ファンタジー'],
        style: 'ポップアート',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'カラフルフォレスト',
        description: '色とりどりの幻想的な森',
        imageUrl: 'https://picsum.photos/800/600?random=36',
        thumbnailUrl: 'https://picsum.photos/400/300?random=36',
        tags: ['森', 'カラフル', 'ファンタジー', '自然'],
        style: 'ポップアート',
        category: ArtworkCategory.BACKGROUND,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'ビーチバケーション',
        description: '楽しいビーチでのバケーション風景',
        imageUrl: 'https://picsum.photos/800/600?random=37',
        thumbnailUrl: 'https://picsum.photos/400/300?random=37',
        tags: ['ビーチ', 'バケーション', '夏', '楽しい'],
        style: 'ポップアート',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'フルーツパーティー',
        description: 'フルーツたちの楽しいパーティー',
        imageUrl: 'https://picsum.photos/800/600?random=38',
        thumbnailUrl: 'https://picsum.photos/400/300?random=38',
        tags: ['フルーツ', 'パーティー', 'カラフル', '楽しい'],
        style: 'ポップアート',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist3.id,
        title: 'アイスクリームキャッスル',
        description: 'アイスクリームでできた夢のお城',
        imageUrl: 'https://picsum.photos/800/600?random=39',
        thumbnailUrl: 'https://picsum.photos/400/300?random=39',
        tags: ['アイスクリーム', '城', '夢', '甘い'],
        style: 'ポップアート',
        category: ArtworkCategory.BACKGROUND,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),

    // Artist4's artworks (minimal style) - 10 pieces
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'シンプルキャット',
        description: 'ミニマルでシンプルな猫のイラスト',
        imageUrl: 'https://picsum.photos/800/600?random=40',
        thumbnailUrl: 'https://picsum.photos/400/300?random=40',
        tags: ['猫', 'ミニマル', 'シンプル', 'モノトーン'],
        style: 'ミニマル',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'ジオメトリックバード',
        description: '幾何学的なデザインの美しい鳥',
        imageUrl: 'https://picsum.photos/800/600?random=41',
        thumbnailUrl: 'https://picsum.photos/400/300?random=41',
        tags: ['鳥', '幾何学', 'ミニマル', 'デザイン'],
        style: 'ミニマル',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'アブストラクトフェイス',
        description: '抽象的で美しい顔のデザイン',
        imageUrl: 'https://picsum.photos/800/600?random=42',
        thumbnailUrl: 'https://picsum.photos/400/300?random=42',
        tags: ['顔', 'アブストラクト', 'ミニマル', 'アート'],
        style: 'ミニマル',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'クリーンロゴ',
        description: 'シンプルで洗練されたロゴデザイン',
        imageUrl: 'https://picsum.photos/800/600?random=43',
        thumbnailUrl: 'https://picsum.photos/400/300?random=43',
        tags: ['ロゴ', 'クリーン', 'シンプル', 'ブランド'],
        style: 'ミニマル',
        category: ArtworkCategory.LOGO,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'モノトーンポートレート',
        description: 'モノトーンで描かれた美しいポートレート',
        imageUrl: 'https://picsum.photos/800/600?random=44',
        thumbnailUrl: 'https://picsum.photos/400/300?random=44',
        tags: ['ポートレート', 'モノトーン', 'ミニマル', '美しい'],
        style: 'ミニマル',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'アイコンセット',
        description: 'シンプルで使いやすいアイコンのセット',
        imageUrl: 'https://picsum.photos/800/600?random=45',
        thumbnailUrl: 'https://picsum.photos/400/300?random=45',
        tags: ['アイコン', 'セット', 'UI', 'シンプル'],
        style: 'ミニマル',
        category: ArtworkCategory.OTHER,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'ラインアート',
        description: '一本の線で描かれた美しいアート',
        imageUrl: 'https://picsum.photos/800/600?random=46',
        thumbnailUrl: 'https://picsum.photos/400/300?random=46',
        tags: ['ライン', 'アート', 'ミニマル', '一筆書き'],
        style: 'ミニマル',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'タイポグラフィ',
        description: '美しいタイポグラフィデザイン',
        imageUrl: 'https://picsum.photos/800/600?random=47',
        thumbnailUrl: 'https://picsum.photos/400/300?random=47',
        tags: ['タイポグラフィ', '文字', 'デザイン', 'ミニマル'],
        style: 'ミニマル',
        category: ArtworkCategory.LOGO,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'ネガティブスペース',
        description: '余白を活かしたデザイン',
        imageUrl: 'https://picsum.photos/800/600?random=48',
        thumbnailUrl: 'https://picsum.photos/400/300?random=48',
        tags: ['余白', 'ネガティブスペース', 'ミニマル', 'デザイン'],
        style: 'ミニマル',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist4.id,
        title: 'シンプルナチュラル',
        description: 'シンプルで自然なイラスト',
        imageUrl: 'https://picsum.photos/800/600?random=49',
        thumbnailUrl: 'https://picsum.photos/400/300?random=49',
        tags: ['自然', 'シンプル', 'ミニマル', '植物'],
        style: 'ミニマル',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),

    // Artist5's artworks (retro style) - 12 pieces
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: '80sネオンガール',
        description: '80年代スタイルのネオンガール',
        imageUrl: 'https://picsum.photos/800/600?random=50',
        thumbnailUrl: 'https://picsum.photos/400/300?random=50',
        tags: ['80s', 'ネオン', 'レトロ', 'ガール'],
        style: '80年代',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'ピクセルヒーロー',
        description: 'レトロゲーム風ピクセルヒーロー',
        imageUrl: 'https://picsum.photos/800/600?random=51',
        thumbnailUrl: 'https://picsum.photos/400/300?random=51',
        tags: ['ピクセル', 'ヒーロー', 'レトロ', 'ゲーム'],
        style: 'ピクセルアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'ビンテージスペースシップ',
        description: 'レトロな未来感あふれる宇宙船',
        imageUrl: 'https://picsum.photos/800/600?random=52',
        thumbnailUrl: 'https://picsum.photos/400/300?random=52',
        tags: ['宇宙船', 'ビンテージ', 'レトロ', 'SF'],
        style: 'レトロSF',
        category: ArtworkCategory.CONCEPT_ART,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'レトロカーレース',
        description: '80年代のカーレースゲーム風イラスト',
        imageUrl: 'https://picsum.photos/800/600?random=53',
        thumbnailUrl: 'https://picsum.photos/400/300?random=53',
        tags: ['レース', 'レトロ', 'カー', 'ゲーム'],
        style: 'ピクセルアート',
        category: ArtworkCategory.ILLUSTRATION,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'ディスコダンサー',
        description: '70年代ディスコで踊る人々',
        imageUrl: 'https://picsum.photos/800/600?random=54',
        thumbnailUrl: 'https://picsum.photos/400/300?random=54',
        tags: ['ディスコ', '70年代', 'ダンス', 'レトロ'],
        style: '70年代',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'アーケードキング',
        description: 'レトロゲームセンターの王者',
        imageUrl: 'https://picsum.photos/800/600?random=55',
        thumbnailUrl: 'https://picsum.photos/400/300?random=55',
        tags: ['アーケード', 'ゲーム', 'レトロ', 'キング'],
        style: 'ピクセルアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'ビンテージロボット',
        description: 'レトロSF映画風のロボット',
        imageUrl: 'https://picsum.photos/800/600?random=56',
        thumbnailUrl: 'https://picsum.photos/400/300?random=56',
        tags: ['ロボット', 'ビンテージ', 'SF', 'レトロ'],
        style: 'レトロSF',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: '80sシティナイト',
        description: '80年代の夜の街並み',
        imageUrl: 'https://picsum.photos/800/600?random=57',
        thumbnailUrl: 'https://picsum.photos/400/300?random=57',
        tags: ['80s', '夜', '街', 'ネオン'],
        style: '80年代',
        category: ArtworkCategory.BACKGROUND,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'レトロスポーツカー',
        description: 'クラシックなスポーツカーのデザイン',
        imageUrl: 'https://picsum.photos/800/600?random=58',
        thumbnailUrl: 'https://picsum.photos/400/300?random=58',
        tags: ['スポーツカー', 'レトロ', 'クラシック', '車'],
        style: 'ビンテージ',
        category: ArtworkCategory.CONCEPT_ART,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'ファミコン戦士',
        description: 'ファミコン時代のRPGヒーロー',
        imageUrl: 'https://picsum.photos/800/600?random=59',
        thumbnailUrl: 'https://picsum.photos/400/300?random=59',
        tags: ['ファミコン', 'RPG', 'ヒーロー', 'ピクセル'],
        style: 'ピクセルアート',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    }),
    prisma.artwork.create({
      data: {
        artistUserId: artist5.id,
        title: 'ネオンサーファー',
        description: '80年代風ネオンサーファー',
        imageUrl: 'https://picsum.photos/800/600?random=60',
        thumbnailUrl: 'https://picsum.photos/400/300?random=60',
        tags: ['サーファー', 'ネオン', '80s', 'サーフィン'],
        style: '80年代',
        category: ArtworkCategory.CHARACTER_DESIGN,
        isPublic: true,
        width: 800,
        height: 600
      }
    })
  ]);

  // Create diverse user likes for better recommendation testing
  await Promise.all([
    // VTuber1 likes cute/kawaii artworks
    prisma.userLike.create({
      data: {
        userId: vtuber1.id,
        artworkId: artworks[0].id, // 猫耳少女
        isLike: true,
        context: { source: 'recommendation', viewTime: 15 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: vtuber1.id,
        artworkId: artworks[1].id, // 魔法少女
        isLike: true,
        context: { source: 'recommendation', viewTime: 22 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: vtuber1.id,
        artworkId: artworks[2].id, // うさぎマスコット
        isLike: true,
        context: { source: 'browse', viewTime: 8 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: vtuber1.id,
        artworkId: artworks[4].id, // 桜の精霊
        isLike: true,
        context: { source: 'recommendation', viewTime: 18 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: vtuber1.id,
        artworkId: artworks[6].id, // ふわふわパンダ
        isLike: true,
        context: { source: 'recommendation', viewTime: 12 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: vtuber1.id,
        artworkId: artworks[28].id, // レインボーユニコーン
        isLike: true,
        context: { source: 'browse', viewTime: 25 }
      }
    }),
    // VTuber2 likes cool/dark artworks
    prisma.userLike.create({
      data: {
        userId: vtuber2.id,
        artworkId: artworks[12].id, // ドラゴンナイト
        isLike: true,
        context: { source: 'recommendation', viewTime: 30 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: vtuber2.id,
        artworkId: artworks[14].id, // メカスーツ
        isLike: true,
        context: { source: 'recommendation', viewTime: 28 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: vtuber2.id,
        artworkId: artworks[17].id, // ネオンサムライ
        isLike: true,
        context: { source: 'browse', viewTime: 35 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: vtuber2.id,
        artworkId: artworks[50].id, // 80sネオンガール
        isLike: true,
        context: { source: 'recommendation', viewTime: 20 }
      }
    }),
    // Artist1 likes colorful/diverse artworks
    prisma.userLike.create({
      data: {
        userId: artist1.id,
        artworkId: artworks[28].id, // レインボーユニコーン
        isLike: true,
        context: { source: 'browse', viewTime: 15 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: artist1.id,
        artworkId: artworks[31].id, // ネオンシティキャット
        isLike: true,
        context: { source: 'recommendation', viewTime: 18 }
      }
    }),
    prisma.userLike.create({
      data: {
        userId: artist1.id,
        artworkId: artworks[40].id, // シンプルキャット
        isLike: true,
        context: { source: 'browse', viewTime: 12 }
      }
    })
  ]);

  console.log('✅ Database seeding completed!');
  console.log('📊 Created:');
  console.log(`  - ${2} VTuber users`);
  console.log(`  - ${5} Artist users`);
  console.log(`  - ${artworks.length} Artworks (diverse styles)`);
  console.log(`  - ${13} User likes (recommendation testing)`);
  console.log(`  - ${2} Demo matches`);
  console.log('');
  console.log('🎨 Artwork breakdown:');
  console.log('  - 12 kawaii/anime style artworks (PixelMaster)');
  console.log('  - 15 dark/cool style artworks (DarkArtistX)');
  console.log('  - 12 colorful/pop style artworks (ColorfulArt)');
  console.log('  - 10 minimal style artworks (MinimalDesign)');
  console.log('  - 12 retro style artworks (RetroVibe)');
  console.log('');
  console.log('🔐 Demo credentials:');
  console.log('  VTuber: vtuber1@demo.com / Demo123!');
  console.log('  VTuber: vtuber2@demo.com / Demo123!');
  console.log('  Artist: artist1@demo.com / Demo123!');
  console.log('  Artist: artist2@demo.com / Demo123!');
  console.log('  Artist: artist3@demo.com / Demo123!');
  console.log('  Artist: artist4@demo.com / Demo123!');
  console.log('  Artist: artist5@demo.com / Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
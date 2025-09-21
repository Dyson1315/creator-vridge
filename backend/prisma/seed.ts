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
          bio: 'プロのイラストレーターです。可愛いキャラクターから幻想的なアートまで幅広く対応できます。',
          skills: ['キャラクターデザイン', 'Live2D', 'アニメ調イラスト', 'コンセプトアート'],
          priceRangeMin: 80,
          priceRangeMax: 300,
          availability: AvailabilityStatus.AVAILABLE,
          timezone: 'Asia/Tokyo',
          preferredCommStyle: 'detailed',
          experience: 5,
          rating: 4.8,
          totalReviews: 23,
          portfolioUrls: [
            'https://example.com/portfolio1.jpg',
            'https://example.com/portfolio2.jpg'
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
          bio: 'ダークファンタジー、SF、メカ系のアートが得意です。複雑で詳細なデザインも対応可能。',
          skills: ['コンセプトアート', 'メカデザイン', 'ダークファンタジー', '3Dモデリング'],
          priceRangeMin: 150,
          priceRangeMax: 800,
          availability: AvailabilityStatus.BUSY,
          timezone: 'Europe/London',
          preferredCommStyle: 'professional',
          experience: 8,
          rating: 4.9,
          totalReviews: 45,
          portfolioUrls: [
            'https://example.com/dark1.jpg',
            'https://example.com/mecha1.jpg'
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

  // Create demo artworks
  const artworks = await Promise.all([
    // Artist1's artworks (kawaii style)
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
    // Artist2's artworks (dark/cool style)
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
    })
  ]);

  // Create some sample user likes (VTuber1 likes cute artworks)
  await Promise.all([
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
    })
  ]);

  console.log('✅ Database seeding completed!');
  console.log('📊 Created:');
  console.log(`  - ${2} VTuber users`);
  console.log(`  - ${2} Artist users`);
  console.log(`  - ${artworks.length} Artworks`);
  console.log(`  - ${3} User likes`);
  console.log(`  - ${2} Demo matches`);
  console.log('');
  console.log('🔐 Demo credentials:');
  console.log('  VTuber: vtuber1@demo.com / Demo123!');
  console.log('  VTuber: vtuber2@demo.com / Demo123!');
  console.log('  Artist: artist1@demo.com / Demo123!');
  console.log('  Artist: artist2@demo.com / Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 CreatorVridge データベース確認\n');
    
    // 基本テーブル
    const userCount = await prisma.user.count();
    const profileCount = await prisma.profile.count();
    const artworkCount = await prisma.artwork.count();
    const likeCount = await prisma.userLike.count();
    
    console.log('📊 基本テーブル:');
    console.log(`  👥 Users: ${userCount}`);
    console.log(`  📄 Profiles: ${profileCount}`);
    console.log(`  🎨 Artworks: ${artworkCount}`);
    console.log(`  ❤️  User Likes: ${likeCount}\n`);
    
    // AI推薦システムテーブル
    const prefCount = await prisma.userPreferenceProfile.count();
    const analysisCount = await prisma.artworkAnalysis.count();
    const precompCount = await prisma.precomputedRecommendation.count();
    
    console.log('🤖 AI推薦システム:');
    console.log(`  🧠 User Preference Profiles: ${prefCount}`);
    console.log(`  🔍 Artwork Analysis: ${analysisCount}`);
    console.log(`  ⚡ Precomputed Recommendations: ${precompCount}\n`);
    
    // その他テーブル
    const matchCount = await prisma.match.count();
    const messageCount = await prisma.message.count();
    const contractCount = await prisma.contractRequest.count();
    const transactionCount = await prisma.transaction.count();
    const behaviorCount = await prisma.userBehaviorLog.count();
    const recHistoryCount = await prisma.recommendationHistory.count();
    
    console.log('📋 その他テーブル:');
    console.log(`  🤝 Matches: ${matchCount}`);
    console.log(`  💬 Messages: ${messageCount}`);
    console.log(`  📝 Contract Requests: ${contractCount}`);
    console.log(`  💰 Transactions: ${transactionCount}`);
    console.log(`  👆 User Behavior Logs: ${behaviorCount}`);
    console.log(`  📊 Recommendation History: ${recHistoryCount}\n`);
    
    // サンプルデータ確認
    if (userCount > 0) {
      console.log('👤 サンプルユーザー:');
      const users = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          email: true,
          userType: true,
          createdAt: true
        }
      });
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.userType})`);
      });
    }
    
    console.log('\n✅ データベース確認完了');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
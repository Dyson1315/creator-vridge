const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewTables() {
  try {
    console.log('Testing new AI recommendation tables...\n');
    
    // Test UserPreferenceProfile table
    console.log('1. Testing UserPreferenceProfile table:');
    const userProfile = await prisma.userPreferenceProfile.findMany();
    console.log(`   Found ${userProfile.length} user preference profiles`);
    
    // Test ArtworkAnalysis table
    console.log('2. Testing ArtworkAnalysis table:');
    const artworkAnalysis = await prisma.artworkAnalysis.findMany();
    console.log(`   Found ${artworkAnalysis.length} artwork analyses`);
    
    // Test PrecomputedRecommendation table  
    console.log('3. Testing PrecomputedRecommendation table:');
    const precomputedRecs = await prisma.precomputedRecommendation.findMany();
    console.log(`   Found ${precomputedRecs.length} precomputed recommendations`);
    
    console.log('\n✅ All new AI recommendation tables are working correctly!');
    
    // Test existing tables still work
    console.log('\n4. Testing existing tables:');
    const users = await prisma.user.findMany();
    const artworks = await prisma.artwork.findMany();
    const userLikes = await prisma.userLike.findMany();
    
    console.log(`   Users: ${users.length}`);
    console.log(`   Artworks: ${artworks.length}`);
    console.log(`   User Likes: ${userLikes.length}`);
    
    console.log('\n✅ All existing tables are still working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewTables();
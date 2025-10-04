const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAvatarData() {
  try {
    console.log('🔍 Checking avatar data in database...');
    
    // Get all profiles with avatar information
    const profiles = await prisma.profile.findMany({
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        avatarData: true,
        avatarMimeType: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${profiles.length} profiles:`);
    
    for (const profile of profiles) {
      console.log('\n-------------------');
      console.log(`👤 User: ${profile.user.email}`);
      console.log(`📝 Display Name: ${profile.displayName || 'Not set'}`);
      console.log(`🖼️  Avatar URL: ${profile.avatarUrl ? 'Set' : 'Not set'}`);
      console.log(`📦 Avatar Data: ${profile.avatarData ? `${profile.avatarData.length} characters` : 'Not set'}`);
      console.log(`🏷️  MIME Type: ${profile.avatarMimeType || 'Not set'}`);
      
      if (profile.avatarData) {
        console.log(`📏 Avatar Data Preview: ${profile.avatarData.substring(0, 50)}...`);
      }
    }

    // Count profiles with avatar data
    const profilesWithAvatarData = profiles.filter(p => p.avatarData);
    console.log(`\n✅ Profiles with avatar data: ${profilesWithAvatarData.length}/${profiles.length}`);
    
  } catch (error) {
    console.error('❌ Error checking avatar data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvatarData();
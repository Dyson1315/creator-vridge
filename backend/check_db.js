const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== Database Content Check ===\n');
    
    // Check users table
    const users = await prisma.user.findMany({
      include: {
        profile: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`User Type: ${user.userType}`);
      console.log(`Status: ${user.status}`);
      console.log(`Password Hash: ${user.passwordHash.substring(0, 20)}...`);
      console.log(`Created: ${user.createdAt}`);
      
      if (user.profile) {
        console.log('\nProfile:');
        console.log(`  Display Name: ${user.profile.displayName || 'null'}`);
        console.log(`  Bio: ${user.profile.bio || 'null'}`);
        console.log(`  Avatar URL: ${user.profile.avatarUrl || 'null'}`);
        console.log(`  Avatar Data: ${user.profile.avatarData ? `${user.profile.avatarData.substring(0, 50)}...` : 'null'}`);
        console.log(`  Avatar MIME Type: ${user.profile.avatarMimeType || 'null'}`);
        console.log(`  Profile Created: ${user.profile.createdAt}`);
        console.log(`  Profile Updated: ${user.profile.updatedAt}`);
      } else {
        console.log('\nProfile: No profile found');
      }
    });
    
    // Check profiles table directly
    console.log('\n=== Direct Profiles Table Query ===');
    const profiles = await prisma.profile.findMany();
    console.log(`Found ${profiles.length} profiles in total`);
    
    profiles.forEach((profile, index) => {
      console.log(`\nProfile ${index + 1}:`);
      console.log(`  ID: ${profile.id}`);
      console.log(`  User ID: ${profile.userId}`);
      console.log(`  Display Name: ${profile.displayName || 'null'}`);
      console.log(`  Avatar Data Length: ${profile.avatarData ? profile.avatarData.length : 0} characters`);
      console.log(`  Avatar MIME Type: ${profile.avatarMimeType || 'null'}`);
      console.log(`  Created: ${profile.createdAt}`);
      console.log(`  Updated: ${profile.updatedAt}`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
const fetch = require('node-fetch');

async function testAuthMe() {
  try {
    console.log('🔍 Testing /api/v1/auth/me endpoint...');
    
    // First login to get token
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        email: 'vtuber1@demo.com',
        password: 'Demo123!'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    console.log('✅ Login successful!');
    console.log('🎭 Login profile avatar:', loginData.data.user.profile?.avatarUrl ? 'Present' : 'Not present');

    // Test /me endpoint
    const meResponse = await fetch('http://localhost:3001/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000'
      }
    });

    if (!meResponse.ok) {
      console.error('❌ /me request failed:', await meResponse.text());
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ /me request successful!');
    
    const profile = meData.data.profile;
    if (profile) {
      console.log('👤 Profile found:');
      console.log('  - Display Name:', profile.displayName);
      console.log('  - Avatar URL:', profile.avatarUrl ? 'Present (data URI)' : 'Not present');
      console.log('  - Avatar Data:', profile.avatarData ? 'Still present (should be null)' : 'Properly removed');
      console.log('  - Avatar MIME:', profile.avatarMimeType ? 'Still present (should be null)' : 'Properly removed');
      
      if (profile.avatarUrl && profile.avatarUrl.startsWith('data:')) {
        console.log('✅ Avatar URL is properly formatted as data URI');
        console.log('📏 Avatar URL length:', profile.avatarUrl.length);
      } else {
        console.log('❌ Avatar URL is not properly formatted or missing');
      }
    } else {
      console.log('❌ No profile found');
    }

  } catch (error) {
    console.error('❌ Error testing auth/me:', error);
  }
}

testAuthMe();
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// Test avatar upload functionality
async function testAvatarUpload() {
  console.log('=== Avatar Upload API Test ===\n');
  
  try {
    // Step 1: Login as test user
    console.log('1. Logging in as test user...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'vtuber1@demo.com',
      password: 'Demo123!'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/'
      },
      withCredentials: true
    });
    
    console.log('Login successful!');
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data?.token || loginResponse.data.token || loginResponse.data.accessToken;
    console.log('Token:', token ? token.substring(0, 50) + '...' : 'No token found');
    
    // Step 2: Check if we have any sample image files
    const uploadsDir = '/home/dyson/workspace/creator-vridge/backend/uploads/avatars';
    const files = fs.readdirSync(uploadsDir);
    console.log('\n2. Available avatar files:', files);
    
    if (files.length === 0) {
      console.log('No test images available. Creating a small test PNG...');
      
      // Create a minimal 1x1 PNG for testing
      const minimalPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE, // IHDR CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x78, 0x9C, 0x62, 0xF8, 0x0F, 0x00, 0x01, 0x01, 0x01, 0x00, // compressed data
        0x18, 0xDD, 0x8D, 0xB4, // IDAT CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // IEND CRC
      ]);
      
      fs.writeFileSync('/tmp/test-avatar.png', minimalPNG);
      console.log('Created minimal test PNG');
    }
    
    // Step 3: Upload avatar
    console.log('\n3. Uploading avatar...');
    
    const testImagePath = files.length > 0 
      ? `${uploadsDir}/${files[0]}` 
      : '/tmp/test-avatar.png';
    
    console.log('Using image:', testImagePath);
    
    const form = new FormData();
    form.append('avatar', fs.createReadStream(testImagePath));
    
    const uploadResponse = await axios.post('http://localhost:3001/api/v1/users/avatar', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/'
      },
      withCredentials: true,
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024
    });
    
    console.log('Upload successful!');
    console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));
    
    // Step 4: Verify the data was saved correctly
    console.log('\n4. Verifying database storage...');
    
    const meResponse = await axios.get('http://localhost:3001/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/'
      },
      withCredentials: true
    });
    
    console.log('Profile data retrieved:');
    console.log('Display Name:', meResponse.data.data.profile?.displayName);
    console.log('Avatar URL length:', meResponse.data.data.profile?.avatarUrl?.length || 0);
    console.log('Avatar URL starts with data:', meResponse.data.data.profile?.avatarUrl?.startsWith('data:'));
    
  } catch (error) {
    console.error('Error during test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAvatarUpload();
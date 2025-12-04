#!/usr/bin/env node

/**
 * Test the Last Wish APIs running locally
 */

const LOCAL_API_BASE_URL = 'http://localhost:3001/api';

async function testLocalAPIs() {
  console.log('🧪 Testing Local Last Wish APIs');
  console.log('================================');
  console.log(`Testing against: ${LOCAL_API_BASE_URL}`);
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Last Wish Check Endpoint
  try {
    console.log('\n1. Testing Last Wish check endpoint...');
    const response = await fetch(`${LOCAL_API_BASE_URL}/last-wish-check`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Last Wish check passed');
      console.log(`   Response: ${JSON.stringify(data)}`);
      passed++;
    } else {
      console.log(`❌ Last Wish check failed: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Last Wish check error: ${error.message}`);
    failed++;
  }
  
  // Test 2: Last Wish Public Endpoint
  try {
    console.log('\n2. Testing Last Wish public endpoint...');
    const response = await fetch(`${LOCAL_API_BASE_URL}/last-wish-public`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Last Wish public passed');
      console.log(`   Response: ${JSON.stringify(data)}`);
      passed++;
    } else {
      console.log(`❌ Last Wish public failed: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Last Wish public error: ${error.message}`);
    failed++;
  }
  
  // Test 3: CORS Headers
  try {
    console.log('\n3. Testing CORS headers...');
    const response = await fetch(`${LOCAL_API_BASE_URL}/last-wish-public`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    const corsMethods = response.headers.get('Access-Control-Allow-Methods');
    
    if (corsOrigin && corsMethods) {
      console.log('✅ CORS headers present');
      console.log(`   Origin: ${corsOrigin}`);
      console.log(`   Methods: ${corsMethods}`);
      passed++;
    } else {
      console.log('❌ CORS headers missing');
      console.log(`   Origin: ${corsOrigin}`);
      console.log(`   Methods: ${corsMethods}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ CORS test error: ${error.message}`);
    failed++;
  }
  
  // Test 4: Check if local server is running
  try {
    console.log('\n4. Testing local server connectivity...');
    const response = await fetch(`${LOCAL_API_BASE_URL}/last-wish-public`, {
      method: 'GET'
    });
    
    if (response.status !== 0) {
      console.log('✅ Local server is running');
      passed++;
    } else {
      console.log('❌ Local server not responding');
      failed++;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Local server not running - start with: npx vercel dev --listen 3001');
      failed++;
    } else {
      console.log(`❌ Connection error: ${error.message}`);
      failed++;
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All local APIs are working correctly!');
    console.log('💡 You can now test the Last Wish system locally.');
  } else if (failed === 1 && passed === 3) {
    console.log('\n⚠️  Local server might not be running.');
    console.log('💡 Start it with: npx vercel dev --listen 3001');
  } else {
    console.log('\n❌ Some APIs are not working locally.');
    console.log('💡 Check the error messages above for details.');
  }
  
  console.log('\n✅ Local test completed!');
}

// Run the test
testLocalAPIs().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});

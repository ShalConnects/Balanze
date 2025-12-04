#!/usr/bin/env node

/**
 * Test the original Last Wish API endpoints
 */

const API_BASE_URL = 'https://balanze.cash/api';

async function testOriginalAPIs() {
  console.log('🧪 Testing Original Last Wish APIs');
  console.log('==================================');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Last Wish Check Endpoint
  try {
    console.log('\n1. Testing Last Wish check endpoint...');
    const response = await fetch(`${API_BASE_URL}/last-wish-check`, {
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
      failed++;
    }
  } catch (error) {
    console.log(`❌ Last Wish check error: ${error.message}`);
    failed++;
  }
  
  // Test 2: Last Wish Public Endpoint
  try {
    console.log('\n2. Testing Last Wish public endpoint...');
    const response = await fetch(`${API_BASE_URL}/last-wish-public`, {
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
      failed++;
    }
  } catch (error) {
    console.log(`❌ Last Wish public error: ${error.message}`);
    failed++;
  }
  
  // Test 3: CORS Headers
  try {
    console.log('\n3. Testing CORS headers...');
    const response = await fetch(`${API_BASE_URL}/last-wish-public`, {
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
      failed++;
    }
  } catch (error) {
    console.log(`❌ CORS test error: ${error.message}`);
    failed++;
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All original APIs are working correctly!');
  } else {
    console.log('\n❌ Some APIs are not working. The system may need deployment.');
  }
  
  console.log('\n✅ Test completed!');
}

// Run the test
testOriginalAPIs().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});

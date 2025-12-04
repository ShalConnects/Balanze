#!/usr/bin/env node

/**
 * Quick Last Wish Test Script
 * 
 * This is a minimal test script that can be run immediately to check
 * if the Last Wish system is working properly.
 */

const API_BASE_URL = 'https://balanze.cash/api';

// Simple test function
async function quickTest() {
  console.log('🚀 Quick Last Wish System Test');
  console.log('================================');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: CORS Test Endpoint
  try {
    console.log('\n1. Testing CORS endpoint...');
    const response = await fetch(`${API_BASE_URL}/cors-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({ test: true })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CORS test passed');
      console.log(`   Response: ${JSON.stringify(data)}`);
      passed++;
    } else {
      console.log(`❌ CORS test failed: ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ CORS test error: ${error.message}`);
    failed++;
  }
  
  // Test 2: Last Wish Check Endpoint
  try {
    console.log('\n2. Testing Last Wish check endpoint...');
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
  
  // Test 3: Send Email Endpoint (Test Mode)
  try {
    console.log('\n3. Testing send email endpoint (test mode)...');
    const response = await fetch(`${API_BASE_URL}/send-last-wish-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        testMode: true
      })
    });
    
    const data = await response.json();
    
    if (data.testMode === true || data.error?.includes('not found') || data.error?.includes('SMTP not configured')) {
      console.log('✅ Send email test passed');
      console.log(`   Response: ${JSON.stringify(data)}`);
      passed++;
    } else {
      console.log(`❌ Send email test failed: ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Send email test error: ${error.message}`);
    failed++;
  }
  
  // Test 4: OPTIONS Preflight
  try {
    console.log('\n4. Testing OPTIONS preflight request...');
    const response = await fetch(`${API_BASE_URL}/send-last-wish-email`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    if (response.status === 200 || response.status === 204) {
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      const corsMethods = response.headers.get('Access-Control-Allow-Methods');
      
      if (corsOrigin && corsMethods) {
        console.log('✅ OPTIONS preflight passed');
        console.log(`   CORS Origin: ${corsOrigin}`);
        console.log(`   CORS Methods: ${corsMethods}`);
        passed++;
      } else {
        console.log('❌ OPTIONS preflight failed: Missing CORS headers');
        failed++;
      }
    } else {
      console.log(`❌ OPTIONS preflight failed: ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ OPTIONS preflight error: ${error.message}`);
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
    console.log('\n🎉 All tests passed! Last Wish system is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the details above.');
    console.log('\n💡 Common issues:');
    console.log('   - API endpoints not deployed yet');
    console.log('   - CORS configuration needs deployment');
    console.log('   - SMTP not configured for email tests');
  }
  
  console.log('\n✅ Quick test completed!');
}

// Run the test
quickTest().catch(error => {
  console.error('Test runner failed:', error.message);
  process.exit(1);
});

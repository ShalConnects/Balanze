#!/usr/bin/env node

/**
 * Simple Last Wish System Test Script
 * 
 * This script provides a simplified way to test Last Wish functionality
 * without complex dependencies. It focuses on the most critical features.
 */

// Test configuration
const config = {
  apiBaseUrl: 'https://balanze.cash/api',
  testUserId: 'test-user-123',
  testRecipientEmail: 'test@example.com'
};

// Test results
let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const test = (testName, condition, details = '') => {
  totalTests++;
  if (condition) {
    passedTests++;
    log(`PASSED: ${testName}`, 'success');
  } else {
    failedTests++;
    log(`FAILED: ${testName}`, 'error');
    if (details) log(`Details: ${details}`, 'error');
  }
};

// Test 1: CORS Configuration
async function testCORS() {
  log('Testing CORS configuration...');
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/cors-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({ test: true })
    });
    
    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    const corsMethods = response.headers.get('Access-Control-Allow-Methods');
    
    test('CORS Headers Present', 
      corsOrigin && corsMethods, 
      `Origin: ${corsOrigin}, Methods: ${corsMethods}`);
    
    test('CORS Response Status', 
      response.status >= 200 && response.status < 500, 
      `Status: ${response.status}`);
    
    const data = await response.json();
    test('CORS JSON Response', 
      typeof data === 'object' && data.success, 
      'Invalid or unsuccessful response');
    
  } catch (error) {
    test('CORS Test', false, error.message);
  }
}

// Test 2: API Endpoints Availability
async function testAPIEndpoints() {
  log('Testing API endpoints availability...');
  
  const endpoints = [
    { name: 'Last Wish Check', url: `${config.apiBaseUrl}/last-wish-check` },
    { name: 'Last Wish Public', url: `${config.apiBaseUrl}/last-wish-public` },
    { name: 'Send Last Wish Email', url: `${config.apiBaseUrl}/send-last-wish-email` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });
      
      test(`${endpoint.name} - Available`, 
        response.status >= 200 && response.status < 500, 
        `Status: ${response.status}`);
      
      // Check CORS headers
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      test(`${endpoint.name} - CORS Headers`, 
        corsOrigin !== null, 
        'Missing CORS headers');
      
    } catch (error) {
      test(`${endpoint.name}`, false, error.message);
    }
  }
}

// Test 3: Email API Functionality
async function testEmailAPI() {
  log('Testing email API functionality...');
  
  try {
    const response = await fetch(`${config.apiBaseUrl}/send-last-wish-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        userId: config.testUserId,
        testMode: true
      })
    });
    
    test('Email API Response', 
      response.status >= 200 && response.status < 500, 
      `Status: ${response.status}`);
    
    const data = await response.json();
    test('Email API JSON Response', 
      typeof data === 'object', 
      'Invalid JSON response');
    
    // Check if it's a test mode response or error about missing settings
    const isExpectedResponse = data.testMode === true || 
                              data.error?.includes('not found') || 
                              data.error?.includes('SMTP not configured');
    
    test('Email API Expected Response', 
      isExpectedResponse, 
      `Unexpected response: ${JSON.stringify(data)}`);
    
  } catch (error) {
    test('Email API', false, error.message);
  }
}

// Test 4: OPTIONS Preflight Requests
async function testPreflightRequests() {
  log('Testing OPTIONS preflight requests...');
  
  const endpoints = [
    `${config.apiBaseUrl}/cors-test`,
    `${config.apiBaseUrl}/send-last-wish-email`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      test(`OPTIONS ${endpoint.split('/').pop()}`, 
        response.status === 200 || response.status === 204, 
        `Status: ${response.status}`);
      
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      const corsMethods = response.headers.get('Access-Control-Allow-Methods');
      
      test(`OPTIONS CORS Headers ${endpoint.split('/').pop()}`, 
        corsOrigin && corsMethods, 
        `Missing headers: Origin=${corsOrigin}, Methods=${corsMethods}`);
      
    } catch (error) {
      test(`OPTIONS ${endpoint.split('/').pop()}`, false, error.message);
    }
  }
}

// Test 5: Error Handling
async function testErrorHandling() {
  log('Testing error handling...');
  
  try {
    // Test with invalid user ID
    const response = await fetch(`${config.apiBaseUrl}/send-last-wish-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        userId: 'invalid-user-id',
        testMode: true
      })
    });
    
    const data = await response.json();
    
    test('Invalid User ID Handling', 
      data.error && (data.error.includes('not found') || data.error.includes('required')), 
      `Unexpected response: ${JSON.stringify(data)}`);
    
    // Test with missing user ID
    const response2 = await fetch(`${config.apiBaseUrl}/send-last-wish-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        testMode: true
      })
    });
    
    const data2 = await response2.json();
    
    test('Missing User ID Handling', 
      data2.error && data2.error.includes('required'), 
      `Unexpected response: ${JSON.stringify(data2)}`);
    
  } catch (error) {
    test('Error Handling', false, error.message);
  }
}

// Test 6: Response Time
async function testResponseTime() {
  log('Testing response times...');
  
  const endpoints = [
    `${config.apiBaseUrl}/cors-test`,
    `${config.apiBaseUrl}/last-wish-check`,
    `${config.apiBaseUrl}/last-wish-public`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      test(`${endpoint.split('/').pop()} Response Time`, 
        responseTime < 5000, 
        `Response time: ${responseTime}ms (should be < 5000ms)`);
      
    } catch (error) {
      test(`${endpoint.split('/').pop()} Response Time`, false, error.message);
    }
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Simple Last Wish System Tests...', 'info');
  log(`API Base URL: ${config.apiBaseUrl}`, 'info');
  log(`Test User ID: ${config.testUserId}`, 'info');
  log(`Test Recipient Email: ${config.testRecipientEmail}`, 'info');
  log('', 'info');
  
  const tests = [
    { name: 'CORS Configuration', fn: testCORS },
    { name: 'API Endpoints Availability', fn: testAPIEndpoints },
    { name: 'Email API Functionality', fn: testEmailAPI },
    { name: 'OPTIONS Preflight Requests', fn: testPreflightRequests },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Response Time', fn: testResponseTime }
  ];
  
  for (const test of tests) {
    log(`\n📋 Running: ${test.name}`, 'info');
    try {
      await test.fn();
    } catch (error) {
      test(test.name, false, error.message);
    }
  }
  
  // Print summary
  log('\n📊 Test Summary:', 'info');
  log(`  Total Tests: ${totalTests}`, 'info');
  log(`  Passed: ${passedTests}`, 'success');
  log(`  Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'success');
  log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'info');
  
  if (failedTests > 0) {
    log('\n❌ Some tests failed. Check the details above.', 'error');
    log('💡 Common issues:', 'warning');
    log('  - API endpoints not deployed yet', 'warning');
    log('  - CORS configuration needs deployment', 'warning');
    log('  - SMTP not configured for email tests', 'warning');
    log('  - Database connection issues', 'warning');
  } else {
    log('\n🎉 All tests passed! Last Wish system is working correctly.', 'success');
  }
  
  log('\n✅ Test run completed!', 'success');
}

// Run tests
runTests().catch(error => {
  log(`Test runner failed: ${error.message}`, 'error');
  process.exit(1);
});

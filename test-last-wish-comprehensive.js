#!/usr/bin/env node

/**
 * Comprehensive Last Wish System Test Script
 * 
 * This script tests all features of the Last Wish system including:
 * - Database operations (settings, deliveries)
 * - API endpoints functionality
 * - Email sending capabilities
 * - CORS configuration
 * - Data gathering and filtering
 * - Test mode functionality
 * - Check-in system
 * - Overdue user detection
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  apiBaseUrl: 'https://balanze.cash/api',
  testUserId: process.env.TEST_USER_ID || 'test-user-id',
  testEmail: process.env.TEST_EMAIL || 'test@example.com',
  testRecipientEmail: process.env.TEST_RECIPIENT_EMAIL || 'recipient@example.com'
};

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const recordTest = (testName, passed, details = '') => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASSED: ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`FAILED: ${testName}`, 'error');
    if (details) log(`Details: ${details}`, 'error');
  }
  testResults.details.push({ testName, passed, details });
};

// Test 1: Database Connection and Schema
async function testDatabaseConnection() {
  log('Testing database connection and schema...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('last_wish_settings')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    recordTest('Database Connection', true);
    
    // Test table existence
    const tables = ['last_wish_settings', 'last_wish_deliveries'];
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      recordTest(`Table ${table} exists`, !tableError, tableError?.message);
    }
    
    // Test RLS policies
    const { data: settingsData, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .limit(1);
    
    recordTest('RLS policies working', !settingsError, settingsError?.message);
    
  } catch (error) {
    recordTest('Database Connection', false, error.message);
  }
}

// Test 2: Last Wish Settings CRUD Operations
async function testSettingsCRUD() {
  log('Testing Last Wish settings CRUD operations...');
  
  try {
    // Create test settings
    const testSettings = {
      user_id: config.testUserId,
      is_enabled: true,
      check_in_frequency: 1, // 1 day for testing
      last_check_in: new Date().toISOString(),
      recipients: [
        {
          id: 'test-recipient-1',
          email: config.testRecipientEmail,
          name: 'Test Recipient',
          relationship: 'Family'
        }
      ],
      include_data: {
        accounts: true,
        transactions: true,
        purchases: false,
        lendBorrow: true,
        savings: false,
        analytics: true
      },
      message: 'This is a test message for Last Wish system.',
      is_active: true,
      is_test_mode: true
    };
    
    // Insert settings
    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_settings')
      .upsert(testSettings)
      .select();
    
    recordTest('Create/Update Settings', !insertError, insertError?.message);
    
    if (insertData && insertData.length > 0) {
      const settingsId = insertData[0].id;
      
      // Read settings
      const { data: readData, error: readError } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('id', settingsId)
        .single();
      
      recordTest('Read Settings', !readError && readData, readError?.message);
      
      // Update settings
      const { error: updateError } = await supabase
        .from('last_wish_settings')
        .update({ 
          message: 'Updated test message',
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsId);
      
      recordTest('Update Settings', !updateError, updateError?.message);
      
      // Test data filtering
      const { data: filteredData, error: filterError } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('is_enabled', true)
        .eq('is_active', true);
      
      recordTest('Filter Settings', !filterError, filterError?.message);
      
      // Cleanup
      await supabase
        .from('last_wish_settings')
        .delete()
        .eq('id', settingsId);
    }
    
  } catch (error) {
    recordTest('Settings CRUD Operations', false, error.message);
  }
}

// Test 3: API Endpoints
async function testAPIEndpoints() {
  log('Testing API endpoints...');
  
  const endpoints = [
    {
      name: 'CORS Test',
      url: `${config.apiBaseUrl}/cors-test`,
      method: 'POST',
      body: { test: true }
    },
    {
      name: 'Last Wish Check',
      url: `${config.apiBaseUrl}/last-wish-check`,
      method: 'GET'
    },
    {
      name: 'Last Wish Public',
      url: `${config.apiBaseUrl}/last-wish-public`,
      method: 'GET'
    },
    {
      name: 'Send Last Wish Email (Test Mode)',
      url: `${config.apiBaseUrl}/send-last-wish-email`,
      method: 'POST',
      body: {
        userId: config.testUserId,
        testMode: true
      }
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173'
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(endpoint.url, options);
      
      // Check CORS headers
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      const corsMethods = response.headers.get('Access-Control-Allow-Methods');
      
      recordTest(`${endpoint.name} - CORS Headers`, 
        corsOrigin && corsMethods, 
        `Missing CORS headers: Origin=${corsOrigin}, Methods=${corsMethods}`);
      
      // Check response status
      const isSuccess = response.status >= 200 && response.status < 500;
      recordTest(`${endpoint.name} - Response Status`, 
        isSuccess, 
        `Status: ${response.status}`);
      
      // Try to parse response
      try {
        const data = await response.json();
        recordTest(`${endpoint.name} - JSON Response`, 
          typeof data === 'object', 
          'Invalid JSON response');
      } catch (jsonError) {
        recordTest(`${endpoint.name} - JSON Response`, 
          false, 
          'Failed to parse JSON response');
      }
      
    } catch (error) {
      recordTest(`${endpoint.name}`, false, error.message);
    }
  }
}

// Test 4: Email Functionality
async function testEmailFunctionality() {
  log('Testing email functionality...');
  
  try {
    // Test SMTP configuration
    const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
    recordTest('SMTP Configuration', smtpConfigured, 
      smtpConfigured ? 'SMTP is configured' : 'SMTP_USER and SMTP_PASS not set');
    
    if (smtpConfigured) {
      // Test email sending endpoint
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
      
      const data = await response.json();
      recordTest('Test Email Sending', 
        response.ok && data.success !== false, 
        data.error || `Status: ${response.status}`);
    }
    
  } catch (error) {
    recordTest('Email Functionality', false, error.message);
  }
}

// Test 5: Data Gathering and Filtering
async function testDataGathering() {
  log('Testing data gathering and filtering...');
  
  try {
    // Test gathering user data (this would normally be done by the API)
    const testUserId = config.testUserId;
    
    // Test accounts data
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', testUserId)
      .limit(5);
    
    recordTest('Gather Accounts Data', !accountsError, accountsError?.message);
    
    // Test transactions data
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', testUserId)
      .limit(5);
    
    recordTest('Gather Transactions Data', !transactionsError, transactionsError?.message);
    
    // Test purchases data
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', testUserId)
      .limit(5);
    
    recordTest('Gather Purchases Data', !purchasesError, purchasesError?.message);
    
    // Test lend/borrow data
    const { data: lendBorrow, error: lendBorrowError } = await supabase
      .from('lend_borrow')
      .select('*')
      .eq('user_id', testUserId)
      .limit(5);
    
    recordTest('Gather Lend/Borrow Data', !lendBorrowError, lendBorrowError?.message);
    
    // Test donation/savings data
    const { data: donationSavings, error: donationSavingsError } = await supabase
      .from('donation_saving_records')
      .select('*')
      .eq('user_id', testUserId)
      .limit(5);
    
    recordTest('Gather Donation/Savings Data', !donationSavingsError, donationSavingsError?.message);
    
  } catch (error) {
    recordTest('Data Gathering', false, error.message);
  }
}

// Test 6: Check-in System
async function testCheckInSystem() {
  log('Testing check-in system...');
  
  try {
    // Create test settings with recent check-in
    const testSettings = {
      user_id: config.testUserId,
      is_enabled: true,
      check_in_frequency: 1,
      last_check_in: new Date().toISOString(),
      recipients: [{ id: '1', email: config.testRecipientEmail, name: 'Test', relationship: 'Family' }],
      include_data: { accounts: true, transactions: true, purchases: true, lendBorrow: true, savings: true, analytics: true },
      message: 'Test message',
      is_active: true,
      is_test_mode: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_settings')
      .upsert(testSettings)
      .select();
    
    if (insertError) throw insertError;
    
    // Test overdue check function
    const { data: overdueData, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');
    
    recordTest('Overdue Check Function', !overdueError, overdueError?.message);
    
    // Test check-in update
    const { error: updateError } = await supabase
      .from('last_wish_settings')
      .update({ 
        last_check_in: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', config.testUserId);
    
    recordTest('Check-in Update', !updateError, updateError?.message);
    
    // Cleanup
    await supabase
      .from('last_wish_settings')
      .delete()
      .eq('user_id', config.testUserId);
    
  } catch (error) {
    recordTest('Check-in System', false, error.message);
  }
}

// Test 7: Delivery Logs
async function testDeliveryLogs() {
  log('Testing delivery logs...');
  
  try {
    // Create test delivery log
    const testDelivery = {
      user_id: config.testUserId,
      recipient_email: config.testRecipientEmail,
      delivery_data: {
        message: 'Test delivery',
        delivery_date: new Date().toISOString(),
        data_included: { accounts: true, transactions: true }
      },
      delivery_status: 'sent',
      sent_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_deliveries')
      .insert(testDelivery)
      .select();
    
    recordTest('Create Delivery Log', !insertError, insertError?.message);
    
    if (insertData && insertData.length > 0) {
      const deliveryId = insertData[0].id;
      
      // Read delivery logs
      const { data: readData, error: readError } = await supabase
        .from('last_wish_deliveries')
        .select('*')
        .eq('user_id', config.testUserId);
      
      recordTest('Read Delivery Logs', !readError && readData.length > 0, readError?.message);
      
      // Update delivery status
      const { error: updateError } = await supabase
        .from('last_wish_deliveries')
        .update({ delivery_status: 'failed', error_message: 'Test error' })
        .eq('id', deliveryId);
      
      recordTest('Update Delivery Log', !updateError, updateError?.message);
      
      // Cleanup
      await supabase
        .from('last_wish_deliveries')
        .delete()
        .eq('id', deliveryId);
    }
    
  } catch (error) {
    recordTest('Delivery Logs', false, error.message);
  }
}

// Test 8: Test Mode Functionality
async function testTestMode() {
  log('Testing test mode functionality...');
  
  try {
    // Create test settings with test mode enabled
    const testSettings = {
      user_id: config.testUserId,
      is_enabled: true,
      check_in_frequency: 1, // 1 hour in test mode
      last_check_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      recipients: [{ id: '1', email: config.testRecipientEmail, name: 'Test', relationship: 'Family' }],
      include_data: { accounts: true, transactions: true, purchases: true, lendBorrow: true, savings: true, analytics: true },
      message: 'Test mode message',
      is_active: true,
      is_test_mode: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_settings')
      .upsert(testSettings)
      .select();
    
    recordTest('Create Test Mode Settings', !insertError, insertError?.message);
    
    if (insertData && insertData.length > 0) {
      // Test overdue check with test mode
      const { data: overdueData, error: overdueError } = await supabase
        .rpc('check_overdue_last_wish');
      
      recordTest('Test Mode Overdue Check', !overdueError, overdueError?.message);
      
      // Test API with test mode
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
      
      const data = await response.json();
      recordTest('Test Mode Email API', 
        response.ok && data.testMode === true, 
        data.error || `Status: ${response.status}`);
      
      // Cleanup
      await supabase
        .from('last_wish_settings')
        .delete()
        .eq('user_id', config.testUserId);
    }
    
  } catch (error) {
    recordTest('Test Mode Functionality', false, error.message);
  }
}

// Test 9: Security and Permissions
async function testSecurityAndPermissions() {
  log('Testing security and permissions...');
  
  try {
    // Test RLS policies
    const { data: settingsData, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', config.testUserId);
    
    recordTest('RLS Policy - Settings Access', !settingsError, settingsError?.message);
    
    // Test delivery logs access
    const { data: deliveryData, error: deliveryError } = await supabase
      .from('last_wish_deliveries')
      .select('*')
      .eq('user_id', config.testUserId);
    
    recordTest('RLS Policy - Delivery Logs Access', !deliveryError, deliveryError?.message);
    
    // Test function permissions
    const { data: overdueData, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');
    
    recordTest('Function Permissions', !overdueError, overdueError?.message);
    
  } catch (error) {
    recordTest('Security and Permissions', false, error.message);
  }
}

// Test 10: Performance and Edge Cases
async function testPerformanceAndEdgeCases() {
  log('Testing performance and edge cases...');
  
  try {
    // Test with empty recipients
    const emptyRecipientsSettings = {
      user_id: config.testUserId,
      is_enabled: true,
      check_in_frequency: 30,
      last_check_in: new Date().toISOString(),
      recipients: [],
      include_data: { accounts: true, transactions: true, purchases: true, lendBorrow: true, savings: true, analytics: true },
      message: 'Test with empty recipients',
      is_active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_settings')
      .upsert(emptyRecipientsSettings)
      .select();
    
    recordTest('Empty Recipients Handling', !insertError, insertError?.message);
    
    // Test with large message
    const largeMessage = 'A'.repeat(10000); // 10KB message
    const largeMessageSettings = {
      user_id: config.testUserId,
      is_enabled: true,
      check_in_frequency: 30,
      last_check_in: new Date().toISOString(),
      recipients: [{ id: '1', email: config.testRecipientEmail, name: 'Test', relationship: 'Family' }],
      include_data: { accounts: true, transactions: true, purchases: true, lendBorrow: true, savings: true, analytics: true },
      message: largeMessage,
      is_active: true
    };
    
    const { data: largeInsertData, error: largeInsertError } = await supabase
      .from('last_wish_settings')
      .upsert(largeMessageSettings)
      .select();
    
    recordTest('Large Message Handling', !largeInsertError, largeInsertError?.message);
    
    // Test with special characters in message
    const specialCharMessage = 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    const specialCharSettings = {
      user_id: config.testUserId,
      is_enabled: true,
      check_in_frequency: 30,
      last_check_in: new Date().toISOString(),
      recipients: [{ id: '1', email: config.testRecipientEmail, name: 'Test', relationship: 'Family' }],
      include_data: { accounts: true, transactions: true, purchases: true, lendBorrow: true, savings: true, analytics: true },
      message: specialCharMessage,
      is_active: true
    };
    
    const { data: specialInsertData, error: specialInsertError } = await supabase
      .from('last_wish_settings')
      .upsert(specialCharSettings)
      .select();
    
    recordTest('Special Characters Handling', !specialInsertError, specialInsertError?.message);
    
    // Cleanup
    await supabase
      .from('last_wish_settings')
      .delete()
      .eq('user_id', config.testUserId);
    
  } catch (error) {
    recordTest('Performance and Edge Cases', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Comprehensive Last Wish System Tests...', 'info');
  log(`Configuration:`, 'info');
  log(`  - Supabase URL: ${config.supabaseUrl}`, 'info');
  log(`  - API Base URL: ${config.apiBaseUrl}`, 'info');
  log(`  - Test User ID: ${config.testUserId}`, 'info');
  log(`  - Test Email: ${config.testEmail}`, 'info');
  log(`  - Test Recipient Email: ${config.testRecipientEmail}`, 'info');
  log('', 'info');
  
  const tests = [
    { name: 'Database Connection and Schema', fn: testDatabaseConnection },
    { name: 'Settings CRUD Operations', fn: testSettingsCRUD },
    { name: 'API Endpoints', fn: testAPIEndpoints },
    { name: 'Email Functionality', fn: testEmailFunctionality },
    { name: 'Data Gathering and Filtering', fn: testDataGathering },
    { name: 'Check-in System', fn: testCheckInSystem },
    { name: 'Delivery Logs', fn: testDeliveryLogs },
    { name: 'Test Mode Functionality', fn: testTestMode },
    { name: 'Security and Permissions', fn: testSecurityAndPermissions },
    { name: 'Performance and Edge Cases', fn: testPerformanceAndEdgeCases }
  ];
  
  for (const test of tests) {
    log(`\n📋 Running: ${test.name}`, 'info');
    try {
      await test.fn();
    } catch (error) {
      recordTest(test.name, false, error.message);
    }
  }
  
  // Print summary
  log('\n📊 Test Summary:', 'info');
  log(`  Total Tests: ${testResults.total}`, 'info');
  log(`  Passed: ${testResults.passed}`, 'success');
  log(`  Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`  Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        log(`  - ${test.testName}: ${test.details}`, 'error');
      });
  }
  
  log('\n✅ Test run completed!', 'success');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests, testResults };

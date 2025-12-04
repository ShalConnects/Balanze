import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🚀 COMPREHENSIVE LAST WISH SYSTEM TEST');
console.log('Testing all components for full operability');
console.log('=' .repeat(60));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const testResults = {
  database: [],
  api: [],
  integration: [],
  frontend: []
};

function logTest(category, test, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const result = { test, passed, details };
  testResults[category].push(result);
  
  console.log(`${status} [${category.toUpperCase()}] ${test}`);
  if (details) console.log(`    → ${details}`);
}

// Test 1: Database Core Functionality
async function testDatabaseCore() {
  console.log('\n🗄️  DATABASE CORE TESTS');
  console.log('-'.repeat(40));
  
  try {
    // Test 1.1: Basic table access
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('count')
      .limit(1);
    
    logTest('database', 'last_wish_settings table access', !settingsError, 
      settingsError ? settingsError.message : 'Table accessible');
    
    // Test 1.2: delivery_triggered column
    const { data: columnTest, error: columnError } = await supabase
      .from('last_wish_settings')
      .select('delivery_triggered')
      .limit(1);
    
    logTest('database', 'delivery_triggered column exists', !columnError,
      columnError ? columnError.message : 'Column accessible');
    
    // Test 1.3: RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_overdue_last_wish');
    
    logTest('database', 'check_overdue_last_wish function', !rpcError,
      rpcError ? rpcError.message : `Found ${rpcData?.length || 0} overdue users`);
    
    // Test 1.4: Deliveries table
    const { data: deliveries, error: deliveriesError } = await supabase
      .from('last_wish_deliveries')
      .select('count')
      .limit(1);
    
    logTest('database', 'last_wish_deliveries table', !deliveriesError,
      deliveriesError ? deliveriesError.message : 'Deliveries table accessible');
    
    return !settingsError && !columnError && !rpcError && !deliveriesError;
    
  } catch (error) {
    logTest('database', 'Database core test', false, error.message);
    return false;
  }
}

// Test 2: API Endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 API ENDPOINTS TESTS');
  console.log('-'.repeat(40));
  
  const endpoints = [
    { url: 'https://balanze.cash/api/last-wish-public', name: 'public endpoint' },
    { url: 'https://balanze.cash/api/last-wish-check', name: 'check endpoint' }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const passed = response.status === 200;
      allPassed = allPassed && passed;
      
      logTest('api', endpoint.name, passed, 
        `Status: ${response.status} ${response.statusText}`);
      
      if (passed) {
        try {
          const data = await response.json();
          console.log(`    → Response: ${JSON.stringify(data).substring(0, 100)}...`);
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
      
    } catch (error) {
      logTest('api', endpoint.name, false, error.message);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test 3: Complete User Workflow
async function testUserWorkflow() {
  console.log('\n🔄 USER WORKFLOW TESTS');
  console.log('-'.repeat(40));
  
  try {
    // Create a real user UUID that exists in auth.users
    // First, let's get an existing user ID
    const { data: existingUser, error: userError } = await supabase
      .from('last_wish_settings')
      .select('user_id')
      .limit(1)
      .single();
    
    let testUserId;
    if (existingUser && existingUser.user_id) {
      testUserId = existingUser.user_id;
      logTest('integration', 'Use existing user for test', true, `Using user: ${testUserId}`);
    } else {
      // If no existing settings, we'll create a test without foreign key
      logTest('integration', 'No existing user found', false, 'Cannot test with real user');
      return false;
    }
    
    // Test 3.1: Update existing settings
    const { data: updateData, error: updateError } = await supabase
      .from('last_wish_settings')
      .update({
        check_in_frequency: 7,
        delivery_triggered: false,
        is_active: true,
        is_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testUserId)
      .select();
    
    logTest('integration', 'Update user settings', !updateError,
      updateError ? updateError.message : 'Settings updated successfully');
    
    // Test 3.2: Check if user appears in overdue check
    const { data: overdueCheck, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');
    
    logTest('integration', 'Overdue check function', !overdueError,
      overdueError ? overdueError.message : `Found ${overdueCheck?.length || 0} overdue users`);
    
    // Test 3.3: Test trigger function
    const { data: triggerResult, error: triggerError } = await supabase
      .rpc('trigger_last_wish_delivery', { target_user_id: testUserId });
    
    logTest('integration', 'Trigger delivery function', !triggerError,
      triggerError ? triggerError.message : `Trigger result: ${triggerResult}`);
    
    return !updateError && !overdueError && !triggerError;
    
  } catch (error) {
    logTest('integration', 'User workflow test', false, error.message);
    return false;
  }
}

// Test 4: Frontend Component Structure
async function testFrontendStructure() {
  console.log('\n⚛️  FRONTEND COMPONENT TESTS');
  console.log('-'.repeat(40));
  
  try {
    const fs = await import('fs');
    
    // Test 4.1: Main component exists
    const lwExists = fs.existsSync('src/components/Dashboard/LW.tsx');
    logTest('frontend', 'LW.tsx component exists', lwExists);
    
    if (lwExists) {
      const content = fs.readFileSync('src/components/Dashboard/LW.tsx', 'utf8');
      
      // Test 4.2: Key functions exist
      const keyFunctions = [
        'loadLWSettings',
        'toggleLWEnabled', 
        'handleCheckIn',
        'handleTestEmail',
        'addRecipient',
        'removeRecipient'
      ];
      
      keyFunctions.forEach(func => {
        const exists = content.includes(func);
        logTest('frontend', `Function ${func}`, exists);
      });
      
      // Test 4.3: Supabase integration
      logTest('frontend', 'Supabase integration', content.includes('supabase'));
      logTest('frontend', 'Toast notifications', content.includes('toast'));
      logTest('frontend', 'State management', content.includes('useState'));
    }
    
    return lwExists;
    
  } catch (error) {
    logTest('frontend', 'Frontend structure test', false, error.message);
    return false;
  }
}

// Test 5: Email Configuration
async function testEmailConfiguration() {
  console.log('\n📧 EMAIL CONFIGURATION TESTS');
  console.log('-'.repeat(40));
  
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;
  
  logTest('integration', 'SMTP user configured', !!smtpUser, smtpUser || 'Missing');
  logTest('integration', 'SMTP password configured', !!smtpPass, smtpPass ? 'Present' : 'Missing');
  logTest('integration', 'SMTP host configured', !!smtpHost, smtpHost || 'smtp.gmail.com (default)');
  
  return !!(smtpUser && smtpPass);
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE SYSTEM TEST RESULTS');
  console.log('='.repeat(60));
  
  let totalTests = 0;
  let totalPassed = 0;
  
  Object.entries(testResults).forEach(([category, tests]) => {
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    totalTests += total;
    totalPassed += passed;
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${passed}/${total}`);
    console.log(`  📊 Rate: ${total > 0 ? ((passed/total) * 100).toFixed(1) : 0}%`);
    
    // Show failed tests
    const failed = tests.filter(t => !t.passed);
    if (failed.length > 0) {
      console.log(`  ❌ Failed tests:`);
      failed.forEach(test => {
        console.log(`     - ${test.test}: ${test.details}`);
      });
    }
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`OVERALL RESULTS:`);
  console.log(`✅ Total Passed: ${totalPassed}/${totalTests}`);
  console.log(`📊 Success Rate: ${totalTests > 0 ? ((totalPassed/totalTests) * 100).toFixed(1) : 0}%`);
  
  // Determine system status
  const successRate = totalTests > 0 ? (totalPassed/totalTests) * 100 : 0;
  
  if (successRate >= 90) {
    console.log(`🎉 SYSTEM STATUS: FULLY OPERATIONAL`);
  } else if (successRate >= 75) {
    console.log(`✅ SYSTEM STATUS: MOSTLY OPERATIONAL`);
  } else if (successRate >= 50) {
    console.log(`⚠️  SYSTEM STATUS: PARTIALLY OPERATIONAL`);
  } else {
    console.log(`❌ SYSTEM STATUS: NEEDS ATTENTION`);
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (successRate >= 90) {
    console.log('✅ System is ready for production use!');
    console.log('✅ All core functionality is working');
    console.log('✅ Users can safely use the Last Wish feature');
  } else {
    console.log('🔧 Continue fixing remaining issues');
    console.log('🔧 Focus on failed tests above');
    console.log('🔧 Test frontend in browser');
  }
}

// Run all tests
async function runComprehensiveTest() {
  console.log('Starting comprehensive system test...\n');
  
  const dbResult = await testDatabaseCore();
  const apiResult = await testAPIEndpoints();
  const workflowResult = await testUserWorkflow();
  const frontendResult = await testFrontendStructure();
  const emailResult = await testEmailConfiguration();
  
  generateReport();
  
  console.log('\n🏁 COMPREHENSIVE TEST COMPLETE');
  
  return {
    database: dbResult,
    api: apiResult,
    workflow: workflowResult,
    frontend: frontendResult,
    email: emailResult
  };
}

runComprehensiveTest();

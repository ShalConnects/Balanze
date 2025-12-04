import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔥 LIVE LAST WISH SYSTEM TEST');
console.log('=' .repeat(50));

const issues = [];
const warnings = [];

function logResult(test, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${test}`);
  if (details) console.log(`    → ${details}`);
  if (!passed) issues.push({ test, details });
}

function logWarning(message) {
  console.log(`⚠️  WARNING: ${message}`);
  warnings.push(message);
}

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔧 ENVIRONMENT CHECK');
console.log('-'.repeat(30));

logResult('Supabase URL configured', !!supabaseUrl, supabaseUrl ? `URL: ${supabaseUrl}` : 'Missing VITE_SUPABASE_URL');
logResult('Supabase Service Key configured', !!supabaseServiceKey, supabaseServiceKey ? 'Service key present' : 'Missing SUPABASE_SERVICE_KEY');
logResult('Supabase Anon Key configured', !!supabaseAnonKey, supabaseAnonKey ? 'Anon key present' : 'Missing VITE_SUPABASE_ANON_KEY');
logResult('SMTP User configured', !!process.env.SMTP_USER, process.env.SMTP_USER || 'Missing SMTP_USER');
logResult('SMTP Pass configured', !!process.env.SMTP_PASS, process.env.SMTP_PASS ? 'SMTP password present' : 'Missing SMTP_PASS');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('\n❌ Cannot proceed without Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('\n🗄️  DATABASE CONNECTIVITY TEST');
console.log('-'.repeat(30));

async function testDatabaseConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    logResult('Database connection', !error, error ? error.message : 'Connected successfully');
    
    // Test Last Wish table exists
    const { data: lwData, error: lwError } = await supabase
      .from('last_wish_settings')
      .select('count')
      .limit(1);
    
    logResult('last_wish_settings table exists', !lwError, lwError ? lwError.message : 'Table accessible');
    
    // Test RPC functions
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_overdue_last_wish');
    
    logResult('check_overdue_last_wish function exists', !rpcError, rpcError ? rpcError.message : 'RPC function working');
    
    return !error && !lwError;
  } catch (error) {
    logResult('Database connection', false, error.message);
    return false;
  }
}

console.log('\n🌐 API ENDPOINTS TEST');
console.log('-'.repeat(30));

async function testAPIEndpoints() {
  const endpoints = [
    '/api/last-wish-check',
    '/api/last-wish-public'
  ];
  
  for (const endpoint of endpoints) {
    try {
      // Test local endpoint
      const localUrl = `http://localhost:3000${endpoint}`;
      console.log(`Testing: ${localUrl}`);
      
      const response = await fetch(localUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      logResult(`Local ${endpoint}`, response.status !== 404, `Status: ${response.status}`);
      
      // Test production endpoint
      const prodUrl = `https://balanze.cash${endpoint}`;
      console.log(`Testing: ${prodUrl}`);
      
      const prodResponse = await fetch(prodUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      logResult(`Production ${endpoint}`, prodResponse.status !== 404, `Status: ${prodResponse.status}`);
      
    } catch (error) {
      logResult(`API ${endpoint}`, false, error.message);
    }
  }
}

console.log('\n📧 EMAIL FUNCTIONALITY TEST');
console.log('-'.repeat(30));

async function testEmailFunctionality() {
  // Test SMTP configuration
  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  logResult('SMTP credentials configured', smtpConfigured);
  
  if (!smtpConfigured) {
    logWarning('Email tests skipped - SMTP not configured');
    return;
  }
  
  // Test email service file
  const emailServiceExists = fs.existsSync('src/lib/emailService.js');
  logResult('Email service file exists', emailServiceExists);
  
  // Test if we can create a test user and settings
  try {
    // Create a test Last Wish setting
    const testUserId = 'test-user-' + Date.now();
    const { data, error } = await supabase
      .from('last_wish_settings')
      .insert({
        user_id: testUserId,
        is_enabled: true,
        check_in_frequency: 30,
        last_check_in: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
        recipients: [{ 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User', 
          relationship: 'friend' 
        }],
        include_data: { accounts: true, transactions: true },
        message: 'Test message',
        is_active: true
      })
      .select();
    
    logResult('Can create test Last Wish settings', !error, error ? error.message : 'Test record created');
    
    if (!error && data) {
      // Clean up test record
      await supabase
        .from('last_wish_settings')
        .delete()
        .eq('user_id', testUserId);
    }
    
  } catch (error) {
    logResult('Database write test', false, error.message);
  }
}

console.log('\n⚛️  FRONTEND COMPONENT TEST');
console.log('-'.repeat(30));

async function testFrontendComponent() {
  const componentPath = 'src/components/Dashboard/LW.tsx';
  
  if (!fs.existsSync(componentPath)) {
    logResult('LW.tsx component exists', false, 'File not found');
    return;
  }
  
  const content = fs.readFileSync(componentPath, 'utf8');
  
  // Test for critical functions
  const criticalFunctions = [
    'loadLWSettings',
    'toggleLWEnabled',
    'handleCheckIn',
    'handleTestEmail',
    'addRecipient',
    'removeRecipient',
    'toggleDataInclusion'
  ];
  
  criticalFunctions.forEach(func => {
    const exists = content.includes(func);
    logResult(`Function ${func} exists`, exists);
  });
  
  // Test for state management
  const stateChecks = [
    'useState',
    'useEffect',
    'settings',
    'loading',
    'recipients'
  ];
  
  stateChecks.forEach(state => {
    const exists = content.includes(state);
    logResult(`State management ${state}`, exists);
  });
  
  // Test for Supabase integration
  logResult('Supabase integration', content.includes('supabase'));
  logResult('Toast notifications', content.includes('toast'));
}

console.log('\n🔍 SPECIFIC FUNCTIONALITY TESTS');
console.log('-'.repeat(30));

async function testSpecificFunctionality() {
  try {
    // Test 1: Check if we can query last_wish_settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .limit(5);
    
    logResult('Can query last_wish_settings', !settingsError, 
      settingsError ? settingsError.message : `Found ${settingsData?.length || 0} records`);
    
    // Test 2: Check if we can query other required tables
    const tables = ['accounts', 'transactions', 'purchases', 'lend_borrow'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      logResult(`Table ${table} accessible`, !error, error ? error.message : 'Table exists');
    }
    
    // Test 3: Check RLS policies
    const { data: authData, error: authError } = await supabase.auth.getUser();
    logResult('Auth system working', !authError, authError ? authError.message : 'Auth accessible');
    
  } catch (error) {
    logResult('Database functionality test', false, error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      await testSpecificFunctionality();
    }
    
    await testAPIEndpoints();
    await testEmailFunctionality();
    testFrontendComponent();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(50));
    
    console.log(`❌ Issues Found: ${issues.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    
    if (issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      console.log('-'.repeat(30));
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.test}`);
        if (issue.details) console.log(`   → ${issue.details}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      console.log('-'.repeat(30));
      warnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
    }
    
    console.log('\n🎯 IMMEDIATE ACTION ITEMS:');
    console.log('-'.repeat(30));
    
    const actionItems = [];
    
    // Prioritize issues
    const criticalIssues = issues.filter(issue => 
      issue.test.includes('Database connection') ||
      issue.test.includes('last_wish_settings') ||
      issue.test.includes('API')
    );
    
    if (criticalIssues.length > 0) {
      actionItems.push('🔥 Fix database connectivity and table access');
    }
    
    const apiIssues = issues.filter(issue => issue.test.includes('API'));
    if (apiIssues.length > 0) {
      actionItems.push('🔥 Deploy and fix API endpoints');
    }
    
    const emailIssues = issues.filter(issue => issue.test.includes('email') || issue.test.includes('SMTP'));
    if (emailIssues.length > 0) {
      actionItems.push('🟡 Configure email functionality');
    }
    
    if (actionItems.length === 0) {
      console.log('✅ System appears to be working correctly!');
    } else {
      actionItems.forEach((item, i) => {
        console.log(`${i + 1}. ${item}`);
      });
    }
    
    console.log('\n🏁 LIVE TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

runAllTests();

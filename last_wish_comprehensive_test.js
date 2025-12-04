import fs from 'fs';
import path from 'path';

console.log('🔍 COMPREHENSIVE LAST WISH SYSTEM DIAGNOSIS');
console.log('=' .repeat(60));

const issues = [];
const passed = [];

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed.push(name);
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`    → ${details}`);
    issues.push({ name, details });
  }
}

console.log('\n📊 DATABASE SCHEMA TESTS');
console.log('-'.repeat(40));

// Test database schema files
const dbFiles = [
  'create_last_wish_table.sql',
  'fix_last_wish_active_state.sql', 
  'fix_last_wish_permissions_comprehensive.sql'
];

dbFiles.forEach(file => {
  const exists = fs.existsSync(file);
  test(`Database file exists: ${file}`, exists, exists ? '' : 'File not found');
  
  if (exists) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      test(`${file} has RLS policies`, content.includes('POLICY') || content.includes('RLS'));
      test(`${file} has user_id field`, content.includes('user_id'));
      test(`${file} has is_enabled field`, content.includes('is_enabled'));
    } catch (error) {
      test(`${file} readable`, false, error.message);
    }
  }
});

console.log('\n🌐 API ENDPOINT TESTS');
console.log('-'.repeat(40));

const apiFiles = [
  'api/last-wish-check.js',
  'api/last-wish-public.js'
];

apiFiles.forEach(file => {
  const exists = fs.existsSync(file);
  test(`API file exists: ${file}`, exists);
  
  if (exists) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      test(`${file} has CORS headers`, content.includes('Access-Control-Allow-Origin'));
      test(`${file} has error handling`, content.includes('try') && content.includes('catch'));
      test(`${file} uses Supabase`, content.includes('supabase'));
      
      if (file.includes('check')) {
        test(`${file} has email functionality`, content.includes('nodemailer') || content.includes('smtp'));
      }
    } catch (error) {
      test(`${file} readable`, false, error.message);
    }
  }
});

console.log('\n⚛️ FRONTEND COMPONENT TESTS');
console.log('-'.repeat(40));

const frontendFile = 'src/components/Dashboard/LW.tsx';
const frontendExists = fs.existsSync(frontendFile);
test('LW.tsx component exists', frontendExists);

if (frontendExists) {
  try {
    const content = fs.readFileSync(frontendFile, 'utf8');
    
    // Test imports
    test('LW.tsx has React imports', content.includes('import React'));
    test('LW.tsx has useState', content.includes('useState'));
    test('LW.tsx has useEffect', content.includes('useEffect'));
    test('LW.tsx has Supabase import', content.includes('supabase'));
    
    // Test key functions
    const functions = [
      'loadLWSettings',
      'toggleLWEnabled', 
      'handleCheckIn',
      'handleTestEmail',
      'addRecipient',
      'removeRecipient'
    ];
    
    functions.forEach(func => {
      test(`LW.tsx has ${func} function`, content.includes(func));
    });
    
    // Test UI components
    test('LW.tsx has RecipientModal', content.includes('RecipientModal'));
    test('LW.tsx has MessagePreviewModal', content.includes('MessagePreviewModal'));
    
  } catch (error) {
    test('LW.tsx readable', false, error.message);
  }
}

console.log('\n📧 EMAIL CONFIGURATION TESTS');
console.log('-'.repeat(40));

const emailFiles = [
  'src/lib/emailService.js',
  'email-sender.js'
];

emailFiles.forEach(file => {
  const exists = fs.existsSync(file);
  test(`Email service exists: ${file}`, exists);
  
  if (exists) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      test(`${file} has SMTP config`, content.includes('smtp') || content.includes('SMTP'));
    } catch (error) {
      test(`${file} readable`, false, error.message);
    }
  }
});

// Test email templates
const templateDir = 'supabase-email-templates';
test('Email templates directory exists', fs.existsSync(templateDir));

console.log('\n⚙️ CONFIGURATION TESTS');
console.log('-'.repeat(40));

// Test environment template
test('env.template exists', fs.existsSync('env.template'));

// Test package.json
const packageExists = fs.existsSync('package.json');
test('package.json exists', packageExists);

if (packageExists) {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    test('Has nodemailer dependency', !!deps.nodemailer);
    test('Has @supabase/supabase-js dependency', !!deps['@supabase/supabase-js']);
    test('Has React dependency', !!deps.react);
  } catch (error) {
    test('package.json readable', false, error.message);
  }
}

console.log('\n📚 DOCUMENTATION TESTS');
console.log('-'.repeat(40));

const docFiles = [
  'LAST_WISH_README.md',
  'LAST_WISH_TESTING_GUIDE.md',
  'LAST_WISH_FIX_SUMMARY.md'
];

docFiles.forEach(file => {
  test(`Documentation exists: ${file}`, fs.existsSync(file));
});

console.log('\n🧪 TEST FILE ANALYSIS');
console.log('-'.repeat(40));

// Find all Last Wish test files
const allFiles = fs.readdirSync('.');
const testFiles = allFiles.filter(file => 
  file.includes('last-wish') && 
  (file.includes('test') || file.includes('check'))
);

test('Has Last Wish test files', testFiles.length > 0);
console.log(`Found ${testFiles.length} test files: ${testFiles.join(', ')}`);

console.log('\n' + '='.repeat(60));
console.log('📋 FINAL RESULTS');
console.log('='.repeat(60));

console.log(`✅ Tests Passed: ${passed.length}`);
console.log(`❌ Tests Failed: ${issues.length}`);
console.log(`📊 Success Rate: ${((passed.length / (passed.length + issues.length)) * 100).toFixed(1)}%`);

if (issues.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES FOUND:');
  console.log('-'.repeat(40));
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.name}`);
    if (issue.details) console.log(`   → ${issue.details}`);
  });
}

console.log('\n🎯 PRIORITY ACTIONS:');
console.log('-'.repeat(40));

const priorities = [];

// Check for critical missing files
if (!fs.existsSync('api/last-wish-check.js')) {
  priorities.push('🔥 HIGH: Create api/last-wish-check.js endpoint');
}
if (!fs.existsSync('api/last-wish-public.js')) {
  priorities.push('🔥 HIGH: Create api/last-wish-public.js endpoint');
}
if (!fs.existsSync('src/components/Dashboard/LW.tsx')) {
  priorities.push('🔥 HIGH: Create LW.tsx component');
}

// Check for configuration issues
if (!fs.existsSync('env.template')) {
  priorities.push('🟡 MEDIUM: Create env.template file');
}

// Check for email configuration
const hasEmailService = fs.existsSync('src/lib/emailService.js') || fs.existsSync('email-sender.js');
if (!hasEmailService) {
  priorities.push('🟡 MEDIUM: Set up email service configuration');
}

if (priorities.length === 0) {
  console.log('✅ No critical issues found! System structure looks good.');
} else {
  priorities.forEach((priority, i) => {
    console.log(`${i + 1}. ${priority}`);
  });
}

console.log('\n🔧 NEXT STEPS:');
console.log('-'.repeat(40));
console.log('1. Fix any HIGH priority issues first');
console.log('2. Test API endpoints with real requests');
console.log('3. Verify database connectivity');
console.log('4. Test email functionality');
console.log('5. Verify frontend component integration');

console.log('\n🏁 DIAGNOSIS COMPLETE');

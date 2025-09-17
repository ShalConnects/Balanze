#!/usr/bin/env node

/**
 * COMPREHENSIVE LAST WISH SYSTEM DIAGNOSIS
 * 
 * This script performs exhaustive testing of the Last Wish system
 * to identify all issues and provide fix recommendations.
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 COMPREHENSIVE LAST WISH SYSTEM DIAGNOSIS');
console.log('=' .repeat(60));
console.log('Starting comprehensive analysis...\n');

const issues = [];
const warnings = [];
const recommendations = [];

// Test results storage
const testResults = {
  database: { passed: 0, failed: 0, tests: [] },
  api: { passed: 0, failed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, tests: [] },
  email: { passed: 0, failed: 0, tests: [] },
  configuration: { passed: 0, failed: 0, tests: [] }
};

function logTest(category, testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const result = { testName, passed, details, timestamp: new Date().toISOString() };
  
  testResults[category].tests.push(result);
  if (passed) {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
    issues.push(`${category.toUpperCase()}: ${testName} - ${details}`);
  }
  
  console.log(`${status} [${category.toUpperCase()}] ${testName}`);
  if (details) console.log(`    → ${details}`);
}

function logWarning(message) {
  warnings.push(message);
  console.log(`⚠️  WARNING: ${message}`);
}

function logRecommendation(message) {
  recommendations.push(message);
  console.log(`💡 RECOMMENDATION: ${message}`);
}

// 1. TEST DATABASE SCHEMA AND TABLES
console.log('\n📊 TESTING DATABASE SCHEMA');
console.log('-'.repeat(40));

function testDatabaseSchema() {
  // Check if last_wish_settings table structure files exist
  const schemaFiles = [
    'create_last_wish_table.sql',
    'fix_last_wish_active_state.sql',
    'fix_last_wish_permissions_comprehensive.sql'
  ];
  
  schemaFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logTest('database', `Schema file exists: ${file}`, true);
      
      // Read and analyze schema file
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for required fields
      const requiredFields = [
        'user_id',
        'is_enabled',
        'check_in_frequency',
        'last_check_in',
        'recipients',
        'include_data',
        'message',
        'is_active'
      ];
      
      requiredFields.forEach(field => {
        if (content.includes(field)) {
          logTest('database', `Required field present: ${field}`, true);
        } else {
          logTest('database', `Required field missing: ${field}`, false, `Field ${field} not found in schema`);
        }
      });
      
      // Check for RLS policies
      if (content.includes('POLICY') || content.includes('RLS')) {
        logTest('database', `RLS policies defined in ${file}`, true);
      } else {
        logTest('database', `RLS policies missing in ${file}`, false, 'No Row Level Security policies found');
      }
      
    } else {
      logTest('database', `Schema file missing: ${file}`, false, `File ${file} not found`);
    }
  });
  
  // Check for database functions
  const functionFiles = [
    'check_overdue_last_wish',
    'trigger_last_wish_delivery'
  ];
  
  functionFiles.forEach(funcName => {
    const found = fs.readdirSync('.').some(file => 
      file.includes(funcName) || 
      (fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(funcName))
    );
    
    if (found) {
      logTest('database', `Database function exists: ${funcName}`, true);
    } else {
      logTest('database', `Database function missing: ${funcName}`, false, `Function ${funcName} not found`);
    }
  });
}

// 2. TEST API ENDPOINTS
console.log('\n🌐 TESTING API ENDPOINTS');
console.log('-'.repeat(40));

function testAPIEndpoints() {
  const apiFiles = [
    'api/last-wish-check.js',
    'api/last-wish-public.js'
  ];
  
  apiFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logTest('api', `API file exists: ${file}`, true);
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for CORS configuration
      if (content.includes('Access-Control-Allow-Origin')) {
        logTest('api', `CORS headers present in ${file}`, true);
      } else {
        logTest('api', `CORS headers missing in ${file}`, false, 'No CORS headers found');
      }
      
      // Check for error handling
      if (content.includes('try') && content.includes('catch')) {
        logTest('api', `Error handling present in ${file}`, true);
      } else {
        logTest('api', `Error handling missing in ${file}`, false, 'No try-catch blocks found');
      }
      
      // Check for Supabase client
      if (content.includes('supabase')) {
        logTest('api', `Supabase client used in ${file}`, true);
      } else {
        logTest('api', `Supabase client missing in ${file}`, false, 'No Supabase client found');
      }
      
      // Check for email functionality (in last-wish-check.js)
      if (file.includes('check') && content.includes('nodemailer')) {
        logTest('api', `Email functionality present in ${file}`, true);
      } else if (file.includes('check')) {
        logTest('api', `Email functionality missing in ${file}`, false, 'No nodemailer found');
      }
      
      // Check for environment variables
      const envVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SMTP_USER', 'SMTP_PASS'];
      envVars.forEach(envVar => {
        if (content.includes(envVar)) {
          logTest('api', `Environment variable used: ${envVar}`, true);
        } else {
          logTest('api', `Environment variable missing: ${envVar}`, false, `${envVar} not referenced`);
        }
      });
      
    } else {
      logTest('api', `API file missing: ${file}`, false, `File ${file} not found`);
    }
  });
}

// 3. TEST FRONTEND COMPONENT
console.log('\n⚛️  TESTING FRONTEND COMPONENT');
console.log('-'.repeat(40));

function testFrontendComponent() {
  const componentFile = 'src/components/Dashboard/LW.tsx';
  
  if (fs.existsSync(componentFile)) {
    logTest('frontend', 'Main LW component exists', true);
    
    const content = fs.readFileSync(componentFile, 'utf8');
    
    // Check for required imports
    const requiredImports = [
      'React',
      'useState',
      'useEffect',
      'supabase',
      'toast'
    ];
    
    requiredImports.forEach(imp => {
      if (content.includes(imp)) {
        logTest('frontend', `Required import present: ${imp}`, true);
      } else {
        logTest('frontend', `Required import missing: ${imp}`, false, `Import ${imp} not found`);
      }
    });
    
    // Check for key functions
    const keyFunctions = [
      'loadLWSettings',
      'toggleLWEnabled',
      'handleCheckIn',
      'handleTestEmail',
      'addRecipient',
      'removeRecipient'
    ];
    
    keyFunctions.forEach(func => {
      if (content.includes(func)) {
        logTest('frontend', `Key function present: ${func}`, true);
      } else {
        logTest('frontend', `Key function missing: ${func}`, false, `Function ${func} not found`);
      }
    });
    
    // Check for state management
    const stateVars = [
      'settings',
      'loading',
      'recipients',
      'includeData'
    ];
    
    stateVars.forEach(state => {
      if (content.includes(state)) {
        logTest('frontend', `State variable present: ${state}`, true);
      } else {
        logTest('frontend', `State variable missing: ${state}`, false, `State ${state} not found`);
      }
    });
    
    // Check for UI components
    const uiComponents = [
      'RecipientModal',
      'MessagePreviewModal',
      'RelationshipDropdown'
    ];
    
    uiComponents.forEach(component => {
      if (content.includes(component)) {
        logTest('frontend', `UI component present: ${component}`, true);
      } else {
        logTest('frontend', `UI component missing: ${component}`, false, `Component ${component} not found`);
      }
    });
    
  } else {
    logTest('frontend', 'Main LW component missing', false, 'LW.tsx file not found');
  }
}

// 4. TEST EMAIL CONFIGURATION
console.log('\n📧 TESTING EMAIL CONFIGURATION');
console.log('-'.repeat(40));

function testEmailConfiguration() {
  // Check for email service files
  const emailFiles = [
    'src/lib/emailService.js',
    'email-sender.js',
    'send-last-wish-email.js'
  ];
  
  emailFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logTest('email', `Email service file exists: ${file}`, true);
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for SMTP configuration
      if (content.includes('smtp') || content.includes('SMTP')) {
        logTest('email', `SMTP configuration in ${file}`, true);
      } else {
        logTest('email', `SMTP configuration missing in ${file}`, false, 'No SMTP config found');
      }
      
    } else {
      logTest('email', `Email service file missing: ${file}`, false, `File ${file} not found`);
    }
  });
  
  // Check for email templates
  const templateDir = 'supabase-email-templates';
  if (fs.existsSync(templateDir)) {
    logTest('email', 'Email templates directory exists', true);
    
    const templates = fs.readdirSync(templateDir);
    if (templates.length > 0) {
      logTest('email', `Email templates found: ${templates.length}`, true);
    } else {
      logTest('email', 'No email templates found', false, 'Templates directory is empty');
    }
  } else {
    logTest('email', 'Email templates directory missing', false, 'Templates directory not found');
  }
}

// 5. TEST CONFIGURATION FILES
console.log('\n⚙️  TESTING CONFIGURATION');
console.log('-'.repeat(40));

function testConfiguration() {
  // Check for environment template
  if (fs.existsSync('env.template')) {
    logTest('configuration', 'Environment template exists', true);
    
    const content = fs.readFileSync('env.template', 'utf8');
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS'
    ];
    
    requiredEnvVars.forEach(envVar => {
      if (content.includes(envVar)) {
        logTest('configuration', `Environment variable template: ${envVar}`, true);
      } else {
        logTest('configuration', `Environment variable missing: ${envVar}`, false, `${envVar} not in template`);
      }
    });
    
  } else {
    logTest('configuration', 'Environment template missing', false, 'env.template not found');
  }
  
  // Check for package.json dependencies
  if (fs.existsSync('package.json')) {
    logTest('configuration', 'Package.json exists', true);
    
    const content = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      'nodemailer',
      '@supabase/supabase-js',
      'react'
    ];
    
    const allDeps = { ...content.dependencies, ...content.devDependencies };
    
    requiredDeps.forEach(dep => {
      if (allDeps[dep]) {
        logTest('configuration', `Required dependency: ${dep}`, true);
      } else {
        logTest('configuration', `Required dependency missing: ${dep}`, false, `${dep} not in dependencies`);
      }
    });
    
  } else {
    logTest('configuration', 'Package.json missing', false, 'package.json not found');
  }
}

// 6. TEST DOCUMENTATION AND GUIDES
console.log('\n📚 TESTING DOCUMENTATION');
console.log('-'.repeat(40));

function testDocumentation() {
  const docFiles = [
    'LAST_WISH_README.md',
    'LAST_WISH_TESTING_GUIDE.md',
    'LAST_WISH_FIX_SUMMARY.md'
  ];
  
  docFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logTest('configuration', `Documentation exists: ${file}`, true);
    } else {
      logTest('configuration', `Documentation missing: ${file}`, false, `${file} not found`);
    }
  });
}

// RUN ALL TESTS
async function runComprehensiveTests() {
  try {
    testDatabaseSchema();
    testAPIEndpoints();
    testFrontendComponent();
    testEmailConfiguration();
    testConfiguration();
    testDocumentation();
    
    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(testResults).forEach(([category, results]) => {
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(`  📊 Total:  ${results.passed + results.failed}`);
      
      totalPassed += results.passed;
      totalFailed += results.failed;
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log(`OVERALL RESULTS:`);
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📊 Total Tests:  ${totalPassed + totalFailed}`);
    console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    
    // Critical Issues Report
    if (issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      console.log('='.repeat(60));
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    // Warnings Report
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      console.log('='.repeat(60));
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    // Recommendations Report
    if (recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('='.repeat(60));
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    // Priority Fix List
    console.log('\n🎯 PRIORITY FIXES NEEDED:');
    console.log('='.repeat(60));
    
    const priorityFixes = [];
    
    // Database issues are critical
    if (testResults.database.failed > 0) {
      priorityFixes.push('🔥 HIGH: Fix database schema and RLS policies');
    }
    
    // API issues prevent functionality
    if (testResults.api.failed > 0) {
      priorityFixes.push('🔥 HIGH: Fix API endpoints and CORS configuration');
    }
    
    // Email issues prevent delivery
    if (testResults.email.failed > 0) {
      priorityFixes.push('🔥 HIGH: Configure email service and SMTP settings');
    }
    
    // Frontend issues affect user experience
    if (testResults.frontend.failed > 0) {
      priorityFixes.push('🟡 MEDIUM: Fix frontend component issues');
    }
    
    // Configuration issues affect deployment
    if (testResults.configuration.failed > 0) {
      priorityFixes.push('🟡 MEDIUM: Update configuration and dependencies');
    }
    
    if (priorityFixes.length === 0) {
      console.log('✅ No critical issues found! System appears to be working correctly.');
    } else {
      priorityFixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix}`);
      });
    }
    
    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPassed,
        totalFailed,
        successRate: ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
      },
      testResults,
      issues,
      warnings,
      recommendations,
      priorityFixes
    };
    
    fs.writeFileSync('last_wish_diagnosis_report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: last_wish_diagnosis_report.json');
    
    console.log('\n🏁 DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Start the comprehensive diagnosis
runComprehensiveTests();

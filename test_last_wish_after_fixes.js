import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🧪 LAST WISH POST-FIX VALIDATION TEST');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testDatabaseFixes() {
  console.log('\n🗄️  DATABASE FIXES VALIDATION');
  console.log('-'.repeat(30));
  
  try {
    // Test 1: Check if delivery_triggered column exists
    const { data: columns, error: colError } = await supabase
      .rpc('sql', { query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'last_wish_settings' 
        AND column_name = 'delivery_triggered'
      ` });
    
    console.log('✅ delivery_triggered column check:', colError ? '❌ MISSING' : '✅ EXISTS');
    
    // Test 2: Test the fixed RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_overdue_last_wish');
    
    console.log('✅ check_overdue_last_wish function:', rpcError ? `❌ ${rpcError.message}` : '✅ WORKING');
    
    if (!rpcError) {
      console.log(`   Found ${rpcData?.length || 0} overdue users`);
    }
    
    // Test 3: Test UUID generation fix
    const testUserId = crypto.randomUUID(); // ✅ Proper UUID
    console.log('✅ UUID generation:', `✅ Generated: ${testUserId}`);
    
    // Test 4: Try creating a test record with proper UUID
    const { data: insertData, error: insertError } = await supabase
      .from('last_wish_settings')
      .insert({
        user_id: testUserId,
        is_enabled: true,
        check_in_frequency: 30,
        last_check_in: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        recipients: [{ 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User', 
          relationship: 'friend' 
        }],
        include_data: { accounts: true, transactions: true },
        message: 'Test message',
        is_active: true,
        delivery_triggered: false
      })
      .select();
    
    console.log('✅ Test record creation:', insertError ? `❌ ${insertError.message}` : '✅ SUCCESS');
    
    if (!insertError && insertData) {
      // Test 5: Test the trigger function
      const { data: triggerData, error: triggerError } = await supabase
        .rpc('trigger_last_wish_delivery', { target_user_id: testUserId });
      
      console.log('✅ trigger_last_wish_delivery function:', triggerError ? `❌ ${triggerError.message}` : '✅ WORKING');
      
      // Clean up test record
      await supabase
        .from('last_wish_settings')
        .delete()
        .eq('user_id', testUserId);
      
      console.log('✅ Test cleanup: ✅ COMPLETED');
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 API ENDPOINTS TEST');
  console.log('-'.repeat(30));
  
  const endpoints = [
    'https://balanze.cash/api/last-wish-check',
    'https://balanze.cash/api/last-wish-public'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const status = response.status;
      const statusText = response.statusText;
      
      console.log(`✅ ${endpoint}: ${status === 200 ? '✅' : status === 405 ? '⚠️' : '❌'} ${status} ${statusText}`);
      
      if (status === 200 || status === 405) {
        try {
          const text = await response.text();
          if (text.includes('success') || text.includes('Method not allowed')) {
            console.log('   → API is responding correctly');
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ❌ ${error.message}`);
    }
  }
}

async function testEmailConfiguration() {
  console.log('\n📧 EMAIL CONFIGURATION TEST');
  console.log('-'.repeat(30));
  
  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  console.log('✅ SMTP credentials:', smtpConfigured ? '✅ CONFIGURED' : '❌ MISSING');
  
  if (smtpConfigured) {
    console.log(`   → SMTP User: ${process.env.SMTP_USER}`);
    console.log(`   → SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
    console.log(`   → SMTP Port: ${process.env.SMTP_PORT || '587'}`);
  }
}

async function testSystemIntegration() {
  console.log('\n🔧 SYSTEM INTEGRATION TEST');
  console.log('-'.repeat(30));
  
  try {
    // Test complete workflow
    const testUserId = crypto.randomUUID();
    
    // Step 1: Create user settings
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .insert({
        user_id: testUserId,
        is_enabled: true,
        check_in_frequency: 1, // 1 day for quick testing
        last_check_in: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        recipients: [{ 
          id: '1', 
          email: 'test@example.com', 
          name: 'Test User', 
          relationship: 'friend' 
        }],
        include_data: { accounts: true },
        message: 'Integration test message',
        is_active: true,
        delivery_triggered: false
      })
      .select()
      .single();
    
    if (settingsError) {
      console.log('❌ Integration test setup failed:', settingsError.message);
      return;
    }
    
    console.log('✅ Test user created: ✅ SUCCESS');
    
    // Step 2: Check if user shows up as overdue
    const { data: overdueUsers, error: overdueError } = await supabase
      .rpc('check_overdue_last_wish');
    
    const isOverdue = overdueUsers?.some(user => user.user_id === testUserId);
    console.log('✅ Overdue detection:', isOverdue ? '✅ WORKING' : '⚠️ NOT DETECTED');
    
    // Step 3: Test delivery trigger
    if (isOverdue) {
      const { data: triggerResult, error: triggerError } = await supabase
        .rpc('trigger_last_wish_delivery', { target_user_id: testUserId });
      
      console.log('✅ Delivery trigger:', triggerError ? `❌ ${triggerError.message}` : '✅ WORKING');
      
      // Check if delivery was logged
      const { data: deliveries, error: deliveryError } = await supabase
        .from('last_wish_deliveries')
        .select('*')
        .eq('user_id', testUserId);
      
      console.log('✅ Delivery logging:', deliveryError ? `❌ ${deliveryError.message}` : `✅ ${deliveries?.length || 0} records`);
    }
    
    // Cleanup
    await supabase.from('last_wish_deliveries').delete().eq('user_id', testUserId);
    await supabase.from('last_wish_settings').delete().eq('user_id', testUserId);
    
    console.log('✅ Integration test cleanup: ✅ COMPLETED');
    
  } catch (error) {
    console.log('❌ Integration test failed:', error.message);
  }
}

async function runPostFixValidation() {
  console.log('Starting post-fix validation...\n');
  
  await testDatabaseFixes();
  await testAPIEndpoints();
  await testEmailConfiguration();
  await testSystemIntegration();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 POST-FIX VALIDATION COMPLETE');
  console.log('='.repeat(50));
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. If database tests pass → Database fixes successful');
  console.log('2. If API tests fail → Deploy to Vercel');
  console.log('3. If integration tests pass → System is operational');
  console.log('4. Test frontend component in browser');
  
  console.log('\n🏁 VALIDATION COMPLETE');
}

runPostFixValidation();

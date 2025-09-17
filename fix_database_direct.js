import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔧 DIRECT DATABASE FIXES FOR LAST WISH');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkCurrentState() {
  console.log('\n📊 Checking current database state...');
  
  try {
    // Check if delivery_triggered column exists by trying to select it
    const { data, error } = await supabase
      .from('last_wish_settings')
      .select('delivery_triggered')
      .limit(1);
    
    if (error && error.message.includes('delivery_triggered')) {
      console.log('❌ delivery_triggered column: MISSING');
      return { hasColumn: false, error: error.message };
    } else {
      console.log('✅ delivery_triggered column: EXISTS');
      return { hasColumn: true };
    }
    
  } catch (error) {
    console.log('❌ State check failed:', error.message);
    return { hasColumn: false, error: error.message };
  }
}

async function testCurrentFunction() {
  console.log('\n📊 Testing current check_overdue_last_wish function...');
  
  try {
    const { data, error } = await supabase.rpc('check_overdue_last_wish');
    
    if (error) {
      console.log('❌ Function test failed:', error.message);
      return { working: false, error: error.message };
    } else {
      console.log('✅ Function working:', `Found ${data?.length || 0} overdue users`);
      return { working: true, count: data?.length || 0 };
    }
    
  } catch (error) {
    console.log('❌ Function test error:', error.message);
    return { working: false, error: error.message };
  }
}

async function manualDatabaseCheck() {
  console.log('\n📊 Manual database structure check...');
  
  try {
    // Get current settings to see structure
    const { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ Cannot access last_wish_settings:', settingsError.message);
      return false;
    }
    
    console.log('✅ last_wish_settings table accessible');
    
    if (settings && settings.length > 0) {
      const record = settings[0];
      const hasDeliveryTriggered = 'delivery_triggered' in record;
      
      console.log('📋 Current record structure:');
      console.log('   Fields:', Object.keys(record).join(', '));
      console.log('   delivery_triggered field:', hasDeliveryTriggered ? '✅ EXISTS' : '❌ MISSING');
      
      return hasDeliveryTriggered;
    } else {
      console.log('⚠️  No records found to check structure');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Manual check failed:', error.message);
    return false;
  }
}

async function createTestRecord() {
  console.log('\n📊 Creating test record to verify functionality...');
  
  try {
    // Try to create a test record with delivery_triggered
    const testRecord = {
      user_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
      is_enabled: true,
      check_in_frequency: 30,
      last_check_in: new Date().toISOString(),
      recipients: [{ 
        id: '1', 
        email: 'test@example.com', 
        name: 'Test User', 
        relationship: 'friend' 
      }],
      include_data: { accounts: true },
      message: 'Test message',
      is_active: true
    };
    
    // Try with delivery_triggered field
    const { data: withField, error: withFieldError } = await supabase
      .from('last_wish_settings')
      .insert({ ...testRecord, delivery_triggered: false })
      .select();
    
    if (withFieldError) {
      console.log('❌ Test with delivery_triggered failed:', withFieldError.message);
      
      // Try without delivery_triggered field
      const { data: withoutField, error: withoutFieldError } = await supabase
        .from('last_wish_settings')
        .insert(testRecord)
        .select();
      
      if (withoutFieldError) {
        console.log('❌ Test without delivery_triggered failed:', withoutFieldError.message);
        return false;
      } else {
        console.log('✅ Test record created WITHOUT delivery_triggered field');
        
        // Clean up
        await supabase
          .from('last_wish_settings')
          .delete()
          .eq('user_id', testRecord.user_id);
        
        return { hasField: false };
      }
    } else {
      console.log('✅ Test record created WITH delivery_triggered field');
      
      // Clean up
      await supabase
        .from('last_wish_settings')
        .delete()
        .eq('user_id', testRecord.user_id);
      
      return { hasField: true };
    }
    
  } catch (error) {
    console.log('❌ Test record creation failed:', error.message);
    return false;
  }
}

async function runDiagnostic() {
  console.log('Starting comprehensive database diagnostic...\n');
  
  const currentState = await checkCurrentState();
  const functionTest = await testCurrentFunction();
  const manualCheck = await manualDatabaseCheck();
  const testResult = await createTestRecord();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC RESULTS');
  console.log('='.repeat(50));
  
  console.log('\n🔍 Column Status:');
  console.log(`   delivery_triggered exists: ${currentState.hasColumn ? '✅ YES' : '❌ NO'}`);
  
  console.log('\n🔍 Function Status:');
  console.log(`   check_overdue_last_wish works: ${functionTest.working ? '✅ YES' : '❌ NO'}`);
  if (functionTest.error) {
    console.log(`   Error: ${functionTest.error}`);
  }
  
  console.log('\n🔍 Manual Check:');
  console.log(`   Table structure check: ${manualCheck ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log('\n🔍 Test Record:');
  if (testResult && typeof testResult === 'object') {
    console.log(`   delivery_triggered field support: ${testResult.hasField ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log(`   Test record creation: ${testResult ? '✅ PASSED' : '❌ FAILED'}`);
  }
  
  console.log('\n🎯 CONCLUSION:');
  
  if (!currentState.hasColumn || !functionTest.working) {
    console.log('❌ DATABASE NEEDS MANUAL FIXES');
    console.log('\n📋 Required Actions:');
    console.log('1. Add delivery_triggered column to last_wish_settings table');
    console.log('2. Update check_overdue_last_wish function');
    console.log('3. Create trigger_last_wish_delivery function');
    
    console.log('\n🔧 SQL Commands to run in Supabase Dashboard:');
    console.log(`
-- Add missing column
ALTER TABLE last_wish_settings 
ADD COLUMN IF NOT EXISTS delivery_triggered BOOLEAN DEFAULT FALSE;

-- Update existing records
UPDATE last_wish_settings 
SET delivery_triggered = false 
WHERE delivery_triggered IS NULL;

-- Update function
CREATE OR REPLACE FUNCTION check_overdue_last_wish()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lws.user_id,
        COALESCE(p.email, au.email, 'unknown@example.com') as email,
        EXTRACT(days FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER as days_overdue
    FROM last_wish_settings lws
    LEFT JOIN profiles p ON lws.user_id = p.user_id
    LEFT JOIN auth.users au ON lws.user_id = au.id
    WHERE 
        lws.is_enabled = true 
        AND lws.is_active = true
        AND lws.delivery_triggered = false
        AND lws.last_check_in IS NOT NULL
        AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
  } else {
    console.log('✅ DATABASE IS READY - All checks passed!');
    console.log('\n🚀 Next steps:');
    console.log('1. Test API endpoints');
    console.log('2. Deploy to production');
    console.log('3. Run comprehensive validation');
  }
  
  console.log('\n🏁 DIAGNOSTIC COMPLETE');
}

runDiagnostic();

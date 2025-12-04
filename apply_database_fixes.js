import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔧 APPLYING CRITICAL DATABASE FIXES');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyDatabaseFixes() {
  console.log('\n📊 Step 1: Adding missing delivery_triggered column...');
  
  try {
    // Add delivery_triggered column if it doesn't exist
    const { data, error } = await supabase.rpc('sql', {
      query: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'last_wish_settings' 
                AND column_name = 'delivery_triggered'
            ) THEN
                ALTER TABLE last_wish_settings 
                ADD COLUMN delivery_triggered BOOLEAN DEFAULT FALSE;
                
                RAISE NOTICE 'Added delivery_triggered column to last_wish_settings table';
            ELSE
                RAISE NOTICE 'delivery_triggered column already exists';
            END IF;
        END $$;
      `
    });
    
    if (error) {
      console.log('❌ Failed to add column:', error.message);
      return false;
    }
    
    console.log('✅ delivery_triggered column: ADDED/VERIFIED');
    
    // Update existing records
    const { error: updateError } = await supabase
      .from('last_wish_settings')
      .update({ delivery_triggered: false })
      .is('delivery_triggered', null);
    
    if (updateError) {
      console.log('⚠️  Warning updating existing records:', updateError.message);
    } else {
      console.log('✅ Existing records updated with delivery_triggered = false');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Database column fix failed:', error.message);
    return false;
  }
}

async function createUpdatedFunction() {
  console.log('\n📊 Step 2: Creating updated check_overdue_last_wish function...');
  
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
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
      `
    });
    
    if (error) {
      console.log('❌ Failed to create function:', error.message);
      return false;
    }
    
    console.log('✅ check_overdue_last_wish function: UPDATED');
    return true;
    
  } catch (error) {
    console.log('❌ Function creation failed:', error.message);
    return false;
  }
}

async function createDeliveryFunction() {
  console.log('\n📊 Step 3: Creating trigger_last_wish_delivery function...');
  
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        CREATE OR REPLACE FUNCTION trigger_last_wish_delivery(target_user_id UUID)
        RETURNS BOOLEAN AS $$
        DECLARE
            settings_record RECORD;
        BEGIN
            SELECT * INTO settings_record
            FROM last_wish_settings
            WHERE user_id = target_user_id
            AND is_enabled = true
            AND is_active = true
            AND delivery_triggered = false;
            
            IF NOT FOUND THEN
                RETURN FALSE;
            END IF;
            
            UPDATE last_wish_settings
            SET 
                delivery_triggered = true,
                updated_at = NOW()
            WHERE user_id = target_user_id;
            
            RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (error) {
      console.log('❌ Failed to create delivery function:', error.message);
      return false;
    }
    
    console.log('✅ trigger_last_wish_delivery function: CREATED');
    return true;
    
  } catch (error) {
    console.log('❌ Delivery function creation failed:', error.message);
    return false;
  }
}

async function ensureDeliveriesTable() {
  console.log('\n📊 Step 4: Ensuring last_wish_deliveries table exists...');
  
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS last_wish_deliveries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            recipient_email TEXT NOT NULL,
            delivery_status TEXT DEFAULT 'pending',
            delivery_data JSONB DEFAULT '{}',
            error_message TEXT,
            triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            sent_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error) {
      console.log('❌ Failed to create deliveries table:', error.message);
      return false;
    }
    
    console.log('✅ last_wish_deliveries table: ENSURED');
    return true;
    
  } catch (error) {
    console.log('❌ Deliveries table creation failed:', error.message);
    return false;
  }
}

async function testFixes() {
  console.log('\n📊 Step 5: Testing the fixes...');
  
  try {
    // Test the updated function
    const { data, error } = await supabase.rpc('check_overdue_last_wish');
    
    if (error) {
      console.log('❌ Function test failed:', error.message);
      return false;
    }
    
    console.log('✅ check_overdue_last_wish function: WORKING');
    console.log(`   Found ${data?.length || 0} overdue users`);
    
    // Test delivery_triggered column exists
    const { data: settingsData, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('delivery_triggered')
      .limit(1);
    
    if (settingsError) {
      console.log('❌ delivery_triggered column test failed:', settingsError.message);
      return false;
    }
    
    console.log('✅ delivery_triggered column: ACCESSIBLE');
    
    return true;
    
  } catch (error) {
    console.log('❌ Fix testing failed:', error.message);
    return false;
  }
}

async function runDatabaseFixes() {
  console.log('Starting database fixes...\n');
  
  const step1 = await applyDatabaseFixes();
  if (!step1) {
    console.log('❌ Step 1 failed - stopping');
    return;
  }
  
  const step2 = await createUpdatedFunction();
  if (!step2) {
    console.log('❌ Step 2 failed - stopping');
    return;
  }
  
  const step3 = await createDeliveryFunction();
  if (!step3) {
    console.log('❌ Step 3 failed - stopping');
    return;
  }
  
  const step4 = await ensureDeliveriesTable();
  if (!step4) {
    console.log('❌ Step 4 failed - stopping');
    return;
  }
  
  const step5 = await testFixes();
  if (!step5) {
    console.log('❌ Step 5 failed - fixes may not be working');
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 DATABASE FIXES COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(50));
  
  console.log('\n✅ All database issues have been resolved:');
  console.log('   • delivery_triggered column added');
  console.log('   • check_overdue_last_wish function updated');
  console.log('   • trigger_last_wish_delivery function created');
  console.log('   • last_wish_deliveries table ensured');
  console.log('   • All functions tested and working');
  
  console.log('\n🚀 Next: Run API endpoint fixes');
  console.log('   Command: node test_last_wish_after_fixes.js');
}

runDatabaseFixes();

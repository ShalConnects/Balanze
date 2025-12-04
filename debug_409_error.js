import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 DEBUGGING 409 ERROR');
console.log('=' .repeat(50));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debug409Error() {
  try {
    // First, let's see what users exist in last_wish_settings
    console.log('\n📊 Current last_wish_settings records:');
    const { data: allSettings, error: allError } = await supabase
      .from('last_wish_settings')
      .select('*');
    
    if (allError) {
      console.log('❌ Error fetching all settings:', allError);
    } else {
      console.log(`✅ Found ${allSettings?.length || 0} records`);
      allSettings?.forEach((setting, i) => {
        console.log(`${i + 1}. User ID: ${setting.user_id}, Enabled: ${setting.is_enabled}, Active: ${setting.is_active}, Delivery Triggered: ${setting.delivery_triggered}`);
      });
    }
    
    // Now let's try to simulate the upsert that's failing
    if (allSettings && allSettings.length > 0) {
      const testUser = allSettings[0];
      console.log(`\n🧪 Testing upsert with user: ${testUser.user_id}`);
      
      // Try the exact same upsert operation that's failing
      const { data: upsertData, error: upsertError } = await supabase
        .from('last_wish_settings')
        .upsert({
          user_id: testUser.user_id,
          is_enabled: false, // Try to disable
          check_in_frequency: testUser.check_in_frequency || 30,
          last_check_in: testUser.last_check_in,
          recipients: testUser.recipients || [],
          include_data: testUser.include_data || {},
          message: testUser.message || '',
          is_active: false,
          delivery_triggered: false,
          updated_at: new Date().toISOString(),
        });
      
      if (upsertError) {
        console.log('❌ Upsert error:', upsertError);
        console.log('❌ Error code:', upsertError.code);
        console.log('❌ Error message:', upsertError.message);
        console.log('❌ Error details:', JSON.stringify(upsertError, null, 2));
      } else {
        console.log('✅ Upsert successful:', upsertData);
      }
    }
    
    // Let's also check the table structure
    console.log('\n🏗️  Checking table structure:');
    const { data: columns, error: colError } = await supabase
      .rpc('sql', { query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'last_wish_settings' 
        ORDER BY ordinal_position;
      ` });
    
    if (colError) {
      console.log('❌ Could not check table structure:', colError.message);
    } else if (columns) {
      console.log('✅ Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Debug error:', error.message);
  }
}

debug409Error();

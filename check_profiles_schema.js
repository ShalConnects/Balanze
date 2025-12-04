const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkProfilesSchema() {
  console.log('=== CHECKING PROFILES TABLE SCHEMA ===');
  
  try {
    // Query to get the current schema
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying profiles table:', error);
      return;
    }
    
    console.log('✅ Profiles table exists and is accessible');
    
    // Get the actual schema by trying to insert a test record
    const testId = '00000000-0000-0000-0000-000000000000';
    
    // Try to insert with minimal fields first
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        full_name: 'Test User'
      });
    
    if (insertError) {
      console.log('❌ Insert error (expected):', insertError.message);
      console.log('This tells us what fields are required');
    } else {
      console.log('✅ Basic insert worked');
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
    }
    
    // Try with more fields
    const { error: insertError2 } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        full_name: 'Test User',
        local_currency: 'USD',
        role: 'user',
        subscription: { plan: 'free', status: 'active', validUntil: null }
      });
    
    if (insertError2) {
      console.log('❌ Insert with all fields error:', insertError2.message);
    } else {
      console.log('✅ Full insert worked');
      // Clean up
      await supabase.from('profiles').delete().eq('id', testId);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProfilesSchema(); 
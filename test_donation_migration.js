const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndUpdateDonationTable() {
  try {
    console.log('Checking donation_saving_records table structure...');
    
    // First, let's check the current table structure
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'donation_saving_records')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('Error checking table structure:', columnError);
      return;
    }
    
    console.log('Current columns:', columns.map(c => c.column_name));
    
    // Check if mode_value and status columns exist
    const hasModeValue = columns.some(c => c.column_name === 'mode_value');
    const hasStatus = columns.some(c => c.column_name === 'status');
    
    console.log('Has mode_value:', hasModeValue);
    console.log('Has status:', hasStatus);
    
    if (!hasModeValue || !hasStatus) {
      console.log('Adding missing columns...');
      
      // Add missing columns
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE donation_saving_records 
          ADD COLUMN IF NOT EXISTS mode_value NUMERIC,
          ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'pending' CHECK (status IN ('pending', 'donated'));
          
          CREATE INDEX IF NOT EXISTS idx_donation_saving_status ON donation_saving_records(status);
        `
      });
      
      if (alterError) {
        console.error('Error adding columns:', alterError);
      } else {
        console.log('Successfully added missing columns');
      }
    } else {
      console.log('All required columns already exist');
    }
    
    // Test inserting a donation record
    console.log('Testing donation record insertion...');
    const testRecord = {
      user_id: 'test-user-id',
      transaction_id: 'test-transaction-id',
      type: 'donation',
      amount: 100,
      mode: 'fixed',
      mode_value: 100,
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('donation_saving_records')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.error('Error inserting test record:', insertError);
    } else {
      console.log('Successfully inserted test record:', insertData);
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('donation_saving_records')
        .delete()
        .eq('user_id', 'test-user-id');
      
      if (deleteError) {
        console.error('Error cleaning up test record:', deleteError);
      } else {
        console.log('Cleaned up test record');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndUpdateDonationTable(); 
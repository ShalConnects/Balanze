import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDonationTableSchema() {
  try {
    console.log('Checking donation_saving_records table schema...');
    
    // Try to select all columns to see what exists
    const { data, error } = await supabase
      .from('donation_saving_records')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing table:', error);
      return;
    }
    
    console.log('✅ Table is accessible');
    
    // Try to insert a test record with custom_transaction_id to see if the column exists
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      transaction_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      type: 'saving',
      amount: 10,
      mode: 'fixed',
      custom_transaction_id: 'TEST-001',
      note: 'Test record'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('donation_saving_records')
      .insert(testRecord);
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      
      if (insertError.message.includes('custom_transaction_id')) {
        console.log('The custom_transaction_id column is missing. Please add it manually:');
        console.log('');
        console.log('ALTER TABLE donation_saving_records ADD COLUMN custom_transaction_id VARCHAR(64);');
      }
    } else {
      console.log('✅ custom_transaction_id column exists');
      
      // Clean up the test record
      await supabase
        .from('donation_saving_records')
        .delete()
        .eq('custom_transaction_id', 'TEST-001');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDonationTableSchema(); 
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createDonationTable() {
  try {
    console.log('Creating donation_saving_records table...');
    
    // First, let's check if the table already exists
    const { data: existingData, error: existingError } = await supabase
      .from('donation_saving_records')
      .select('*')
      .limit(1);
    
    if (!existingError) {
      console.log('✅ Table already exists');
      return;
    }
    
    console.log('Table does not exist, creating...');
    
    // Since we can't execute raw SQL through the client, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return;
    }
    
    console.log('Available tables:', tables.map(t => t.table_name));
    
    // For now, let's create a simple test to see if we can access the table
    console.log('Please run the SQL migration manually in your Supabase dashboard:');
    console.log('');
    console.log('CREATE TABLE IF NOT EXISTS donation_saving_records (');
    console.log('    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,');
    console.log('    transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,');
    console.log('    type VARCHAR(16) NOT NULL CHECK (type IN (\'saving\', \'donation\')),');
    console.log('    amount NUMERIC NOT NULL CHECK (amount >= 0),');
    console.log('    mode VARCHAR(8) NOT NULL CHECK (mode IN (\'fixed\', \'percent\')),');
    console.log('    custom_transaction_id VARCHAR(64),');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),');
    console.log('    note TEXT');
    console.log(');');
    console.log('');
    console.log('CREATE INDEX IF NOT EXISTS idx_donation_saving_user_id ON donation_saving_records(user_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_donation_saving_transaction_id ON donation_saving_records(transaction_id);');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createDonationTable(); 
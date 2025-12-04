import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function applyMigration() {
  try {
    console.log('Applying donation_saving_records migration...');
    
    // Read the SQL file
    const sql = fs.readFileSync('add_donation_saving_records_table.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Migration error:', error);
      return;
    }
    
    console.log('✅ Migration applied successfully');
    
    // Verify the table exists
    const { data: tableData, error: tableError } = await supabase
      .from('donation_saving_records')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table verification failed:', tableError);
    } else {
      console.log('✅ Table verified successfully');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

applyMigration(); 
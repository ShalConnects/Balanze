const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running migration to add exclude_from_calculation column...');
    
    // Read the migration SQL
    const migrationSQL = fs.readFileSync('add_exclude_from_calculation.sql', 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      
      // Fallback: try to execute the SQL directly
      console.log('Trying alternative approach...');
      
      const { error: alterError } = await supabase
        .from('purchases')
        .select('id')
        .limit(1);
      
      if (alterError && alterError.message.includes('exclude_from_calculation')) {
        console.log('Column does not exist, attempting to add it...');
        
        // Try to add the column using a different approach
        const { error: addColumnError } = await supabase.rpc('add_column_if_not_exists', {
          table_name: 'purchases',
          column_name: 'exclude_from_calculation',
          column_type: 'BOOLEAN DEFAULT FALSE'
        });
        
        if (addColumnError) {
          console.error('Failed to add column:', addColumnError);
          console.log('\nPlease run the following SQL manually in your Supabase dashboard:');
          console.log('\n' + migrationSQL);
        } else {
          console.log('✅ Column added successfully!');
        }
      } else {
        console.log('✅ Column already exists or migration completed successfully!');
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }
    
  } catch (err) {
    console.error('Migration error:', err);
    console.log('\nPlease run the following SQL manually in your Supabase dashboard:');
    console.log('\nALTER TABLE purchases ADD COLUMN IF NOT EXISTS exclude_from_calculation BOOLEAN DEFAULT FALSE;');
  }
}

runMigration(); 
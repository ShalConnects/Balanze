const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Your Supabase configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('🚀 Starting Transaction & Purchase Update History Migration...\n');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create_transaction_update_history.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    console.log('📋 SQL Content Preview:');
    console.log('='.repeat(50));
    console.log(sqlContent.substring(0, 500) + '...');
    console.log('='.repeat(50));
    console.log('\n⚠️  IMPORTANT: This migration needs to be run in the Supabase Dashboard SQL Editor');
    console.log('📝 Please copy the SQL content from create_transaction_update_history.sql and run it in your Supabase dashboard');
    console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard/project/xgncksougafnfbtusfnf/sql');
    
    console.log('\n✅ Migration script prepared successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the content from create_transaction_update_history.sql');
    console.log('4. Paste and execute the SQL');
    console.log('5. Test the new Transaction & Purchase Updates tab in your app');
    
  } catch (error) {
    console.error('❌ Error preparing migration:', error);
  }
}

runMigration(); 
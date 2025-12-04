import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking tables in your Supabase database...');
  
  // Check if auth.users exists
  try {
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('❌ auth.users table error:', usersError.message);
    } else {
      console.log('✅ auth.users table exists');
    }
  } catch (error) {
    console.log('❌ auth.users table not accessible:', error.message);
  }
  
  // Check if purchase_categories exists
  try {
    const { data: categories, error: categoriesError } = await supabase
      .from('purchase_categories')
      .select('id')
      .limit(1);
    
    if (categoriesError) {
      console.log('❌ purchase_categories table error:', categoriesError.message);
    } else {
      console.log('✅ purchase_categories table exists');
    }
  } catch (error) {
    console.log('❌ purchase_categories table not accessible:', error.message);
  }
  
  // Check if accounts table exists
  try {
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);
    
    if (accountsError) {
      console.log('❌ accounts table error:', accountsError.message);
    } else {
      console.log('✅ accounts table exists');
    }
  } catch (error) {
    console.log('❌ accounts table not accessible:', error.message);
  }
}

checkTables(); 
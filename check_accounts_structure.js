import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAccountsStructure() {
  console.log('=== CHECKING ACCOUNTS TABLE STRUCTURE ===\n');
  
  try {
    // Try to get accounts data
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing accounts:', error.message);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('✅ Accounts table exists but is empty');
      console.log('Let me try to create a simple account...');
      
      // Try with minimal fields
      const { data: newAccount, error: createError } = await supabase
        .from('accounts')
        .insert({
          name: 'Test Account'
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Cannot create account:', createError.message);
        return;
      }
      
      console.log('✅ Created test account:', newAccount);
      return newAccount;
    }
    
    console.log('✅ Found existing account:');
    console.log(JSON.stringify(accounts[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAccountsStructure(); 
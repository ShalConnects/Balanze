import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTransactions() {
  console.log('=== CHECKING TRANSACTIONS TABLE ===\n');
  
  try {
    // Check if table exists and has data
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Error accessing transactions table:', error.message);
      return;
    }
    
    if (!transactions || transactions.length === 0) {
      console.log('❌ No transactions found in table');
      
      // Let's check what tables exist
      console.log('\nChecking available tables...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tablesError) {
        console.log('❌ Cannot check tables:', tablesError.message);
      } else {
        console.log('Available tables:');
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
      return;
    }
    
    console.log(`✅ Found ${transactions.length} transactions`);
    console.log('\nSample transactions:');
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ID: ${tx.id}, Transaction ID: ${tx.transaction_id}, Description: "${tx.description}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTransactions(); 
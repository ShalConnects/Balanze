import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('=== CHECKING DATABASE ===\n');
  
  const tables = ['transactions', 'purchases', 'accounts', 'transaction_history', 'purchase_updates'];
  
  for (const tableName of tables) {
    console.log(`Checking ${tableName} table...`);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Found ${data?.length || 0} records`);
        if (data && data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(data[0], null, 2)}`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
    
    console.log('');
  }
}

checkDatabase(); 
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSavingsColumns() {
  console.log('🔍 Checking savings_goals table structure...');
  
  try {
    // Try to get one record to see the structure
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing savings_goals:', error.message);
      
      // Try to check if table exists
      try {
        const { data: testData, error: testError } = await supabase
          .from('savings_goals')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.log('❌ Table may not exist or have different structure');
        }
      } catch (err) {
        console.log('❌ Cannot access savings_goals table at all');
      }
    } else {
      console.log('✅ savings_goals table accessible');
      if (data && data.length > 0) {
        console.log('📋 Columns found:', Object.keys(data[0]));
        console.log('📋 Sample data:', data[0]);
      } else {
        console.log('📋 Table exists but is empty');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSavingsColumns(); 
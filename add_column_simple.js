import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  try {
    console.log('Attempting to add exclude_from_calculation column...');
    
    // First, let's check if the column already exists
    const { data: testData, error: testError } = await supabase
      .from('purchases')
      .select('id, exclude_from_calculation')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('exclude_from_calculation')) {
        console.log('Column does not exist. Please run the following SQL manually in your Supabase dashboard:');
        console.log('\nALTER TABLE purchases ADD COLUMN IF NOT EXISTS exclude_from_calculation BOOLEAN DEFAULT FALSE;');
        console.log('\nOr copy the contents of add_exclude_from_calculation.sql file.');
      } else {
        console.error('Error checking column:', testError);
      }
    } else {
      console.log('✅ Column already exists!');
    }
    
  } catch (err) {
    console.error('Error:', err);
    console.log('\nPlease run the following SQL manually in your Supabase dashboard:');
    console.log('\nALTER TABLE purchases ADD COLUMN IF NOT EXISTS exclude_from_calculation BOOLEAN DEFAULT FALSE;');
  }
}

addColumn(); 
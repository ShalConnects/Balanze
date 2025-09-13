/**
 * Check Last Wish Settings
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSettings() {
  const userId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
  
  console.log('Checking Last Wish settings for user:', userId);
  
  const { data, error } = await supabase
    .from('last_wish_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.log('Error:', error.message);
    console.log('This means Last Wish is not configured yet.');
    console.log('');
    console.log('To configure Last Wish:');
    console.log('1. Go to your app');
    console.log('2. Navigate to Last Wish settings');
    console.log('3. Enable Last Wish');
    console.log('4. Add recipients');
    console.log('5. Save settings');
  } else {
    console.log('Settings found:', data);
  }
}

checkSettings();

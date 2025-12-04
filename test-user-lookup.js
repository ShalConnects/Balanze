/**
 * Test User Lookup
 * 
 * This script tests if we can look up the user
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 Testing User Lookup...');
console.log('=' .repeat(50));
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
console.log('Service Key:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testUserLookup() {
  try {
    const userId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
    console.log(`Looking up user: ${userId}`);
    
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (user) {
      console.log('✅ User found:', user.user.email);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testUserLookup();

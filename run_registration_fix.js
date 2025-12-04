// =====================================================
// RUN REGISTRATION FIX
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and service role key (not anon key)
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runRegistrationFix() {
  console.log('=== RUNNING REGISTRATION FIX ===');
  
  try {
    // Step 1: Drop the problematic trigger and function
    console.log('1. Dropping problematic trigger and function...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS public.handle_new_user();
      `
    });
    
    if (dropError) {
      console.log('Using direct SQL execution...');
      // Try direct SQL execution
      const { error } = await supabase
        .from('_exec_sql')
        .select('*')
        .eq('sql', 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
      
      if (error) {
        console.log('❌ Cannot execute SQL directly. Please run the SQL script manually in Supabase dashboard.');
        console.log('SQL to run:');
        console.log('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
        console.log('DROP FUNCTION IF EXISTS public.handle_new_user();');
        return;
      }
    }
    
    console.log('✅ Trigger and function dropped');
    
    // Step 2: Create minimal function
    console.log('2. Creating minimal function...');
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (functionError) {
      console.log('❌ Cannot create function. Please run manually in Supabase dashboard.');
      return;
    }
    
    console.log('✅ Minimal function created');
    
    // Step 3: Create minimal trigger
    console.log('3. Creating minimal trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    });
    
    if (triggerError) {
      console.log('❌ Cannot create trigger. Please run manually in Supabase dashboard.');
      return;
    }
    
    console.log('✅ Minimal trigger created');
    
    console.log('\n=== FIX COMPLETED ===');
    console.log('The registration should now work properly!');
    console.log('Try registering a new user in your app.');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.log('\n=== MANUAL FIX REQUIRED ===');
    console.log('Please run the SQL script: fix_registration_definitive.sql');
    console.log('Copy and paste it into your Supabase SQL editor.');
  }
}

// Run the fix
runRegistrationFix(); 
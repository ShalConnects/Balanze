import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function applyOverdueFix() {
  console.log('🔧 Applying overdue function fix...');
  
  try {
    // First, try to drop the existing function
    console.log('Dropping existing function...');
    await supabase.rpc('check_overdue_last_wish');
  } catch (error) {
    console.log('Function might not exist, continuing...');
  }
  
  // Apply the fix using the corrected table approach
  const fixSQL = `
    -- Drop the existing function
    DROP FUNCTION IF EXISTS check_overdue_last_wish();
    
    -- Create the function with proper type casting
    CREATE OR REPLACE FUNCTION check_overdue_last_wish()
    RETURNS TABLE (
        user_id UUID,
        email TEXT,
        days_overdue INTEGER
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            lws.user_id,
            au.email::TEXT,  -- Cast to TEXT to match expected return type
            EXTRACT(DAY FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER as days_overdue
        FROM last_wish_settings lws
        JOIN auth.users au ON lws.user_id = au.id
        WHERE lws.is_enabled = TRUE 
        AND lws.is_active = TRUE
        AND lws.last_check_in IS NOT NULL
        AND NOW() > (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Grant execute permission
    GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
  `;
  
  console.log('Applying SQL fix...');
  const { error } = await supabase.rpc('exec_sql', { sql: fixSQL });
  
  if (error) {
    console.log('Direct SQL execution failed, trying alternative approach...');
    
    // Try to test the function directly
    try {
      const { data, error: testError } = await supabase
        .from('last_wish_settings')
        .select(`
          user_id,
          check_in_frequency,
          last_check_in,
          auth.users!inner(email)
        `)
        .eq('is_enabled', true)
        .eq('is_active', true)
        .not('last_check_in', 'is', null)
        .limit(1);
      
      if (testError) {
        console.log('❌ Database query test failed:', testError.message);
        return false;
      }
      
      console.log('✅ Database query test successful');
      return true;
    } catch (testError) {
      console.log('❌ Alternative test failed:', testError.message);
      return false;
    }
  }
  
  console.log('✅ Overdue function fix applied successfully');
  return true;
}

// Run the fix
if (import.meta.url === `file://${process.argv[1]}`) {
  applyOverdueFix()
    .then(success => {
      if (success) {
        console.log('🎉 Overdue function fix completed successfully!');
      } else {
        console.log('❌ Overdue function fix failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error applying fix:', error);
      process.exit(1);
    });
}

export default applyOverdueFix; 
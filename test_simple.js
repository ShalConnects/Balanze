// Simple test to check database connection
console.log('=== TESTING DATABASE CONNECTION ===');

// Check if environment variables are set
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

// Try to require supabase
try {
  const { createClient } = require('@supabase/supabase-js');
  console.log('✅ Supabase package loaded successfully');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('❌ Environment variables not set');
    process.exit(1);
  }
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  console.log('✅ Supabase client created');
  
  // Test a simple query
  supabase.from('profiles').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Query error:', error.message);
      } else {
        console.log('✅ Database connection successful');
      }
    });
    
} catch (error) {
  console.log('❌ Error loading Supabase:', error.message);
} 
// Test API status and environment variables
import { createClient } from '@supabase/supabase-js';

// Test if environment variables are working
console.log('🔍 Testing API Environment Variables...\n');

// Check Supabase connection
try {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  console.log('✅ Supabase client created successfully');
  console.log(`   - URL: ${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}`);
  console.log(`   - Service Key: ${process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Missing'}`);
} catch (error) {
  console.error('❌ Supabase client creation failed:', error.message);
}

// Check SMTP configuration
console.log('\n📧 Testing SMTP Configuration...');
console.log(`   - SMTP_HOST: ${process.env.SMTP_HOST || 'Missing'}`);
console.log(`   - SMTP_PORT: ${process.env.SMTP_PORT || 'Missing'}`);
console.log(`   - SMTP_USER: ${process.env.SMTP_USER ? 'Set' : 'Missing'}`);
console.log(`   - SMTP_PASS: ${process.env.SMTP_PASS ? 'Set' : 'Missing'}`);

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.log('\n❌ SMTP configuration is incomplete!');
  console.log('   Please set SMTP_USER and SMTP_PASS in Vercel environment variables.');
} else {
  console.log('\n✅ SMTP configuration looks complete');
}

// Test database connection
async function testDatabaseConnection() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    console.log('\n🗄️ Testing Database Connection...');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('last_wish_settings')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabaseConnection();

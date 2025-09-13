import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Also try reading the file directly
console.log('📁 Reading .env.local file directly:');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('File content length:', envContent.length);
  console.log('First 200 chars:', envContent.substring(0, 200));
} catch (error) {
  console.log('Error reading file:', error.message);
}

console.log('🔍 Environment Variables Debug');
console.log('=' .repeat(50));
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS);
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Test if variables are loaded
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  console.log('✅ SMTP credentials are loaded correctly!');
} else {
  console.log('❌ SMTP credentials are missing!');
}

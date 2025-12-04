/**
 * Simple Test Email Sender for Last Wish
 * 
 * This script sends a real test email from salauddin.kader406@gmail.com 
 * to salauddin.kader405@gmail.com
 * 
 * Required environment variables:
 * - VITE_SUPABASE_URL or SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 * - SMTP_USER
 * - SMTP_PASS
 * - SMTP_HOST (default: smtp.gmail.com)
 * - SMTP_PORT (default: 587)
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  Last Wish Test Email Sender');
  console.log('='.repeat(70) + '\n');

  console.log('📧 This will send a test email from:');
  console.log('   FROM: salauddin.kader406@gmail.com');
  console.log('   TO: salauddin.kader405@gmail.com\n');

  // Check if .env exists
  console.log('⚙️  Configuration Options:\n');
  console.log('1. Enter configuration manually (recommended)');
  console.log('2. Use environment variables from system\n');

  const choice = await question('Choose option (1 or 2): ');

  let config = {};

  if (choice === '1') {
    console.log('\n📋 Please provide the following information:\n');
    
    config.SUPABASE_URL = await question('Supabase URL: ');
    config.SUPABASE_SERVICE_KEY = await question('Supabase Service Key: ');
    config.SMTP_HOST = await question('SMTP Host (default: smtp.gmail.com): ') || 'smtp.gmail.com';
    config.SMTP_PORT = await question('SMTP Port (default: 587): ') || '587';
    config.SMTP_USER = await question('SMTP User (email): ');
    config.SMTP_PASS = await question('SMTP Password (App Password): ');
  } else {
    config.SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    config.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    config.SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    config.SMTP_PORT = process.env.SMTP_PORT || '587';
    config.SMTP_USER = process.env.SMTP_USER;
    config.SMTP_PASS = process.env.SMTP_PASS;

    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_KEY) {
      console.log('\n❌ Error: Missing required environment variables');
      console.log('Please set up your .env file or use option 1\n');
      rl.close();
      return;
    }
  }

  rl.close();

  console.log('\n✅ Configuration loaded');
  console.log('\n🚀 Starting email test...\n');

  // Set environment variables for the API
  process.env.VITE_SUPABASE_URL = config.SUPABASE_URL;
  process.env.SUPABASE_URL = config.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_KEY = config.SUPABASE_SERVICE_KEY;
  process.env.SMTP_HOST = config.SMTP_HOST;
  process.env.SMTP_PORT = config.SMTP_PORT;
  process.env.SMTP_USER = config.SMTP_USER;
  process.env.SMTP_PASS = config.SMTP_PASS;

  // Now import and run the actual test
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_KEY
  );

  try {
    // Get user
    console.log('📋 Finding user salauddin.kader406@gmail.com...');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw new Error(`User lookup failed: ${userError.message}`);

    const testUser = users.find(u => u.email === 'salauddin.kader406@gmail.com');
    
    if (!testUser) {
      throw new Error('User salauddin.kader406@gmail.com not found');
    }

    console.log(`✅ Found user: ${testUser.email}\n`);

    // Update or create settings
    console.log('📋 Setting up test configuration...');
    
    const { data: existingSettings } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (!existingSettings) {
      // Create settings
      await supabase.from('last_wish_settings').insert({
        user_id: testUser.id,
        is_enabled: true,
        is_active: true,
        check_in_frequency: 30,
        last_check_in: new Date().toISOString(),
        recipients: [{
          id: '1',
          email: 'salauddin.kader405@gmail.com',
          name: 'Salauddin Recipient',
          relationship: 'friend'
        }],
        include_data: {
          accounts: true,
          transactions: true,
          purchases: true,
          lendBorrow: true,
          savings: true
        },
        message: 'This is a test of the new Last Wish email design with PDF generation! 🎉'
      });
    } else {
      // Update settings
      await supabase.from('last_wish_settings').update({
        recipients: [{
          id: '1',
          email: 'salauddin.kader405@gmail.com',
          name: 'Salauddin Recipient',
          relationship: 'friend'
        }],
        is_enabled: true,
        is_active: true,
        message: 'This is a test of the new Last Wish email design with PDF generation! 🎉'
      }).eq('user_id', testUser.id);
    }

    console.log('✅ Configuration ready\n');

    // Import and call the email function
    console.log('📧 Sending email...\n');
    console.log('='.repeat(70));

    const emailModule = await import('./api/send-last-wish-email.js');
    
    const mockReq = {
      method: 'POST',
      body: { userId: testUser.id, testMode: true }
    };

    let result = null;
    const mockRes = {
      setHeader: () => {},
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { result = data; return this; },
      end: () => {}
    };

    await emailModule.default(mockReq, mockRes);

    console.log('='.repeat(70));
    
    if (result && result.success) {
      console.log('\n✅ SUCCESS! Email sent!\n');
      console.log(`📧 Recipients: ${result.totalSent} email(s) sent`);
      result.results.forEach(r => {
        console.log(`   ${r.success ? '✅' : '❌'} ${r.recipient}`);
      });
      console.log('\n🎉 Check salauddin.kader405@gmail.com for the new email design!');
      console.log('\n📎 Attachments included:');
      console.log('   - financial-data-backup.json (complete data)');
      console.log('   - financial-data-backup.pdf (human-readable PDF)');
      console.log('\n✨ Features in this email:');
      console.log('   - Personal greeting with recipient name');
      console.log('   - User display name (not email)');
      console.log('   - Beautiful green gradient design');
      console.log('   - Compassionate, warm tone');
      console.log('   - Privacy-focused messaging\n');
    } else {
      console.log('\n❌ FAILED!');
      console.log('Error:', result?.error || 'Unknown error');
      console.log('\nPlease check:');
      console.log('   - SMTP credentials are correct');
      console.log('   - App Password is enabled (for Gmail)');
      console.log('   - Supabase keys are valid\n');
    }

  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    console.log('\nStack trace:');
    console.log(error.stack);
  }
}

main().then(() => {
  console.log('\n' + '='.repeat(70));
  console.log('  Test Complete');
  console.log('='.repeat(70) + '\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

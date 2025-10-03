import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function sendRealTestEmail() {
  console.log('🚀 Starting real test email delivery...\n');

  try {
    // Step 1: Get the user ID for salauddin.kader406@gmail.com
    console.log('📋 Step 1: Finding user salauddin.kader406@gmail.com...');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }

    const testUser = users.find(u => u.email === 'salauddin.kader406@gmail.com');
    
    if (!testUser) {
      throw new Error('User salauddin.kader406@gmail.com not found');
    }

    console.log(`✅ Found user: ${testUser.email} (ID: ${testUser.id})\n`);

    // Step 2: Check/Update Last Wish settings
    console.log('📋 Step 2: Checking Last Wish settings...');
    let { data: settings, error: settingsError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (settingsError || !settings) {
      console.log('⚠️  No settings found, creating test settings...');
      
      // Create test settings
      const { data: newSettings, error: createError } = await supabase
        .from('last_wish_settings')
        .insert({
          user_id: testUser.id,
          is_enabled: true,
          is_active: true,
          check_in_frequency: 30,
          last_check_in: new Date().toISOString(),
          recipients: [
            {
              id: '1',
              email: 'salauddin.kader405@gmail.com',
              name: 'Salauddin Test Recipient',
              relationship: 'friend'
            }
          ],
          include_data: {
            accounts: true,
            transactions: true,
            purchases: true,
            lendBorrow: true,
            savings: true,
            analytics: true
          },
          message: 'This is a test email from the Last Wish system. If you\'re reading this, the new email design with PDF generation is working perfectly!'
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create settings: ${createError.message}`);
      }

      settings = newSettings;
      console.log('✅ Test settings created\n');
    } else {
      // Update existing settings to ensure recipient is correct
      console.log('✅ Settings found, updating recipient...');
      
      const { error: updateError } = await supabase
        .from('last_wish_settings')
        .update({
          recipients: [
            {
              id: '1',
              email: 'salauddin.kader405@gmail.com',
              name: 'Salauddin Test Recipient',
              relationship: 'friend'
            }
          ],
          message: 'This is a test email from the Last Wish system. If you\'re reading this, the new email design with PDF generation is working perfectly!',
          is_enabled: true,
          is_active: true
        })
        .eq('user_id', testUser.id);

      if (updateError) {
        console.log(`⚠️  Update warning: ${updateError.message}`);
      } else {
        console.log('✅ Recipient updated to salauddin.kader405@gmail.com\n');
      }
    }

    // Step 3: Import and call the email function
    console.log('📋 Step 3: Importing email function...');
    const { default: sendLastWishEmailModule } = await import('./api/send-last-wish-email.js');
    
    // Get the sendLastWishEmail function from the module
    // The module exports a handler, but we need access to the sendLastWishEmail function
    // Let's call it directly via the API approach instead
    
    console.log('✅ Module imported\n');

    // Step 4: Send the email using direct function call
    console.log('📋 Step 4: Triggering email delivery in TEST MODE...\n');
    console.log('=' .repeat(60));
    
    // Import the module to get access to internal functions
    const emailModule = await import('./api/send-last-wish-email.js');
    
    // Since the module exports a handler, we'll use a workaround
    // Let's make a mock request/response and call the handler
    const mockReq = {
      method: 'POST',
      body: {
        userId: testUser.id,
        testMode: true
      }
    };

    const mockRes = {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader: function(key, value) {
        this.headers[key] = value;
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        console.log('\n' + '='.repeat(60));
        console.log('📧 EMAIL DELIVERY RESULT:');
        console.log('='.repeat(60));
        console.log(JSON.stringify(data, null, 2));
        console.log('='.repeat(60) + '\n');
        return this;
      },
      end: function() {
        return this;
      }
    };

    await emailModule.default(mockReq, mockRes);

    // Check the result
    if (mockRes.body && mockRes.body.success) {
      console.log('✅ SUCCESS! Test email sent!');
      console.log(`📧 Total sent: ${mockRes.body.totalSent}`);
      console.log(`📋 Recipients:`);
      mockRes.body.results.forEach(r => {
        console.log(`   ${r.success ? '✅' : '❌'} ${r.recipient} ${r.messageId ? `(${r.messageId})` : `(${r.error})`}`);
      });
      console.log('\n🎉 Check salauddin.kader405@gmail.com for the email!\n');
      console.log('📎 Attachments included:');
      console.log('   - financial-data-backup.json');
      console.log('   - financial-data-backup.pdf');
    } else {
      console.error('❌ FAILED!', mockRes.body?.error);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
sendRealTestEmail().then(() => {
  console.log('\n✅ Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

/**
 * Trigger email delivery with detailed error logging
 */

async function triggerWithDetailedLogging() {
  console.log('🔍 Triggering Last Wish with detailed error logging...\n');

  try {
    // First, let's try the direct email API with more detailed error handling
    console.log('1. Testing direct email API...');
    try {
      const emailResponse = await fetch('https://balanze.cash/api/send-last-wish-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'd1fe3ccc-3c57-4621-866a-6d0643137d53',
          testMode: false
        })
      });

      const emailResult = await emailResponse.json();
      console.log('📧 Direct Email API Result:');
      console.log(JSON.stringify(emailResult, null, 2));
      
    } catch (emailError) {
      console.log(`❌ Direct Email API Error: ${emailError.message}`);
    }

    console.log('\n2. Testing background process...');
    const bgResponse = await fetch('https://balanze.cash/api/last-wish-public', {
      method: 'GET'
    });

    if (bgResponse.ok) {
      const bgResult = await bgResponse.json();
      console.log('📊 Background Process Result:');
      console.log(JSON.stringify(bgResult, null, 2));
      
      if (bgResult.emailsSent > 0) {
        console.log('\n🎉 SUCCESS! Emails were sent!');
        console.log('📧 Check your inbox: salauddin.kader406@gmail.com');
      } else if (bgResult.emailResults && bgResult.emailResults.length > 0) {
        console.log('\n📋 Detailed Email Results:');
        bgResult.emailResults.forEach((result, index) => {
          console.log(`Email ${index + 1}:`);
          console.log(`  - User ID: ${result.user_id}`);
          console.log(`  - Success: ${result.success}`);
          console.log(`  - Error: ${result.error || 'None'}`);
        });
        
        // Check if the error has changed
        const errors = bgResult.emailResults.map(r => r.error).filter(e => e);
        const uniqueErrors = [...new Set(errors)];
        console.log(`\n🔍 Unique Errors: ${uniqueErrors.join(', ')}`);
        
        if (uniqueErrors.includes('Last Wish settings not found')) {
          console.log('\n💡 ANALYSIS: "Last Wish settings not found" error');
          console.log('   This suggests the API can\'t find the settings in Vercel environment');
          console.log('   Possible causes:');
          console.log('   1. Vercel environment variables not set correctly');
          console.log('   2. Supabase client configuration issue in production');
          console.log('   3. Database permissions issue in production');
        }
      }
    } else {
      console.log(`❌ Background Process Error: ${bgResponse.status} ${bgResponse.statusText}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('1. Check Vercel environment variables');
  console.log('2. Verify SUPABASE_SERVICE_KEY is set in Vercel');
  console.log('3. Check Vercel function logs for more details');
}

// Run the test
triggerWithDetailedLogging();

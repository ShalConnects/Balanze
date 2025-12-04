/**
 * Direct test of the email API endpoint
 */

async function testDirectEmailAPI() {
  console.log('🧪 Testing Direct Email API...\n');

  try {
    console.log('📞 Calling email API directly...');
    const response = await fetch('https://balanze.cash/api/send-last-wish-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'd1fe3ccc-3c57-4621-866a-6d0643137d53',
        testMode: false
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email API Response:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success && result.successful > 0) {
        console.log(`\n🎉 SUCCESS! ${result.successful} email(s) sent!`);
        console.log('📧 Check your inbox: salauddin.kader406@gmail.com');
      } else {
        console.log('\n⚠️ API call succeeded but no emails sent');
        if (result.error) {
          console.log(`❌ Error: ${result.error}`);
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error Response:');
      console.log(errorText);
      
      if (errorText.includes('nodemailer.createTransporter')) {
        console.log('\n💡 Issue: Still using old nodemailer method');
        console.log('🔄 Vercel deployment may still be in progress');
      }
    }

  } catch (error) {
    console.error('❌ Failed to call email API:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. If still getting nodemailer errors, wait for Vercel deployment');
  console.log('2. Check Vercel dashboard for deployment status');
  console.log('3. Try again in 1-2 minutes');
}

// Run the test
testDirectEmailAPI();

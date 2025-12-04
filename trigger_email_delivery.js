/**
 * Script to trigger the Last Wish email delivery for the overdue user
 */

async function triggerEmailDelivery() {
  console.log('🚀 Triggering Last Wish Email Delivery...\n');

  try {
    // Call the background process API
    console.log('📞 Calling background process API...');
    const response = await fetch('https://balanze.cash/api/last-wish-public', {
      method: 'GET'
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Background Process Response:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.emailsSent > 0) {
        console.log(`\n🎉 SUCCESS! ${result.emailsSent} email(s) sent!`);
        console.log('📧 Check your inbox: salauddin.kader406@gmail.com');
      } else if (result.processedCount > 0) {
        console.log(`\n⚠️ ${result.processedCount} user(s) processed but ${result.emailsFailed || 0} emails failed`);
        if (result.emailResults) {
          console.log('📋 Email Results:', result.emailResults);
        }
      } else {
        console.log('\nℹ️ No overdue users found or processed');
      }
    } else {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('📋 Error Details:', errorText.substring(0, 500));
    }

  } catch (error) {
    console.error('❌ Failed to trigger email delivery:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Check your email inbox: salauddin.kader406@gmail.com');
  console.log('2. Check spam folder if not in inbox');
  console.log('3. If no email received, check Vercel function logs');
}

// Run the trigger
triggerEmailDelivery();

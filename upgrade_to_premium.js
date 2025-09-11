// =====================================================
// MANUAL PREMIUM UPGRADE SCRIPT
// Run this script to upgrade your account to premium without payment
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin access
);

async function upgradeToPremium(userEmail, durationMonths = 12) {
  console.log(`🔄 Upgrading ${userEmail} to premium for ${durationMonths} months...`);
  
  try {
    // Method 1: Use the admin function (if you have admin role)
    const { data: adminResult, error: adminError } = await supabase
      .rpc('admin_upgrade_by_email', {
        user_email: userEmail,
        duration_months: durationMonths,
        admin_notes: 'Manual upgrade for testing'
      });
    
    if (adminResult && adminResult.success) {
      console.log('✅ Successfully upgraded using admin function!');
      console.log('📊 Result:', adminResult);
      return adminResult;
    }
    
    if (adminError) {
      console.log('⚠️ Admin function failed, trying direct update...');
    }
    
    // Method 2: Direct database update
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError || !userData) {
      throw new Error(`User not found: ${userEmail}`);
    }
    
    const userId = userData.id;
    
    // Update the subscription directly
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription: {
          plan: 'premium',
          status: 'active',
          validUntil: new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: {
            max_accounts: -1,
            max_transactions: -1,
            max_currencies: -1,
            analytics: true,
            priority_support: true,
            export_data: true,
            custom_categories: true,
            lend_borrow: true,
            last_wish: true,
            advanced_charts: true,
            advanced_reporting: true
          },
          manual_upgrade: {
            upgraded_at: new Date().toISOString(),
            duration_months: durationMonths,
            notes: 'Manual upgrade for testing'
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('✅ Successfully upgraded using direct update!');
    console.log('📊 Updated profile:', updateResult[0]);
    
    // Verify the upgrade
    const { data: verifyResult, error: verifyError } = await supabase
      .from('profiles')
      .select('subscription')
      .eq('id', userId)
      .single();
    
    if (verifyError) {
      throw verifyError;
    }
    
    console.log('🔍 Verification - Current subscription:', verifyResult.subscription);
    
    return {
      success: true,
      message: 'User upgraded to premium successfully',
      user_id: userId,
      user_email: userEmail,
      subscription: verifyResult.subscription
    };
    
  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to check current subscription status
async function checkSubscriptionStatus(userEmail) {
  console.log(`🔍 Checking subscription status for ${userEmail}...`);
  
  try {
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError || !userData) {
      throw new Error(`User not found: ${userEmail}`);
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('subscription, full_name')
      .eq('id', userData.id)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    console.log('📊 Current subscription:', profileData.subscription);
    console.log('👤 User name:', profileData.full_name);
    
    return profileData.subscription;
    
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
    return null;
  }
}

// Main execution
async function main() {
  const userEmail = process.argv[2];
  const durationMonths = parseInt(process.argv[3]) || 12;
  
  if (!userEmail) {
    console.log('❌ Please provide a user email as the first argument');
    console.log('Usage: node upgrade_to_premium.js your-email@example.com [duration_months]');
    return;
  }
  
  console.log('🚀 Starting premium upgrade process...');
  console.log(`📧 User email: ${userEmail}`);
  console.log(`⏱️ Duration: ${durationMonths} months`);
  console.log('');
  
  // Check current status
  await checkSubscriptionStatus(userEmail);
  console.log('');
  
  // Perform upgrade
  const result = await upgradeToPremium(userEmail, durationMonths);
  
  console.log('');
  if (result.success) {
    console.log('🎉 Upgrade completed successfully!');
    console.log('✨ You now have access to all premium features:');
    console.log('   • Unlimited accounts');
    console.log('   • Unlimited transactions');
    console.log('   • Multiple currencies');
    console.log('   • Advanced analytics');
    console.log('   • Custom categories');
    console.log('   • Lend & borrow tracking');
    console.log('   • Last Wish feature');
    console.log('   • Advanced charts and reporting');
    console.log('   • Data export');
    console.log('   • Priority support');
  } else {
    console.log('❌ Upgrade failed:', result.error);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { upgradeToPremium, checkSubscriptionStatus }; 
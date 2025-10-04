// Manual script to upgrade user subscription
// Run this to manually upgrade your account after payment

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xgncksougafnfbtusfnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg3MTQwOSwiZXhwIjoyMDY1NDQ3NDA5fQ.v_IapZebhuo5NQ4mRfPAXtL8zSG1BY_SQIM-33Y6Feg'
);

async function upgradeUser() {
  try {
    // Replace with your actual user ID
    const userEmail = 'shalconnect00@gmail.com'; // Your email from the payment
    
    // Find user by email - try different column names
    let user, userError;
    
    // Try with 'email' column first
    const { data: userData1, error: error1 } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    console.log('Sample profiles data:', userData1);
    
    // Find user by the email you used for payment
    const { data: userData2, error: error2 } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', '%shal%')
      .limit(5);
    
    console.log('Users with "shal" in name:', userData2);
    
    if (userData2 && userData2.length > 0) {
      user = userData2[0]; // Use the first match
      userError = null;
    } else {
      userError = error2 || 'No user found';
    }
    
    if (userError || !user) {
      console.error('User not found:', userError);
      return;
    }
    
    console.log('Found user:', user);
    
    // Upgrade to Premium Lifetime
    const subscriptionData = {
      plan: 'premium',
      status: 'active',
      billing_cycle: 'lifetime',
      paddle_transaction_id: 'manual_upgrade_' + Date.now(),
      expires_at: null, // Lifetime never expires
      updated_at: new Date().toISOString()
    };
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription: subscriptionData })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return;
    }
    
    console.log('✅ Successfully upgraded user to Premium Lifetime!');
    console.log('User ID:', user.id);
    console.log('Subscription:', subscriptionData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

upgradeUser();

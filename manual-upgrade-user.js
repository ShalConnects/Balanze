// Manual script to upgrade user subscription
// Run this to manually upgrade your account after payment

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xgncksougafnfbtusfnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg3MTQwOSwiZXhwIjoyMDY1NDQ3NDA5fQ.v_IapZebhuo5NQ4mRfPAXtL8zSG1BY_SQIM-33Y6Feg'
);

async function upgradeUser() {
  try {
    // Use the email from the successful payment
    const userEmail = 'shalconnect00@gmail.com'; // Your email from the payment
    
    // Find user by email - try different column names
    let user, userError;
    
    // Try with 'email' column first
    const { data: userData1, error: error1 } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    console.log('Sample profiles data:', userData1);
    
    // Find user by the email from the payment URL
    const { data: userData2, error: error2 } = await supabase
      .from('profiles')
      .select('*')
      .or('full_name.ilike.%shal%,id.eq.a64955e1-c71e-4151-976f-8f0f68681022')
      .limit(10);
    
    console.log('Found users:', userData2);
    
    // Look for user with email shalconnect00@gmail.com or similar
    const targetUser = userData2?.find(u => 
      u.full_name?.toLowerCase().includes('shal') || 
      u.id === 'a64955e1-c71e-4151-976f-8f0f68681022'
    );
    
    if (targetUser) {
      user = targetUser;
      userError = null;
    } else {
      userError = error2 || 'No user found';
    }
    
    if (userError || !user) {
      console.error('User not found:', userError);
      return;
    }
    
    console.log('Found user:', user);
    
    // Upgrade to Premium Lifetime with actual transaction details
    const subscriptionData = {
      plan: 'premium',
      status: 'active',
      billing_cycle: 'lifetime',
      paddle_transaction_id: 'txn_01k6pse8b6ceqza6f2dy37h02b', // Actual transaction ID
      paddle_customer_id: 'ctm_01k6m4mptk702b2cdc5h700n56', // Actual customer ID
      expires_at: null, // Lifetime never expires
      updated_at: new Date().toISOString(),
      payment_method: 'paddle',
      amount_paid: 0.99,
      currency: 'USD'
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

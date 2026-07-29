// Manual script to upgrade user subscription
// Run this to manually upgrade your account after payment
// Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) in env

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) environment variables'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function upgradeUser() {
  try {
    // Use the email from the successful payment
    const userEmail = process.env.TARGET_USER_EMAIL || 'shalconnect00@gmail.com';
    
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
      .eq('email', userEmail)
      .maybeSingle();

    user = userData2;
    userError = error2;

    if (userError || !user) {
      console.error('Could not find user for', userEmail, userError);
      return;
    }

    const subscriptionData = {
      plan: 'premium',
      status: 'active',
      billing_cycle: 'lifetime',
      updated_at: new Date().toISOString(),
      payment_method: 'manual',
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription: subscriptionData })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update failed:', updateError);
      return;
    }

    console.log('Upgraded user', user.id);
  } catch (err) {
    console.error(err);
  }
}

upgradeUser();

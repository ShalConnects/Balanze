// Fix the subscription to correctly show lifetime plan
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

async function fixLifetimeSubscription() {
  try {
    const targetUserId = process.env.TARGET_USER_ID;
    if (!targetUserId) {
      console.error('Set TARGET_USER_ID to the profile UUID to update');
      process.exit(1);
    }

    // Correct subscription data for LIFETIME plan
    const subscriptionData = {
      plan: 'premium',
      status: 'active',
      billing_cycle: 'lifetime', // This is key
      paddle_transaction_id: process.env.PADDLE_TRANSACTION_ID || null,
      paddle_customer_id: process.env.PADDLE_CUSTOMER_ID || null,
      expires_at: null, // Lifetime never expires
      next_billing_date: null, // No next billing for lifetime
      updated_at: new Date().toISOString(),
      payment_method: 'paddle',
    };

    const { error } = await supabase
      .from('profiles')
      .update({ subscription: subscriptionData })
      .eq('id', targetUserId);

    if (error) {
      console.error('Update failed:', error);
      return;
    }

    console.log('Updated lifetime subscription for', targetUserId);
  } catch (err) {
    console.error(err);
  }
}

fixLifetimeSubscription();

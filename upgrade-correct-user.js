// Upgrade a user account after verifying payment
// Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) in env
// Optional: TARGET_USER_ID

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

async function upgradeCorrectUser() {
  try {
    const targetUserId = process.env.TARGET_USER_ID;
    if (!targetUserId) {
      console.error('Set TARGET_USER_ID to the profile UUID to upgrade');
      process.exit(1);
    }

    const subscriptionData = {
      plan: 'premium',
      status: 'active',
      billing_cycle: process.env.BILLING_CYCLE || 'lifetime',
      updated_at: new Date().toISOString(),
      payment_method: process.env.PAYMENT_METHOD || 'manual',
    };

    const { error } = await supabase
      .from('profiles')
      .update({ subscription: subscriptionData })
      .eq('id', targetUserId);

    if (error) {
      console.error('Upgrade failed:', error);
      return;
    }

    console.log('Upgraded user', targetUserId);
  } catch (err) {
    console.error(err);
  }
}

upgradeCorrectUser();

import { createClient } from '@supabase/supabase-js';

function required(name, value) {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    throw new Error('Usage: node scripts/diagnoseDowngradeFlow.js <user_id>');
  }

  const url = required('SUPABASE_URL or VITE_SUPABASE_URL', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const key = required(
    'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  );
  const supabase = createClient(url, key);

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, subscription, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) throw profileError;

  const { data: historyData, error: historyError } = await supabase
    .from('subscription_history')
    .select('id, plan_name, status, start_date, end_date, amount_paid, currency, payment_method, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (historyError) throw historyError;

  const latest = historyData?.[0] || null;
  const subscription = profileData?.subscription || {};
  const diagnostics = {
    hasPaddleSubscriptionId: Boolean(subscription?.paddle_subscription_id),
    profileStatus: subscription?.status || null,
    profilePlan: subscription?.plan || null,
    hasScheduledDowngradeSignal:
      Boolean(subscription?.scheduled_downgrade_at) ||
      Boolean(subscription?.downgrade_effective_date) ||
      subscription?.status === 'cancelled',
    latestHistory: latest,
    latestHistoryLooksLikeDowngrade:
      latest?.plan_name === 'free' ||
      latest?.status === 'cancelled' ||
      String(latest?.payment_method || '').toLowerCase().includes('downgrade'),
  };

}

main().catch((error) => {
  console.error(JSON.stringify({ error: error.message || String(error) }, null, 2));
  process.exit(1);
});

import { createClient } from '@supabase/supabase-js';

function required(name, value) {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function parseArgs(argv) {
  const [userId, paddleSubscriptionId, statusArg] = argv;
  if (!userId || !paddleSubscriptionId) {
    throw new Error('Usage: node scripts/reconcilePaddleSubscription.js <user_id> <paddle_subscription_id> [status]');
  }
  return { userId, paddleSubscriptionId, status: (statusArg || 'trialing').toLowerCase() };
}

function buildSubscription({ paddleSubscriptionId, status }) {
  const normalizedStatus = ['trialing', 'active', 'cancelled', 'expired', 'past_due'].includes(status) ? status : 'trialing';
  const plan = normalizedStatus === 'cancelled' || normalizedStatus === 'expired' ? 'free' : 'premium';
  return {
    plan,
    status: normalizedStatus,
    billing_cycle: 'monthly',
    paddle_subscription_id: paddleSubscriptionId,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  const { userId, paddleSubscriptionId, status } = parseArgs(process.argv.slice(2));
  const supabaseUrl = required('SUPABASE_URL or VITE_SUPABASE_URL', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const supabaseKey = required(
    'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY or VITE_SUPABASE_SERVICE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY
  );
  const supabase = createClient(supabaseUrl, supabaseKey);

  const subscription = buildSubscription({ paddleSubscriptionId, status });
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ subscription })
    .eq('id', userId);
  if (profileError) throw profileError;

  const { error: historyError } = await supabase
    .from('subscription_history')
    .insert({
      user_id: userId,
      plan_name: subscription.plan,
      status: subscription.plan === 'premium' ? 'active' : 'cancelled',
      start_date: new Date().toISOString(),
      end_date: null,
      amount_paid: 0,
      currency: 'USD',
      payment_method: 'paddle_reconcile',
    });
  if (historyError) throw historyError;

}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message || String(err) }, null, 2));
  process.exit(1);
});

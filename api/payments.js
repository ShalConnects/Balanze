/**
 * Combined payment API: PayPal (create/capture), Stripe checkout, Paddle webhook.
 * Route by query param: ?path=capture-paypal-order|create-paypal-order|create-checkout-session|paddle-webhook
 */
import crypto from 'crypto';
import Stripe from 'stripe';
import { supabase } from '../lib/supabaseServer.js';
import { requireAuthUser, requireAuthUserMatchingId } from '../lib/apiAuth.js';
import { applyCors } from '../lib/cors.js';

export const config = { api: { bodyParser: false } };

const PATH = {
  capturePayPal: 'capture-paypal-order',
  createPayPal: 'create-paypal-order',
  stripeCheckout: 'create-checkout-session',
  paddle: 'paddle-webhook',
  paddleSubscriptionDetails: 'get-paddle-subscription-details',
  scheduleDowngrade: 'schedule-downgrade',
};

function parsePath(req) {
  const u = req.url || '';
  const i = u.indexOf('?');
  const q = i >= 0 ? new URLSearchParams(u.slice(i)) : new URLSearchParams();
  return q.get('path') || '';
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json(data);
}

const PAYPAL_PLAN_PRICING = {
  premium_monthly: {
    amount: '7.99',
    currency: 'USD',
    description: 'Balanze Premium - Monthly Plan',
    billingCycle: 'monthly',
  },
  premium_lifetime: {
    amount: '199.99',
    currency: 'USD',
    description: 'Balanze Premium - Lifetime Access',
    billingCycle: 'lifetime',
  },
};

const ALLOWED_APP_ORIGINS = new Set([
  'https://balanze.cash',
  'https://www.balanze.cash',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]);

function getAppOrigin(req) {
  const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || 'https://balanze.cash').replace(/\/$/, '');
  const origin = (req.headers.origin || '').replace(/\/$/, '');
  if (origin && (ALLOWED_APP_ORIGINS.has(origin) || origin === appUrl)) return origin;
  return appUrl;
}

function isSafeRedirectUrl(url, allowedOrigin) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const base = new URL(allowedOrigin);
    return parsed.origin === base.origin && (parsed.protocol === 'https:' || parsed.protocol === 'http:');
  } catch {
    return false;
  }
}

function paddleApiKey() {
  return process.env.PADDLE_API_KEY || process.env.PADDLE_SECRET_KEY || process.env.PADDLE_LIVE_API_KEY || null;
}

// --- PayPal (DRY: shared auth) ---
// Use server env vars (PAYPAL_*) - VITE_* not available in Vercel serverless
async function paypalAuth() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const env = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
  if (!clientId || !clientSecret) throw new Error('PayPal credentials are not configured');
  const baseUrl = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const authData = await authRes.json();
  if (!authData.access_token) throw new Error('Failed to get PayPal access token');
  return { token: authData.access_token, baseUrl };
}

async function applyPayPalPremium(userId, planId, transactionId, amount, currency) {
  const plan = PAYPAL_PLAN_PRICING[planId];
  if (!plan || !supabase) return;
  const subscription = {
    plan: 'premium',
    status: 'active',
    billing_cycle: plan.billingCycle,
    payment_method: 'paypal',
    paypal_transaction_id: transactionId || null,
    expires_at: plan.billingCycle === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  await updateSubscriptionByUser(userId, subscription);
  await insertSubscriptionHistory(
    userId,
    {
      ...subscription,
      trial_started_at: new Date().toISOString(),
      trial_ends_at: subscription.expires_at,
    },
    transactionId ? `paypal:${transactionId}` : 'paypal',
    Number.parseFloat(amount) || Number.parseFloat(plan.amount),
    currency || plan.currency
  );
}

async function handleCapturePayPal(req, res, body) {
  const { orderId, planId } = body;
  const plan = PAYPAL_PLAN_PRICING[planId];
  if (!plan) return json(res, 400, { error: 'Invalid plan ID' });
  if (!orderId) return json(res, 400, { error: 'Missing orderId' });

  const auth = await requireAuthUser(req);
  if (!auth.user) return json(res, auth.status || 401, { error: auth.error || 'Unauthorized' });

  const { token, baseUrl } = await paypalAuth();
  const cap = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await cap.json();
  if (data.error) throw new Error(data.error.message || 'Failed to capture');
  if (data.status !== 'COMPLETED') throw new Error('Payment was not completed');
  const u = data.purchase_units?.[0]?.payments?.captures?.[0];
  if (!u) throw new Error('Capture details missing');

  const paidAmount = String(u.amount?.value || '');
  const paidCurrency = String(u.amount?.currency_code || '');
  if (paidAmount !== plan.amount || paidCurrency !== plan.currency) {
    return json(res, 400, { error: 'Captured amount does not match plan pricing' });
  }

  const customId = data.purchase_units?.[0]?.custom_id;
  if (customId && customId !== planId) {
    return json(res, 400, { error: 'Order plan mismatch' });
  }

  await applyPayPalPremium(auth.user.id, planId, u.id, paidAmount, paidCurrency);
  json(res, 200, {
    success: true,
    transactionId: u.id,
    amount: paidAmount,
    currency: paidCurrency,
    planId,
  });
}

async function handleCreatePayPalOrder(req, res, body) {
  const { planId } = body;
  const plan = PAYPAL_PLAN_PRICING[planId];
  if (!plan) return json(res, 400, { error: 'Invalid plan ID' });

  const auth = await requireAuthUser(req);
  if (!auth.user) return json(res, auth.status || 401, { error: auth.error || 'Unauthorized' });

  const { token, baseUrl } = await paypalAuth();
  const origin = getAppOrigin(req);
  const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: plan.currency, value: plan.amount },
        description: plan.description,
        custom_id: planId,
      }],
      application_context: {
        return_url: `${origin}/settings?tab=plans&success=true`,
        cancel_url: `${origin}/settings?tab=plans&canceled=true`,
      },
    }),
  });
  const orderData = await orderRes.json();
  if (orderData.error) throw new Error(orderData.error.message || 'Failed to create order');
  json(res, 200, { orderId: orderData.id });
}

// --- Stripe ---
const STRIPE_PRICING = {
  premium_monthly: { price: 799, currency: 'usd', interval: 'month' },
  premium_lifetime: { price: 19999, currency: 'usd', interval: 'one-time' },
};

async function handleCreateCheckoutSession(req, res, body) {
  const { planId, customerEmail, successUrl, cancelUrl } = body;
  const plan = STRIPE_PRICING[planId];
  if (!plan) return json(res, 400, { error: 'Invalid plan ID' });

  const auth = await requireAuthUser(req);
  if (!auth.user) return json(res, auth.status || 401, { error: auth.error || 'Unauthorized' });

  const origin = getAppOrigin(req);
  const safeSuccess = isSafeRedirectUrl(successUrl, origin)
    ? successUrl
    : `${origin}/settings?tab=plans&success=true`;
  const safeCancel = isSafeRedirectUrl(cancelUrl, origin)
    ? cancelUrl
    : `${origin}/settings?tab=plans&canceled=true`;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return json(res, 503, { error: 'Stripe is not configured' });
  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: plan.currency,
        product_data: {
          name: planId === 'premium_lifetime' ? 'Premium Plan (Lifetime)' : 'Premium Plan (Monthly)',
          description: 'Unlock unlimited features and advanced financial insights',
        },
        unit_amount: plan.price,
        ...(plan.interval !== 'one-time' && { recurring: { interval: plan.interval } }),
      },
      quantity: 1,
    }],
    mode: plan.interval === 'one-time' ? 'payment' : 'subscription',
    success_url: safeSuccess,
    cancel_url: safeCancel,
    customer_email: auth.user.email || customerEmail,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    metadata: { planId, userId: auth.user.id, customerEmail: auth.user.email || customerEmail || '' },
  });
  json(res, 200, { sessionId: session.id });
}

// --- Paddle ---
function verifyPaddleSignature(secret, rawBody, signatureHeader) {
  if (!secret || !signatureHeader || !rawBody) return false;
  const m = signatureHeader.match(/ts=(\d+);h1=([a-f0-9]+)/);
  if (!m) return false;
  const payload = `${m[1]}:${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    const a = Buffer.from(m[2], 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const PREMIUM_STATUSES = new Set(['active', 'trialing']);

function toIso(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function extractUserId(data = {}) {
  return (
    data?.custom_data?.user_id ||
    data?.custom_data?.userId ||
    data?.customer?.custom_data?.user_id ||
    data?.customer?.custom_data?.userId ||
    null
  );
}

function normalizeBillingCycle(data = {}) {
  const raw = data?.custom_data?.billing_cycle || data?.billing_cycle || '';
  if (raw === 'one-time' || raw === 'lifetime') return 'lifetime';
  return 'monthly';
}

function buildSubscriptionPayload(data = {}, statusOverride = null) {
  const status = (statusOverride || data?.status || 'active').toLowerCase();
  const billingCycle = normalizeBillingCycle(data);
  const isMonthly = billingCycle === 'monthly';
  const periodStart = toIso(data?.current_billing_period?.starts_at || data?.started_at || data?.billing_period?.starts_at);
  const periodEnd = toIso(data?.current_billing_period?.ends_at || data?.next_billed_at || data?.trial_dates?.ends_at || data?.billing_period?.ends_at);
  const plan = PREMIUM_STATUSES.has(status) ? 'premium' : 'free';

  return {
    plan,
    status,
    billing_cycle: billingCycle,
    paddle_transaction_id: data?.id || null,
    paddle_subscription_id: data?.subscription_id || data?.id || null,
    trial_started_at: status === 'trialing' ? periodStart : null,
    trial_ends_at: status === 'trialing' ? periodEnd : null,
    current_billing_period_start: periodStart,
    current_billing_period_end: periodEnd,
    next_billing_date: periodEnd,
    expires_at: isMonthly ? periodEnd : null,
    updated_at: new Date().toISOString(),
  };
}

async function updateSubscriptionByUser(userId, subscription) {
  if (!userId) return;
  const { error } = await supabase
    .from('profiles')
    .update({ subscription })
    .eq('id', userId);
  if (error) throw error;
}

async function updateSubscriptionByPaddleId(paddleSubscriptionId, subscription) {
  if (!paddleSubscriptionId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .filter('subscription->>paddle_subscription_id', 'eq', paddleSubscriptionId)
    .limit(1)
    .maybeSingle();
  if (error || !data?.id) return null;
  await updateSubscriptionByUser(data.id, subscription);
  return data.id;
}

function extractPaidAmount(data = {}) {
  const total = data?.details?.totals?.total || data?.totals?.total || data?.amount;
  const numeric = typeof total === 'string' ? Number.parseFloat(total) : Number(total || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function extractCurrency(data = {}) {
  return data?.details?.totals?.currency_code || data?.totals?.currency_code || data?.currency_code || 'USD';
}

function extractPeriodWindow(data = {}, fallback = {}) {
  const start = toIso(
    data?.billing_period?.starts_at ||
    data?.current_billing_period?.starts_at ||
    fallback?.trial_started_at
  );
  const end = toIso(
    data?.billing_period?.ends_at ||
    data?.current_billing_period?.ends_at ||
    data?.next_billed_at ||
    fallback?.next_billing_date ||
    fallback?.trial_ends_at
  );
  return { start, end };
}

async function insertSubscriptionHistory(userId, subscription, paymentMethod = 'paddle', amount = 0, currency = 'USD') {
  if (!userId) return;
  if (paymentMethod.startsWith('paddle:')) {
    const { data: existing, error: existingError } = await supabase
      .from('subscription_history')
      .select('id')
      .eq('user_id', userId)
      .eq('payment_method', paymentMethod)
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.id) return;
  }
  const { error } = await supabase.from('subscription_history').insert({
    user_id: userId,
    plan_name: subscription.plan,
    status: PREMIUM_STATUSES.has(subscription.status) ? 'active' : 'cancelled',
    start_date: subscription.trial_started_at || new Date().toISOString(),
    end_date: subscription.trial_ends_at || subscription.expires_at || null,
    amount_paid: amount,
    currency,
    payment_method: paymentMethod,
  });
  if (error) throw error;
}

async function handlePaddleEvent(eventType, data) {
  const event = (eventType || '').toLowerCase();
  const isSubscriptionEvent = event.startsWith('subscription.');
  const isTransactionEvent = event === 'transaction.completed';
  if (!isSubscriptionEvent && !isTransactionEvent) return;

  const userId = extractUserId(data);
  const statusOverride = isTransactionEvent ? 'active' : null;
  const subscription = buildSubscriptionPayload(data, statusOverride);
  const paddleSubId = subscription.paddle_subscription_id;
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    resolvedUserId = await updateSubscriptionByPaddleId(paddleSubId, subscription);
  } else {
    await updateSubscriptionByUser(resolvedUserId, subscription);
  }

  if (isTransactionEvent && resolvedUserId) {
    const { start, end } = extractPeriodWindow(data, subscription);
    const amount = extractPaidAmount(data);
    const currency = extractCurrency(data);
    const historySnapshot = {
      ...subscription,
      status: 'active',
      trial_started_at: start,
      trial_ends_at: end,
      expires_at: end,
    };
    const txnRef = data?.id ? `paddle:${data.id}` : 'paddle';
    await insertSubscriptionHistory(resolvedUserId, historySnapshot, txnRef, amount, currency);
  }
}

async function handlePaddleWebhook(req, res, rawBody) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[payments] PADDLE_WEBHOOK_SECRET is not configured');
    return json(res, 503, { error: 'Webhook not configured' });
  }
  const sig = req.headers['paddle-signature'];
  if (!rawBody || !verifyPaddleSignature(secret, rawBody, sig)) {
    return json(res, 401, { error: 'Unauthorized' });
  }
  if (!supabase) return json(res, 503, { error: 'Server configuration error' });
  const event = rawBody ? JSON.parse(rawBody) : {};
  await handlePaddleEvent(event.event_type, event.data);
  json(res, 200, { received: true });
}

function normalizePaddleSubscriptionDetails(data = {}) {
  const periodStart = toIso(data?.current_billing_period?.starts_at || data?.started_at);
  const periodEnd = toIso(data?.current_billing_period?.ends_at || data?.next_billed_at);
  return {
    id: data?.id || null,
    status: data?.status || null,
    trial_started_at: data?.status === 'trialing' ? periodStart : null,
    trial_ends_at: data?.status === 'trialing' ? periodEnd : null,
    current_billing_period_start: periodStart,
    current_billing_period_end: periodEnd,
    next_billing_date: periodEnd,
    customer_email: data?.customer?.email || null,
    customer_country: data?.customer?.address?.country_code || null,
    payment_method_brand: data?.collection_mode === 'manual' ? 'manual' : (data?.billing_details?.payment_method?.type || null),
    payment_method_last4: data?.billing_details?.payment_method?.card?.last4 || null,
  };
}

async function handleGetPaddleSubscriptionDetails(req, res, body) {
  const subscriptionId = body?.subscriptionId;
  const claimedUserId = body?.userId;
  if (!subscriptionId) return json(res, 400, { error: 'Missing subscriptionId' });

  const auth = await requireAuthUserMatchingId(req, claimedUserId);
  if (!auth.user) return json(res, auth.status || 401, { error: auth.error || 'Unauthorized' });
  const userId = auth.user.id;

  const apiKey = paddleApiKey();
  if (!apiKey) return json(res, 503, { error: 'Paddle API key not configured' });

  const apiRes = await fetch(`https://api.paddle.com/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  const payload = await apiRes.json();
  if (!apiRes.ok) {
    const msg = payload?.error?.detail || payload?.error?.message || payload?.error || 'Failed to fetch Paddle subscription';
    throw new Error(msg);
  }
  const details = normalizePaddleSubscriptionDetails(payload?.data || {});
  if (supabase) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('subscription')
      .eq('id', userId)
      .maybeSingle();
    const ownedSubId = profileData?.subscription?.paddle_subscription_id;
    if (ownedSubId && ownedSubId !== subscriptionId) {
      return json(res, 403, { error: 'Subscription does not belong to this user' });
    }
    const merged = { ...(profileData?.subscription || {}), ...details };
    await updateSubscriptionByUser(userId, merged);
  }
  json(res, 200, { details });
}

async function handleScheduleDowngrade(req, res, body) {
  const claimedUserId = body?.userId;
  const auth = await requireAuthUserMatchingId(req, claimedUserId);
  if (!auth.user) return json(res, auth.status || 401, { error: auth.error || 'Unauthorized' });
  const userId = auth.user.id;
  if (!supabase) return json(res, 503, { error: 'Server configuration error' });

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('subscription')
    .eq('id', userId)
    .maybeSingle();
  if (profileError || !profileData?.subscription) return json(res, 404, { error: 'Profile not found' });

  const current = profileData.subscription || {};
  const paddleSubscriptionId = current?.paddle_subscription_id;
  if (!paddleSubscriptionId) return json(res, 400, { error: 'No Paddle subscription ID on profile' });

  const apiKey = paddleApiKey();
  if (!apiKey) return json(res, 503, { error: 'Paddle API key not configured' });

  const cancelRes = await fetch(`https://api.paddle.com/subscriptions/${encodeURIComponent(paddleSubscriptionId)}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ effective_from: 'next_billing_period' }),
  });
  const cancelPayload = await cancelRes.json();
  if (!cancelRes.ok) {
    const msg = cancelPayload?.error?.detail || cancelPayload?.error?.message || cancelPayload?.error || 'Failed to schedule Paddle cancellation';
    throw new Error(msg);
  }

  const effectiveDate = current?.current_billing_period_end || current?.next_billing_date || null;
  const nextSubscription = {
    ...current,
    plan: 'premium',
    status: 'active',
    scheduled_downgrade_at: effectiveDate,
    downgrade_requested_at: new Date().toISOString(),
    downgrade_plan: 'free',
    updated_at: new Date().toISOString(),
  };
  await updateSubscriptionByUser(userId, nextSubscription);
  await insertSubscriptionHistory(
    userId,
    {
      ...nextSubscription,
      trial_started_at: current?.current_billing_period_start || null,
      trial_ends_at: effectiveDate,
      expires_at: effectiveDate,
    },
    'downgrade_scheduled',
    0,
    'USD'
  );

  json(res, 200, {
    status: 'scheduled',
    effective_date: effectiveDate,
  });
}

// --- Router ---
export default async function handler(req, res) {
  if (!applyCors(req, res, { methods: 'POST, OPTIONS', headers: 'Content-Type, Authorization, Paddle-Signature' })) {
    return;
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const path = parsePath(req);
  const rawBody = await readRawBody(req);
  const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};

  const run = async (fn) => {
    try {
      await fn();
    } catch (e) {
      console.error('[payments-api] request failed', e);
      const message =
        (typeof e?.message === 'string' && e.message.trim()) ||
        (typeof e === 'string' && e.trim()) ||
        'Request failed';
      json(res, 500, { error: message });
    }
  };

  switch (path) {
    case PATH.capturePayPal: return run(() => handleCapturePayPal(req, res, body));
    case PATH.createPayPal: return run(() => handleCreatePayPalOrder(req, res, body));
    case PATH.stripeCheckout: return run(() => handleCreateCheckoutSession(req, res, body));
    case PATH.paddle: return run(() => handlePaddleWebhook(req, res, rawBody));
    case PATH.paddleSubscriptionDetails: return run(() => handleGetPaddleSubscriptionDetails(req, res, body));
    case PATH.scheduleDowngrade: return run(() => handleScheduleDowngrade(req, res, body));
    default: return json(res, 404, { error: 'Unknown payment path' });
  }
}

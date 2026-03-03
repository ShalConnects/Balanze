/**
 * Combined payment API: PayPal (create/capture), Stripe checkout, Paddle webhook.
 * Route by query param: ?path=capture-paypal-order|create-paypal-order|create-checkout-session|paddle-webhook
 */
import crypto from 'crypto';
import Stripe from 'stripe';
import { supabase } from '../lib/supabaseServer.js';

export const config = { api: { bodyParser: false } };

const PATH = {
  capturePayPal: 'capture-paypal-order',
  createPayPal: 'create-paypal-order',
  stripeCheckout: 'create-checkout-session',
  paddle: 'paddle-webhook',
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

// --- PayPal (DRY: shared auth) ---
// Use server env vars (PAYPAL_*) - VITE_* not available in Vercel serverless
async function paypalAuth() {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET;
  const env = process.env.PAYPAL_ENVIRONMENT || process.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox';
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

async function handleCapturePayPal(res, body) {
  const { orderId, planId } = body;
  const { token, baseUrl } = await paypalAuth();
  const cap = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await cap.json();
  if (data.error) throw new Error(data.error.message || 'Failed to capture');
  if (data.status !== 'COMPLETED') throw new Error('Payment was not completed');
  const u = data.purchase_units[0].payments.captures[0];
  json(res, 200, { success: true, transactionId: u.id, amount: u.amount.value, currency: u.amount.currency_code, planId });
}

async function handleCreatePayPalOrder(req, res, body) {
  const { planId, amount, currency, description } = body;
  const { token, baseUrl } = await paypalAuth();
  const origin = req.headers.origin || '';
  const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount.toString() }, description, custom_id: planId }],
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

async function handleCreateCheckoutSession(res, body) {
  const { planId, customerEmail, successUrl, cancelUrl } = body;
  const plan = STRIPE_PRICING[planId];
  if (!plan) return json(res, 400, { error: 'Invalid plan ID' });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY);
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
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    metadata: { planId, customerEmail },
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
  return crypto.timingSafeEqual(Buffer.from(m[2], 'hex'), Buffer.from(expected, 'hex'));
}

async function handlePaddleTransactionCompleted(data) {
  const custom = data?.custom_data;
  if (!custom?.user_id) return;
  const sub = custom.billing_cycle === 'monthly'
    ? { plan: 'premium', status: 'active', billing_cycle: 'monthly', paddle_transaction_id: data.id, paddle_subscription_id: data.subscription_id || null, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() }
    : { plan: 'premium', status: 'active', billing_cycle: 'lifetime', paddle_transaction_id: data.id, paddle_subscription_id: data.subscription_id || null, expires_at: null, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('profiles').update({ subscription: sub }).eq('id', custom.user_id);
  if (error) throw error;
}

async function handlePaddleWebhook(req, res, rawBody) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers['paddle-signature'];
    if (!rawBody || !verifyPaddleSignature(secret, rawBody, sig)) return json(res, 401, { error: 'Unauthorized' });
  }
  if (!supabase) return json(res, 503, { error: 'Server configuration error' });
  const event = rawBody ? JSON.parse(rawBody) : {};
  if (event.event_type === 'transaction.completed') await handlePaddleTransactionCompleted(event.data);
  json(res, 200, { received: true });
}

// --- Router ---
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const path = parsePath(req);
  const rawBody = await readRawBody(req);
  const body = rawBody ? (() => { try { return JSON.parse(rawBody); } catch { return {}; } })() : {};

  const run = async (fn) => {
    try { await fn(); } catch (e) { json(res, 500, { error: e.message || 'Request failed' }); }
  };

  switch (path) {
    case PATH.capturePayPal: return run(() => handleCapturePayPal(res, body));
    case PATH.createPayPal: return run(() => handleCreatePayPalOrder(req, res, body));
    case PATH.stripeCheckout: return run(() => handleCreateCheckoutSession(res, body));
    case PATH.paddle: return run(() => handlePaddleWebhook(req, res, rawBody));
    default: return json(res, 404, { error: 'Unknown payment path' });
  }
}

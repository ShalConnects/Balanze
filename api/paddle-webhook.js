// Paddle Webhook Handler – verifies signature when PADDLE_WEBHOOK_SECRET is set.
// For verification to work, expose raw body (e.g. Vercel: config.api.bodyParser = false and parse after verify).

import crypto from 'crypto';
import { supabase } from '../lib/supabaseServer.js';

function verifyPaddleSignature(secret, rawBody, signatureHeader) {
  if (!secret || !signatureHeader || !rawBody) return false;
  const match = signatureHeader.match(/ts=(\d+);h1=([a-f0-9]+)/);
  if (!match) return false;
  const [, ts, h1] = match;
  const payload = `${ts}:${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(h1, 'hex'), Buffer.from(expected, 'hex'));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const rawBody = req.rawBody ?? (typeof req.body === 'string' ? req.body : null);
  if (secret) {
    const sig = req.headers['paddle-signature'];
    if (!rawBody || !verifyPaddleSignature(secret, rawBody, sig)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  if (!supabase) {
    return res.status(503).json({ error: 'Server configuration error' });
  }
  try {
    const event = rawBody ? JSON.parse(rawBody) : req.body;
    switch (event.event_type) {
      case 'transaction.completed':
        await handleTransactionCompleted(event.data);
        break;
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data);
        break;
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleTransactionCompleted(data) {
  const customData = data?.custom_data;
  if (!customData?.user_id) return;
  const userId = customData.user_id;
  const billingCycle = customData.billing_cycle;
  const subscriptionData = billingCycle === 'monthly'
    ? {
        plan: 'premium',
        status: 'active',
        billing_cycle: 'monthly',
        paddle_transaction_id: data.id,
        paddle_subscription_id: data.subscription_id || null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    : {
        plan: 'premium',
        status: 'active',
        billing_cycle: 'lifetime',
        paddle_transaction_id: data.id,
        paddle_subscription_id: data.subscription_id || null,
        expires_at: null,
        updated_at: new Date().toISOString(),
      };
  const { error } = await supabase
    .from('profiles')
    .update({ subscription: subscriptionData })
    .eq('id', userId);
  if (error) throw error;
}

async function handleSubscriptionCreated(data) {}
async function handleSubscriptionUpdated(data) {}
async function handleSubscriptionCancelled(data) {}

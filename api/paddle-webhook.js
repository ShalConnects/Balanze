// Paddle Webhook Handler
// This handles Paddle payment events and updates your database

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Handle different Paddle events
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
        // Unhandled event type
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleTransactionCompleted(data) {
  try {
    // Extract user information from custom data
    const customData = data.custom_data;
    if (!customData || !customData.user_id) {
      return;
    }

    const userId = customData.user_id;
    const planId = customData.plan_id;
    const billingCycle = customData.billing_cycle;

    // Determine subscription details based on plan
    let subscriptionData;
    if (billingCycle === 'monthly') {
      subscriptionData = {
        plan: 'premium',
        status: 'active',
        billing_cycle: 'monthly',
        paddle_transaction_id: data.id,
        paddle_subscription_id: data.subscription_id || null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        updated_at: new Date().toISOString()
      };
    } else {
      // Lifetime subscription
      subscriptionData = {
        plan: 'premium',
        status: 'active',
        billing_cycle: 'lifetime',
        paddle_transaction_id: data.id,
        paddle_subscription_id: data.subscription_id || null,
        expires_at: null, // Lifetime never expires
        updated_at: new Date().toISOString()
      };
    }

    // Update user's subscription in the database
    const { error } = await supabase
      .from('profiles')
      .update({ subscription: subscriptionData })
      .eq('id', userId);

    if (error) {
      throw error;
    }
    
  } catch (error) {
    throw error;
  }
}

async function handleSubscriptionCreated(data) {
  // Handle new subscription creation
}

async function handleSubscriptionUpdated(data) {
  // Handle subscription updates (plan changes, etc.)
}

async function handleSubscriptionCancelled(data) {
  // Handle subscription cancellation
}

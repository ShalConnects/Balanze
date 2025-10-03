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
    console.log('Paddle webhook received:', event.event_type);
    console.log('Event data:', JSON.stringify(event, null, 2));
    
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
        console.log('Unhandled event type:', event.event_type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleTransactionCompleted(data) {
  console.log('Payment completed:', data);
  
  try {
    // Extract user information from custom data
    const customData = data.custom_data;
    if (!customData || !customData.user_id) {
      console.error('No user_id found in custom data');
      return;
    }

    const userId = customData.user_id;
    const planId = customData.plan_id;
    const billingCycle = customData.billing_cycle;
    
    console.log('Upgrading user subscription:', {
      userId,
      planId,
      billingCycle,
      transactionId: data.id
    });

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
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Successfully upgraded user subscription:', userId);
    
  } catch (error) {
    console.error('Error handling transaction completed:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(data) {
  console.log('Subscription created:', data);
  // Handle new subscription creation
}

async function handleSubscriptionUpdated(data) {
  console.log('Subscription updated:', data);
  // Handle subscription updates (plan changes, etc.)
}

async function handleSubscriptionCancelled(data) {
  console.log('Subscription cancelled:', data);
  // Handle subscription cancellation
}

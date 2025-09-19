// Paddle Webhook Handler
// This handles Paddle payment events and updates your database

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    console.log('Paddle webhook received:', event.event_type);
    
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
  
  // Extract user information from custom data
  const customData = data.custom_data;
  if (customData && customData.user_id) {
    // Update user subscription in your database
    // This would typically call your Supabase function
    console.log('Upgrading user subscription for:', customData.user_id);
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

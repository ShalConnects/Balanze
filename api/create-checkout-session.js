// This is a simple example - in production, you'd want to use a proper backend framework
// For now, this shows the structure of what you need to implement

import Stripe from 'stripe';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, customerEmail, successUrl, cancelUrl } = req.body;

    // Define your pricing based on planId
    const pricing = {
      premium_monthly: {
        price: 799, // $7.99 in cents
        currency: 'usd',
        interval: 'month',
      },
      premium_lifetime: {
        price: 9999, // $99.99 in cents
        currency: 'usd',
        interval: 'one-time',
      },
    };

    const plan = pricing[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: planId === 'premium_lifetime' ? 'Premium Plan (Lifetime)' : 'Premium Plan (Monthly)',
              description: 'Unlock unlimited features and advanced financial insights',
            },
            unit_amount: plan.price,
            ...(plan.interval !== 'one-time' && {
              recurring: {
                interval: plan.interval,
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: plan.interval === 'one-time' ? 'payment' : 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        planId,
        customerEmail,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
} 
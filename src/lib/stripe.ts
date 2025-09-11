import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  currency: 'usd',
  paymentMethods: ['card'],
};

// Plan pricing configuration
export const PLAN_PRICING = {
  premium_monthly: {
    priceId: 'price_premium_monthly', // You'll need to create this in Stripe
    amount: 799, // $7.99 in cents
    currency: 'usd',
    interval: 'month',
  },
  premium_lifetime: {
    priceId: 'price_premium_lifetime', // You'll need to create this in Stripe
    amount: 9999, // $99.99 in cents
    currency: 'usd',
    interval: 'one-time',
  },
};

// Create checkout session
export const createCheckoutSession = async (planId: string, customerEmail: string) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        customerEmail,
        successUrl: `${window.location.origin}/settings?tab=plans&success=true`,
        cancelUrl: `${window.location.origin}/settings?tab=plans&canceled=true`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (planId: string, customerEmail: string) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const sessionId = await createCheckoutSession(planId, customerEmail);
    
    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}; 
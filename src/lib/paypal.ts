// PayPal Integration for Bangladesh
// PayPal supports Bangladesh and is widely trusted

import { supabase } from './supabase';

// PayPal types
declare global {
  interface Window {
    paypal: any;
  }
}

// PayPal configuration
export const PAYPAL_CONFIG = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: 'USD',
  environment: import.meta.env.VITE_PAYPAL_ENVIRONMENT || 'sandbox', // 'sandbox' or 'live'
};

// Plan pricing configuration (display / client hints only — server enforces amounts)
export const PLAN_PRICING: Record<string, {
  amount: number;
  currency: string;
  interval: string;
  description: string;
}> = {
  premium_monthly: {
    amount: 7.99,
    currency: 'USD',
    interval: 'month',
    description: 'Balanze Premium - Monthly Plan',
  },
  premium_lifetime: {
    amount: 199.99,
    currency: 'USD',
    interval: 'one-time',
    description: 'Balanze Premium - Lifetime Access',
  },
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

// Initialize PayPal
export const initializePayPal = () => {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.clientId}&currency=${PAYPAL_CONFIG.currency}`;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error('PayPal failed to load'));
    document.head.appendChild(script);
  });
};

// Create PayPal order (amount is determined server-side from planId)
export const createPayPalOrder = async (planId: string) => {
  try {
    const plan = PLAN_PRICING[planId];
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    const response = await fetch('/api/create-paypal-order', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create PayPal order');
    }

    const { orderId } = await response.json();
    return orderId;
  } catch (error) {

    throw error;
  }
};

// Handle PayPal approval
export const handlePayPalApproval = async (orderId: string, planId: string) => {
  try {
    const response = await fetch('/api/capture-paypal-order', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        orderId,
        planId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to capture PayPal order');
    }

    const result = await response.json();
    return result;
  } catch (error) {

    throw error;
  }
};

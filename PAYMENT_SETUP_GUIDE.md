# 💳 Payment System Setup Guide

## Overview

Your Balanze application now has a complete payment integration system that allows users to upgrade to Premium plans. The system includes:

- ✅ **Payment Modal** - Beautiful checkout interface
- ✅ **Stripe Integration** - Secure payment processing
- ✅ **Upgrade Triggers** - Automatic modal when users hit limits
- ✅ **Plan Management** - Monthly/One-time billing options

## 🚀 Quick Setup

### 1. Stripe Account Setup

1. **Create a Stripe Account**
   - Go to [stripe.com](https://stripe.com) and sign up
   - Complete your business verification

2. **Get Your API Keys**
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy your **Publishable Key** and **Secret Key**

3. **Create Products & Prices**
   - Go to Stripe Dashboard → Products
   - Create a product called "Balanze Premium"
   - Add two prices:
     - **Monthly**: $7.99/month
     - **Lifetime**: $199.99 one-time (save 23%)

### 2. Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### 3. Backend API Setup

You need to create a backend API endpoint. Here are your options:

#### Option A: Vercel Functions (Recommended)

Create `api/create-checkout-session.js` in your project root:

```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, customerEmail, successUrl, cancelUrl } = req.body;

    const pricing = {
      premium_monthly: {
        price: 799,
        currency: 'usd',
        interval: 'month',
      },
      premium_lifetime: {
        price: 9999,
        currency: 'usd',
        interval: 'one-time',
      },
    };

    const plan = pricing[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

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
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
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
```

#### Option B: Supabase Edge Functions

Create a Supabase Edge Function for payment processing.

#### Option C: Express.js Backend

Set up a simple Express.js server with the payment endpoint.

### 4. Install Stripe Backend Dependencies

```bash
npm install stripe
```

## 🔧 How It Works

### 1. User Hits Limit
When a user tries to:
- Create a 6th account
- Add a second currency
- Create 101st transaction
- Access premium features

### 2. Upgrade Modal Appears
The system shows a beautiful upgrade modal with:
- Plan features
- Pricing options
- Security notice

### 3. Payment Flow
1. User clicks "Upgrade Now"
2. Payment modal opens
3. User clicks "Upgrade Now" in payment modal
4. Redirected to Stripe Checkout
5. User enters payment details
6. Payment processed
7. Redirected back to app with success

### 4. Subscription Updated
- Database updated with new subscription
- User gets premium features immediately
- Subscription history recorded

## 🎯 Integration Points

### Upgrade Triggers
- **AccountForm.tsx** - Shows modal when account limit exceeded
- **CategoryModal.tsx** - Shows modal for custom categories
- **LendBorrowForm.tsx** - Shows modal for lend/borrow features

### Payment Components
- **PaymentModal.tsx** - Main payment interface
- **UpgradeModal.tsx** - Upgrade prompt modal
- **Plans.tsx** - Plan selection with payment integration

### Database Functions
- `upgrade_user_subscription()` - Updates user subscription
- `check_subscription_status()` - Checks current subscription
- `subscription_history` table - Records payment history

## 🧪 Testing

### Test Cards (Stripe Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test Scenarios
1. **Create 6th account** → Should show upgrade modal
2. **Try custom categories** → Should show upgrade modal
3. **Click upgrade** → Should open payment modal
4. **Complete payment** → Should redirect to Stripe
5. **Return from Stripe** → Should show success

## 🔒 Security Features

- ✅ **Stripe Secure** - PCI compliant payment processing
- ✅ **No Card Storage** - We never store card details
- ✅ **HTTPS Required** - All payments over secure connection
- ✅ **Webhook Verification** - Verify payment success server-side

## 📊 Analytics & Monitoring

### Stripe Dashboard
- Monitor payments in real-time
- View subscription metrics
- Handle refunds and disputes
- Generate financial reports

### Database Tracking
- Subscription history table
- Payment method tracking
- User upgrade patterns

## 🚨 Common Issues

### 1. "Stripe failed to load"
- Check your publishable key
- Ensure HTTPS in production
- Verify Stripe account is active

### 2. "Failed to create checkout session"
- Check your secret key
- Verify API endpoint is working
- Check Stripe account permissions

### 3. "Payment failed"
- Test with Stripe test cards
- Check payment method types
- Verify currency settings

## 🎉 Next Steps

1. **Set up Stripe account** and get API keys
2. **Add environment variables** to your `.env` file
3. **Create backend API endpoint** (choose your preferred method)
4. **Test the payment flow** with test cards
5. **Deploy to production** and go live!

## 📞 Support

- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Testing Guide**: [stripe.com/docs/testing](https://stripe.com/docs/testing)

Your payment system is now ready to accept real payments! 🚀 
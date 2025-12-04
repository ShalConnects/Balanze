# 🚀 Paddle.js v2 Integration Setup Guide

## 🎯 Overview

This guide will help you set up the modern Paddle.js v2 integration using the official `@paddle/paddle-js` package. This is the recommended approach for 2024.

## 🔧 Step 1: Get Your Paddle Client Token

### 1.1 Access Your Paddle Dashboard
1. Go to [Paddle Dashboard](https://vendors.paddle.com/)
2. Log in to your approved Paddle account
3. Navigate to **Developer Tools** → **Authentication**

### 1.2 Get Your Client Token
1. In the Authentication section, you'll see **Client-side tokens**
2. Click **"New client-side token"**
3. Give it a name (e.g., "FinTrack Frontend")
4. Copy the token (starts with `test_` for sandbox or `live_` for production)

## 🔧 Step 2: Update Your Environment Variables

Add the client token to your `.env.local` file:

```env
# Paddle Configuration
VITE_PADDLE_VENDOR_ID=252028
VITE_PADDLE_ENVIRONMENT=sandbox
VITE_PADDLE_CLIENT_TOKEN=test_your_client_token_here
VITE_PADDLE_MONTHLY_PRICE_ID=pri_01k5djthwx3pm2h85xpe97k5xv
VITE_PADDLE_LIFETIME_PRICE_ID=pri_01k5djwbqzbt2p34r9zp0t6zm2
```

**Replace `test_your_client_token_here` with your actual client token.**

## 🔧 Step 3: Test the Modern Integration

### 3.1 Restart Your Development Server
```bash
npm run dev
```

### 3.2 Test the Payment Flow
1. Go to `http://localhost:5173/settings?tab=plans-usage`
2. Expand the "Available Plans" section
3. Click "Get Started" on Premium plan
4. Click "Pay with Paddle"

## 🎯 What Should Happen

With the modern Paddle.js v2 integration:

1. **✅ Paddle loads correctly** - No more "Failed to initialize" errors
2. **✅ Checkout opens in overlay** - Beautiful modal overlay
3. **✅ Proper event handling** - Events like `checkout.completed` work correctly
4. **✅ Better error handling** - Clear error messages and recovery

## 🔍 Key Differences from Old Integration

### Old Paddle.js (What we had before):
```javascript
// Old way - problematic
window.Paddle.Setup({
  vendor: 252028,
  environment: 'sandbox'
});
```

### New Paddle.js v2 (What we have now):
```javascript
// New way - modern and reliable
import { initializePaddle } from '@paddle/paddle-js';

const paddle = await initializePaddle({
  environment: 'sandbox',
  token: 'test_your_client_token'
});
```

## 🧪 Testing with Sandbox

### Test Cards for Sandbox:
- **Success:** `4000 0000 0000 0002`
- **Decline:** `4000 0000 0000 0003`
- **CVV:** Any 3 digits
- **Expiry:** Any future date

### Test Scenarios:
1. **Monthly Subscription** - Test recurring billing
2. **Lifetime Purchase** - Test one-time payment
3. **Payment Success** - Verify subscription activation
4. **Payment Failure** - Test error handling

## 🔧 Step 4: Webhook Setup (Optional)

### 4.1 Create Webhook Endpoint
Create `api/paddle-webhook.js` in your project root:

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    switch (event.event_type) {
      case 'transaction.completed':
        // Handle successful payment
        console.log('Payment completed:', event.data);
        break;
      case 'subscription.created':
        // Handle new subscription
        console.log('Subscription created:', event.data);
        break;
      case 'subscription.updated':
        // Handle subscription changes
        console.log('Subscription updated:', event.data);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
```

### 4.2 Configure Webhook in Paddle
1. Go to **Developer Tools** → **Notifications**
2. Add webhook URL: `https://your-domain.com/api/paddle-webhook`
3. Select events: `transaction.completed`, `subscription.created`, `subscription.updated`

## 🎉 Benefits of Paddle.js v2

### ✅ **Reliability**
- Official TypeScript support
- Better error handling
- Modern async/await patterns

### ✅ **Performance**
- Smaller bundle size
- Faster initialization
- Better caching

### ✅ **Developer Experience**
- TypeScript types included
- Better documentation
- Modern JavaScript features

### ✅ **Security**
- Proper token-based authentication
- Better event handling
- Secure webhook verification

## 🚨 Troubleshooting

### Common Issues:

1. **"Paddle client token not configured"**
   - Make sure you've added `VITE_PADDLE_CLIENT_TOKEN` to your `.env.local`
   - Restart your dev server after adding the token

2. **"Failed to initialize Paddle"**
   - Check if your client token is correct
   - Verify you're using the right environment (sandbox/live)

3. **Checkout doesn't open**
   - Check browser console for errors
   - Verify your Price IDs are correct
   - Make sure products are active in Paddle dashboard

### Debug Steps:
1. **Check environment variables** in browser console
2. **Verify client token** format (starts with `test_` or `live_`)
3. **Test in sandbox** before going live
4. **Check Paddle dashboard** for product status

## 🎯 Production Setup

### Switch to Live Environment:
1. **Update environment variables:**
   ```env
   VITE_PADDLE_ENVIRONMENT=live
   VITE_PADDLE_CLIENT_TOKEN=live_your_live_token_here
   ```

2. **Create live products** in Paddle dashboard
3. **Update Price IDs** with live versions
4. **Test with real payment methods**

## 🎉 Success!

Your Paddle.js v2 integration is now:
- ✅ **Modern and reliable**
- ✅ **TypeScript compatible**
- ✅ **Properly configured**
- ✅ **Ready for production**

The payment system should now work smoothly without the previous API errors! 🚀

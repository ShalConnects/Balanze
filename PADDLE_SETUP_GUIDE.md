# 🚀 Paddle.com Payment Integration Setup Guide

## 🎯 Overview

This guide will help you set up Paddle.com payment integration to replace the PayPal system in your FinTrack application. Paddle is excellent for Bangladesh and provides a complete payment solution.

## 🔧 Step 1: Get Your Paddle Credentials

### 1.1 Access Your Paddle Dashboard
1. Go to [Paddle Dashboard](https://vendors.paddle.com/)
2. Log in to your approved Paddle account
3. Navigate to **Developer Tools** → **Authentication**

### 1.2 Get Your Vendor ID
1. In the Authentication section, find your **Vendor ID**
2. Copy this number (it's a numeric ID like `12345`)

### 1.3 Create Products and Prices
1. Go to **Catalog** → **Products**
2. Create two products:
   - **Premium Monthly** - $7.99/month
   - **Premium Lifetime** - $99.99 one-time
3. For each product, create a price and copy the **Price ID** (starts with `pri_`)

## 🔧 Step 2: Environment Variables Setup

### 2.1 Create Your .env File
Create a `.env` file in your project root with these variables:

```env
# Paddle Configuration
VITE_PADDLE_VENDOR_ID=12345
VITE_PADDLE_ENVIRONMENT=sandbox
VITE_PADDLE_MONTHLY_PRICE_ID=pri_01xxxxxxxxxxxxxxxxxxxxx
VITE_PADDLE_LIFETIME_PRICE_ID=pri_01xxxxxxxxxxxxxxxxxxxxx
```

### 2.2 Replace the Values
- Replace `12345` with your actual Vendor ID
- Replace the price IDs with your actual Paddle price IDs
- Use `sandbox` for testing, `live` for production

## 🔧 Step 3: Test the Integration

### 3.1 Start Your Development Server
```bash
npm run dev
```

### 3.2 Test the Payment Flow
1. Go to `http://localhost:5173/settings?tab=plans-usage`
2. Expand the "Available Plans" section
3. Click "Get Started" on the Premium plan
4. You should see the Paddle payment modal

### 3.3 Test Payment
1. Click "Pay with Paddle"
2. Use Paddle's test card numbers:
   - **Success**: `4000 0000 0000 0002`
   - **Decline**: `4000 0000 0000 0003`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date

## 🔧 Step 4: Webhook Setup (Optional but Recommended)

### 4.1 Create Webhook Endpoint
Create `api/paddle-webhook.js` in your project root:

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Handle different Paddle events
    switch (event.event_type) {
      case 'transaction.completed':
        // Handle successful payment
        console.log('Payment completed:', event.data);
        break;
      case 'subscription.created':
        // Handle subscription creation
        console.log('Subscription created:', event.data);
        break;
      case 'subscription.updated':
        // Handle subscription updates
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

## 🔧 Step 5: Database Updates

### 5.1 Update Subscription Function
Update your `upgrade_user_subscription` function to handle Paddle:

```sql
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
    p_user_uuid UUID,
    p_plan_name TEXT,
    p_payment_method TEXT DEFAULT 'paddle',
    p_paddle_transaction_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET subscription = jsonb_build_object(
        'plan', p_plan_name,
        'status', 'active',
        'validUntil', CASE 
            WHEN p_plan_name = 'premium' THEN (NOW() + INTERVAL '1 year')::text
            ELSE NULL
        END,
        'payment_method', p_payment_method,
        'paddle_transaction_id', p_paddle_transaction_id,
        'features', CASE 
            WHEN p_plan_name = 'premium' THEN '{
                "max_accounts": -1,
                "max_transactions": -1,
                "max_currencies": -1,
                "analytics": true,
                "priority_support": true,
                "export_data": true,
                "custom_categories": true,
                "lend_borrow": true,
                "last_wish": true,
                "advanced_charts": true,
                "advanced_reporting": true
            }'::jsonb
            ELSE '{}'::jsonb
        END
    ),
    updated_at = NOW()
    WHERE id = p_user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🎯 Step 6: Production Setup

### 6.1 Switch to Live Environment
1. Update your `.env` file:
   ```env
   VITE_PADDLE_ENVIRONMENT=live
   ```

### 6.2 Update Price IDs
1. Create live products in Paddle dashboard
2. Update the price IDs in your `.env` file

### 6.3 Test Live Payments
1. Use real payment methods for testing
2. Verify webhook delivery
3. Check database updates

## 🚨 Troubleshooting

### Common Issues:

1. **"Failed to load payment system"**
   - Check your Vendor ID is correct
   - Verify environment variables are loaded
   - Check browser console for errors

2. **"Payment system not ready"**
   - Ensure Paddle.js is loading correctly
   - Check network connectivity
   - Verify Paddle script is accessible

3. **Price ID not found**
   - Verify price IDs in Paddle dashboard
   - Check environment variables
   - Ensure prices are active

### Debug Steps:
1. Open browser developer tools
2. Check console for errors
3. Verify environment variables in Network tab
4. Test with Paddle's sandbox environment first

## 🎉 Success!

Once set up correctly, your users will see:
- ✅ Professional Paddle payment modal
- ✅ Secure payment processing
- ✅ Automatic subscription upgrades
- ✅ Real-time payment confirmation
- ✅ Premium features activation

## 📞 Support

If you encounter issues:
1. Check Paddle's [documentation](https://developer.paddle.com/)
2. Use Paddle's [support](https://paddle.com/support/)
3. Test in sandbox environment first
4. Check browser console for detailed errors

Your Paddle integration is now ready to process payments securely! 🚀

# Payment Data Setup Guide

## 🎯 **Setting Up Real Payment Data**

This guide will help you set up real payment data in your FinTrack application so the payment history shows actual transactions instead of mock data.

## 📋 **Prerequisites**

- Supabase project set up
- Database access (Supabase SQL Editor)
- User account created in your app

## 🚀 **Step-by-Step Setup**

### **Step 1: Get Your User ID**

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run this query to get your user ID:

```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
```

4. Copy your user ID from the results

### **Step 2: Set Up Payment Tables and Data**

1. In Supabase SQL Editor, run the `setup_payment_data.sql` script
2. **Important**: Replace all instances of `'your-user-id-here'` with your actual user ID
3. Execute the script

### **Step 3: Verify Setup**

1. Go to your FinTrack app
2. Navigate to Settings → Payment tab
3. You should now see real payment data instead of mock data

## 📊 **What Gets Created**

### **Tables Created:**
- `subscription_plans` - Available subscription plans
- `user_subscriptions` - User subscription records
- `payment_transactions` - Payment transaction history
- `user_payment_methods` - User payment methods

### **Sample Data Included:**
- **4 Subscription Plans**: Free, Premium, Pro, Lifetime
- **Sample Transactions**: Completed, pending, failed, refunded payments
- **Payment Methods**: Credit cards and PayPal
- **Realistic Data**: Proper amounts, dates, and statuses

## 🔧 **Customizing the Data**

### **Add Your Own Transactions:**

```sql
INSERT INTO payment_transactions (
    id,
    user_id,
    plan_id,
    amount,
    currency,
    payment_provider,
    provider_transaction_id,
    status,
    payment_method,
    billing_cycle,
    transaction_type
) VALUES (
    'txn-custom-001',
    'your-user-id-here',
    '550e8400-e29b-41d4-a716-446655440002',
    9.99,
    'USD',
    'stripe',
    'pi_custom_123456',
    'completed',
    '****4242',
    'monthly',
    'payment'
);
```

### **Add More Subscription Plans:**

```sql
INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, features) VALUES
('Enterprise', 'Enterprise plan for large teams', 199.99, 'USD', 'monthly', '{"max_accounts": -1, "max_transactions": -1, "analytics": true, "priority_support": true, "export_data": true, "advanced_charts": true, "custom_categories": true, "team_collaboration": true, "api_access": true, "white_label": true}'::jsonb);
```

## 🎨 **Data Structure**

### **Payment Transaction Fields:**
- `id` - Unique transaction ID
- `user_id` - User who made the payment
- `plan_id` - Subscription plan ID
- `amount` - Payment amount
- `currency` - Currency code (USD, EUR, etc.)
- `payment_provider` - Stripe, PayPal, etc.
- `provider_transaction_id` - External payment ID
- `status` - completed, pending, failed, refunded, cancelled
- `payment_method` - Last 4 digits of card, PayPal, etc.
- `billing_cycle` - monthly, one-time
- `transaction_type` - payment, refund, chargeback
- `metadata` - Additional payment data (JSON)

### **Status Types:**
- `completed` - Payment successful
- `pending` - Payment processing
- `failed` - Payment failed
- `refunded` - Payment refunded
- `cancelled` - Payment cancelled

## 🔍 **Testing the Implementation**

### **Check Data in Supabase:**
1. Go to **Table Editor** in Supabase
2. Check the `payment_transactions` table
3. Verify your user ID appears in the data

### **Test in Application:**
1. Navigate to `/settings?tab=payment-history`
2. Verify transactions appear
3. Test filtering and search
4. Test export functionality

## 🚨 **Troubleshooting**

### **No Data Showing:**
1. Check if your user ID is correct
2. Verify the SQL script ran without errors
3. Check browser console for errors
4. Ensure RLS policies are set up correctly

### **Permission Errors:**
1. Make sure you're logged in as the correct user
2. Check RLS policies in Supabase
3. Verify user authentication

### **Mock Data Still Showing:**
1. Clear browser cache
2. Check if database tables exist
3. Verify the fetch function is working
4. Check network tab for API calls

## 📈 **Advanced Features**

### **Real-time Updates:**
The payment history will automatically update when new transactions are added to the database.

### **Filtering and Search:**
- Search by transaction ID, plan name, or payment method
- Filter by status, date range, or payment provider
- Sort by date, amount, status, or plan

### **Export Functionality:**
- Export payment history as PDF
- Includes all transaction details
- Professional formatting

## 🎉 **Success!**

Once set up, your payment history will show:
- ✅ Real transaction data
- ✅ Proper status indicators
- ✅ Working filters and search
- ✅ PDF export functionality
- ✅ Responsive design
- ✅ Dark mode support

## 📞 **Need Help?**

If you encounter issues:
1. Check the browser console for errors
2. Verify your Supabase setup
3. Ensure all SQL scripts ran successfully
4. Check that your user ID is correct in the data

The payment history feature is now fully functional with real data! 🚀

# 🚀 Premium Upgrade Guide - No Payment Required

This guide shows you how to add premium features to your test/personal account without going through the payment process.

## 🎯 What You'll Get

After upgrading to premium, you'll have access to:

- ✅ **Unlimited accounts** (no 5-account limit)
- ✅ **Unlimited transactions** (no 100-transaction limit)
- ✅ **Multiple currencies** (no 1-currency limit)
- ✅ **Advanced analytics** and charts
- ✅ **Custom categories** for transactions
- ✅ **Lend & borrow tracking**
- ✅ **Last Wish** digital time capsule feature
- ✅ **Advanced reporting** and insights
- ✅ **Data export** functionality
- ✅ **Priority support**

## 🔧 Method 1: Direct SQL Update (Easiest)

### Step 1: Find Your User ID
First, you need to find your user ID. You can do this by:

1. **From your browser console** (while logged into the app):
```javascript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('Your User ID:', user.id);
```

2. **Or check your email in the database**:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

### Step 2: Run the SQL Update
Use the `manual_premium_upgrade.sql` file:

```sql
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
UPDATE profiles 
SET subscription = jsonb_build_object(
    'plan', 'premium',
    'status', 'active',
    'validUntil', (NOW() + INTERVAL '1 year')::text,
    'features', '{
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
),
updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';
```

### Step 3: Verify the Upgrade
```sql
SELECT 
    p.id,
    p.full_name,
    p.subscription->>'plan' as current_plan,
    p.subscription->>'status' as status
FROM profiles p
WHERE p.id = 'YOUR_USER_ID_HERE';
```

## 🔧 Method 2: Using the Admin Function

### Step 1: Make Yourself an Admin
First, make your account an admin:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_ID_HERE';
```

### Step 2: Run the Admin Function Setup
Execute the `create_admin_upgrade_function.sql` file to create the admin functions.

### Step 3: Use the Admin Function
```sql
-- Upgrade by email (easiest)
SELECT admin_upgrade_by_email('your-email@example.com', 12, 'Testing premium features');

-- Or upgrade by user ID
SELECT admin_upgrade_to_premium('YOUR_USER_ID_HERE', 6, 'Short-term testing');
```

## 🔧 Method 3: JavaScript Script (Most Convenient)

### Step 1: Set Up Environment Variables
Create a `.env` file with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Run the Script
```bash
# Install dependencies if needed
npm install @supabase/supabase-js

# Run the upgrade script
node upgrade_to_premium.js your-email@example.com 12
```

The script will:
- Check your current subscription status
- Upgrade you to premium
- Verify the upgrade worked
- Show you all the new features you have access to

## 🔧 Method 4: Using the Existing Upgrade Function

If you want to use the built-in function without payment:

```sql
-- This bypasses payment but still records the upgrade
SELECT upgrade_user_subscription(
    'YOUR_USER_ID_HERE'::uuid,
    'premium',
    'manual_upgrade'
);
```

## 🔍 Verification

After upgrading, you can verify it worked by:

### 1. Check Database
```sql
SELECT 
    p.full_name,
    p.subscription->>'plan' as plan,
    p.subscription->>'status' as status,
    p.subscription->>'validUntil' as valid_until
FROM profiles p
WHERE p.id = 'YOUR_USER_ID_HERE';
```

### 2. Check in the App
- Try creating a 6th account (should work now)
- Try adding a second currency (should work now)
- Try accessing analytics (should be available)
- Try creating custom categories (should work)

### 3. Check Subscription Status
```sql
SELECT check_subscription_status('YOUR_USER_ID_HERE');
```

## 🛡️ Security Notes

- These methods are for **testing and development only**
- In production, always use proper payment flows
- The admin functions include logging for audit trails
- Consider setting up proper admin roles and permissions

## 🔄 Reverting to Free

If you want to revert back to free plan:

```sql
UPDATE profiles 
SET subscription = jsonb_build_object(
    'plan', 'free',
    'status', 'active',
    'validUntil', null,
    'features', '{
        "max_accounts": 5,
        "max_transactions": 100,
        "max_currencies": 1,
        "analytics": false,
        "priority_support": false,
        "export_data": false,
        "custom_categories": false,
        "lend_borrow": false,
        "last_wish": false,
        "advanced_charts": false,
        "advanced_reporting": false
    }'::jsonb
),
updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';
```

## 🎉 Success!

Once upgraded, you'll immediately have access to all premium features without any payment processing. The upgrade will be valid for the duration you specified (default 12 months).

Remember to refresh your browser or log out and back in to see the new features in the UI! 
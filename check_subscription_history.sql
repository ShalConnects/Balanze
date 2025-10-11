-- =====================================================
-- CHECK SUBSCRIPTION HISTORY FOR USER
-- User: shalconnect00@gmail.com
-- UID: a64955e1-c71e-4151-976f-8f0f68681022
-- =====================================================

-- 1. Verify user exists
SELECT 
    '=== USER CHECK ===' as check_type,
    id, 
    email, 
    created_at
FROM auth.users 
WHERE id = 'a64955e1-c71e-4151-976f-8f0f68681022' 
   OR email = 'shalconnect00@gmail.com';

-- 2. Check if subscription_history table exists
SELECT 
    '=== TABLE CHECK ===' as check_type,
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('subscription_history', 'subscription_plans');

-- 3. Check payment history count for this user
SELECT 
    '=== PAYMENT COUNT ===' as check_type,
    COUNT(*) as payment_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ NO PAYMENT HISTORY - Run add_real_payment_history.sql'
        ELSE '✅ Payment history exists'
    END as status
FROM subscription_history 
WHERE user_id = 'a64955e1-c71e-4151-976f-8f0f68681022';

-- 4. Get detailed payment history (if exists)
SELECT 
    '=== PAYMENT DETAILS ===' as check_type,
    id,
    plan_name,
    status,
    amount_paid,
    currency,
    payment_method,
    start_date::date as start_date,
    end_date::date as end_date,
    created_at::date as payment_date
FROM subscription_history 
WHERE user_id = 'a64955e1-c71e-4151-976f-8f0f68681022'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check subscription plans
SELECT 
    '=== AVAILABLE PLANS ===' as check_type,
    name,
    price,
    billing_cycle,
    is_active
FROM subscription_plans
ORDER BY price;

-- 6. Check RLS policies
SELECT 
    '=== RLS POLICIES ===' as check_type,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'subscription_history'
ORDER BY policyname;

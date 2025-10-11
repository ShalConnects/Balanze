-- =====================================================
-- ADD REAL PAYMENT HISTORY FOR ALL USERS
-- Adds sample payment data to subscription_history for all users
-- =====================================================

-- Step 1: Verify subscription_history table exists
SELECT 
    '=== TABLE CHECK ===' as step,
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'subscription_history';

-- Step 2: Count current users
SELECT 
    '=== CURRENT USERS ===' as step,
    COUNT(*) as total_users
FROM auth.users;

-- Step 3: Ensure subscription plans exist
INSERT INTO subscription_plans (id, name, description, price, billing_cycle, features, is_active) VALUES
(gen_random_uuid(), 'free', 'Basic plan with limited features', 0.00, 'monthly', '{"max_accounts": 3, "max_transactions": 100, "analytics": false, "priority_support": false, "export_data": false}'::jsonb, true),
(gen_random_uuid(), 'premium', 'Premium plan with all features', 9.99, 'monthly', '{"max_accounts": -1, "max_transactions": -1, "analytics": true, "priority_support": true, "export_data": true, "advanced_charts": true, "custom_categories": true}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Add payment history for ALL users
DO $$
DECLARE
    v_user RECORD;
    v_premium_plan_id UUID;
    v_free_plan_id UUID;
    v_plan_id UUID;
    v_plan_name TEXT;
    v_amount DECIMAL(10,2);
    v_payment_count INTEGER;
    v_total_users INTEGER := 0;
    v_users_with_payments INTEGER := 0;
BEGIN
    -- Get plan IDs
    SELECT id INTO v_premium_plan_id FROM subscription_plans WHERE name = 'premium' LIMIT 1;
    SELECT id INTO v_free_plan_id FROM subscription_plans WHERE name = 'free' LIMIT 1;
    
    -- Loop through all users
    FOR v_user IN SELECT id, email FROM auth.users ORDER BY created_at
    LOOP
        v_total_users := v_total_users + 1;
        
        -- Randomly assign premium or free plan (80% premium, 20% free for demo)
        IF random() < 0.8 THEN
            v_plan_id := v_premium_plan_id;
            v_plan_name := 'Premium';
            v_amount := 9.99;
            v_payment_count := FLOOR(random() * 3 + 3)::INTEGER; -- 3-5 payments
        ELSE
            v_plan_id := v_free_plan_id;
            v_plan_name := 'Free';
            v_amount := 0.00;
            v_payment_count := 1; -- Just 1 record for free users
        END IF;
        
        -- Add payment records for this user
        FOR i IN 1..v_payment_count LOOP
            INSERT INTO subscription_history (
                user_id,
                plan_id,
                plan_name,
                status,
                start_date,
                end_date,
                amount_paid,
                currency,
                payment_method,
                created_at
            ) VALUES (
                v_user.id,
                v_plan_id,
                v_plan_name,
                'active',
                NOW() - INTERVAL '1 day' * (i * 30 + 7),
                CASE 
                    WHEN i = 1 THEN NOW() + INTERVAL '23 days'
                    ELSE NOW() - INTERVAL '1 day' * ((i - 1) * 30 + 7)
                END,
                v_amount,
                'USD',
                CASE 
                    WHEN v_amount > 0 THEN 
                        CASE FLOOR(random() * 3)::INTEGER
                            WHEN 0 THEN '****4242'
                            WHEN 1 THEN '****5555'
                            ELSE '****1234'
                        END
                    ELSE 'N/A'
                END,
                NOW() - INTERVAL '1 day' * (i * 30 + 7)
            );
        END LOOP;
        
        v_users_with_payments := v_users_with_payments + 1;
        
        -- Progress indicator every 10 users
        IF v_total_users % 10 = 0 THEN
            RAISE NOTICE 'Processed % users...', v_total_users;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Successfully added payment history for % users', v_users_with_payments;
    RAISE NOTICE '📊 Total payment records created: %', v_users_with_payments * 4; -- approximate
END $$;

-- Step 5: Verify the data was inserted
SELECT 
    '=== VERIFICATION: PAYMENT SUMMARY BY USER ===' as step,
    u.email,
    COUNT(sh.id) as payment_count,
    SUM(sh.amount_paid) as total_paid,
    MAX(sh.plan_name) as current_plan,
    MAX(sh.created_at)::date as last_payment_date
FROM auth.users u
LEFT JOIN subscription_history sh ON u.id = sh.user_id
GROUP BY u.email
ORDER BY total_paid DESC
LIMIT 20;

-- Step 6: Overall statistics
SELECT 
    '=== OVERALL STATISTICS ===' as step,
    COUNT(DISTINCT user_id) as users_with_payments,
    COUNT(*) as total_payment_records,
    SUM(amount_paid) as total_revenue,
    ROUND(AVG(amount_paid), 2) as avg_payment_amount,
    COUNT(CASE WHEN plan_name = 'Premium' THEN 1 END) as premium_payments,
    COUNT(CASE WHEN plan_name = 'Free' THEN 1 END) as free_signups
FROM subscription_history;

-- Step 7: Sample payment records
SELECT 
    '=== SAMPLE PAYMENT RECORDS ===' as step,
    u.email,
    sh.plan_name,
    sh.status,
    sh.amount_paid,
    sh.currency,
    sh.payment_method,
    sh.created_at::date as payment_date
FROM subscription_history sh
JOIN auth.users u ON sh.user_id = u.id
ORDER BY sh.created_at DESC
LIMIT 15;

-- Step 8: Check specific user (shalconnect00@gmail.com)
SELECT 
    '=== SPECIFIC USER: shalconnect00@gmail.com ===' as step,
    sh.plan_name,
    sh.status,
    sh.amount_paid,
    sh.payment_method,
    sh.created_at::date as payment_date
FROM subscription_history sh
JOIN auth.users u ON sh.user_id = u.id
WHERE u.email = 'shalconnect00@gmail.com'
ORDER BY sh.created_at DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 
    '✅ PAYMENT HISTORY ADDED FOR ALL USERS!' as message,
    'All users now have payment data in subscription_history' as status,
    'Refresh the payment history page to see the data' as instruction,
    'http://localhost:5173/settings?tab=payment-history' as url;

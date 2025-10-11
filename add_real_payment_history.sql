-- =====================================================
-- ADD REAL PAYMENT HISTORY FOR USER
-- User: shalconnect00@gmail.com
-- UID: a64955e1-c71e-4151-976f-8f0f68681022
-- Uses REAL subscription_history table
-- =====================================================

-- Step 1: Verify user exists
SELECT 
    '=== USER VERIFICATION ===' as step,
    id, 
    email, 
    created_at
FROM auth.users 
WHERE id = 'a64955e1-c71e-4151-976f-8f0f68681022';

-- Step 2: Check existing subscription history
SELECT 
    '=== EXISTING SUBSCRIPTION HISTORY ===' as step,
    COUNT(*) as existing_count
FROM subscription_history 
WHERE user_id = 'a64955e1-c71e-4151-976f-8f0f68681022';

-- Step 3: Ensure subscription plans exist
INSERT INTO subscription_plans (id, name, description, price, billing_cycle, features, is_active) VALUES
(gen_random_uuid(), 'premium', 'Premium plan with all features', 9.99, 'monthly', '{"max_accounts": -1, "max_transactions": -1, "analytics": true, "priority_support": true, "export_data": true, "advanced_charts": true, "custom_categories": true}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Get the premium plan ID
DO $$
DECLARE
    v_plan_id UUID;
    v_user_id UUID := 'a64955e1-c71e-4151-976f-8f0f68681022';
BEGIN
    -- Get premium plan ID
    SELECT id INTO v_plan_id FROM subscription_plans WHERE name = 'premium' LIMIT 1;
    
    -- Insert payment history records
    -- Most recent payment (1 week ago)
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
        v_user_id,
        v_plan_id,
        'Premium',
        'active',
        NOW() - INTERVAL '7 days',
        NOW() + INTERVAL '23 days',
        9.99,
        'USD',
        '****4242',
        NOW() - INTERVAL '7 days'
    );
    
    -- Payment from 1 month ago
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
        v_user_id,
        v_plan_id,
        'Premium',
        'active',
        NOW() - INTERVAL '37 days',
        NOW() - INTERVAL '7 days',
        9.99,
        'USD',
        '****4242',
        NOW() - INTERVAL '37 days'
    );
    
    -- Payment from 2 months ago
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
        v_user_id,
        v_plan_id,
        'Premium',
        'active',
        NOW() - INTERVAL '67 days',
        NOW() - INTERVAL '37 days',
        9.99,
        'USD',
        '****4242',
        NOW() - INTERVAL '67 days'
    );
    
    -- Payment from 3 months ago
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
        v_user_id,
        v_plan_id,
        'Premium',
        'active',
        NOW() - INTERVAL '97 days',
        NOW() - INTERVAL '67 days',
        9.99,
        'USD',
        '****4242',
        NOW() - INTERVAL '97 days'
    );
    
    -- Initial payment from 6 months ago
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
        v_user_id,
        v_plan_id,
        'Premium',
        'active',
        NOW() - INTERVAL '180 days',
        NOW() - INTERVAL '150 days',
        9.99,
        'USD',
        '****4242',
        NOW() - INTERVAL '180 days'
    );
    
    RAISE NOTICE 'Successfully added 5 payment history records';
END $$;

-- Step 5: Verify the data was inserted
SELECT 
    '=== VERIFICATION: NEW PAYMENT HISTORY ===' as step,
    id,
    plan_name,
    status,
    amount_paid,
    currency,
    payment_method,
    start_date::date as start_date,
    created_at::date as payment_date
FROM subscription_history 
WHERE user_id = 'a64955e1-c71e-4151-976f-8f0f68681022'
ORDER BY created_at DESC;

-- Step 6: Count total records
SELECT 
    '=== SUMMARY ===' as step,
    COUNT(*) as total_payments,
    SUM(amount_paid) as total_amount_paid,
    MIN(created_at)::date as first_payment,
    MAX(created_at)::date as last_payment
FROM subscription_history 
WHERE user_id = 'a64955e1-c71e-4151-976f-8f0f68681022';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 
    '✅ PAYMENT HISTORY ADDED SUCCESSFULLY!' as message,
    'Now refresh the payment history page to see REAL data' as instruction,
    'http://localhost:5173/settings?tab=payment-history' as url;

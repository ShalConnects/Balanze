-- MANUAL VERIFICATION SCRIPT FOR USER DELETION
-- Run this in Supabase SQL Editor to check if user data is completely removed

-- Replace 'your-user-id-here' with the actual user ID
DO $$
DECLARE
    user_id_to_check UUID := 'your-user-id-here'; -- CHANGE THIS
    original_email TEXT := 'salauddin.kader405@gmail.com'; -- CHANGE THIS
    record_count INTEGER;
    table_name TEXT;
BEGIN
    RAISE NOTICE '🔍 === VERIFYING USER DELETION ===';
    RAISE NOTICE 'User ID: %', user_id_to_check;
    RAISE NOTICE 'Original Email: %', original_email;
    RAISE NOTICE '';

    -- 1. Check Auth User Status
    RAISE NOTICE '1️⃣ Checking Auth User Status...';
    PERFORM id FROM auth.users WHERE id = user_id_to_check;
    IF FOUND THEN
        RAISE NOTICE '✅ Auth user exists (should be disabled)';
        RAISE NOTICE '   Email: %', (SELECT email FROM auth.users WHERE id = user_id_to_check);
        RAISE NOTICE '   Password: %', CASE WHEN (SELECT encrypted_password FROM auth.users WHERE id = user_id_to_check) = '' THEN 'CLEARED' ELSE 'SET' END;
        RAISE NOTICE '   Metadata: %', (SELECT raw_user_meta_data FROM auth.users WHERE id = user_id_to_check);
    ELSE
        RAISE NOTICE '❌ Auth user not found (completely deleted)';
    END IF;

    -- 2. Check Profile
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ Checking Profile...';
    PERFORM id FROM profiles WHERE id = user_id_to_check;
    IF FOUND THEN
        RAISE NOTICE '❌ Profile still exists';
    ELSE
        RAISE NOTICE '✅ Profile deleted successfully';
    END IF;

    -- 3. Check All Custom Tables
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣ Checking Custom Tables...';
    
    -- List of tables to check
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'accounts',
            'transactions',
            'purchases',
            'purchase_categories',
            'purchase_attachments',
            'lend_borrow',
            'lend_borrow_returns',
            'savings_goals',
            'donation_saving_records',
            'notifications',
            'audit_logs',
            'last_wish_settings',
            'last_wish_deliveries'
        ])
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I WHERE user_id = $1', table_name) 
            INTO record_count 
            USING user_id_to_check;
            
            IF record_count > 0 THEN
                RAISE NOTICE '   ❌ %: % records found', table_name, record_count;
            ELSE
                RAISE NOTICE '   ✅ %: 0 records (clean)', table_name;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '   ⚠️  %: Error checking (%)', table_name, SQLERRM;
        END;
    END LOOP;

    -- 4. Check for Orphaned Data by Email
    RAISE NOTICE '';
    RAISE NOTICE '4️⃣ Checking for Orphaned Data by Email...';
    SELECT COUNT(*) INTO record_count 
    FROM profiles 
    WHERE email ILIKE '%' || split_part(original_email, '@', 1) || '%';
    
    IF record_count > 0 THEN
        RAISE NOTICE '   ⚠️  Found % profiles with similar email pattern', record_count;
    ELSE
        RAISE NOTICE '   ✅ No orphaned data found by email';
    END IF;

    -- 5. Summary
    RAISE NOTICE '';
    RAISE NOTICE '📊 === VERIFICATION COMPLETE ===';
    RAISE NOTICE 'Check the results above to ensure all user data is removed.';
    RAISE NOTICE 'If any ❌ marks appear, the deletion may be incomplete.';

END $$;

-- Alternative: Direct queries for specific checks
-- Uncomment and run these individually if needed:

/*
-- Check auth user details
SELECT 
    id,
    email,
    CASE WHEN encrypted_password = '' THEN 'CLEARED' ELSE 'SET' END as password_status,
    raw_user_meta_data,
    created_at,
    updated_at
FROM auth.users 
WHERE id = 'your-user-id-here';

-- Check if profile exists
SELECT * FROM profiles WHERE id = 'your-user-id-here';

-- Check all tables for user data
SELECT 'accounts' as table_name, COUNT(*) as record_count FROM accounts WHERE user_id = 'your-user-id-here'
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions WHERE user_id = 'your-user-id-here'
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases WHERE user_id = 'your-user-id-here'
UNION ALL
SELECT 'lend_borrow', COUNT(*) FROM lend_borrow WHERE user_id = 'your-user-id-here'
UNION ALL
SELECT 'savings_goals', COUNT(*) FROM savings_goals WHERE user_id = 'your-user-id-here'
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications WHERE user_id = 'your-user-id-here'
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs WHERE user_id = 'your-user-id-here';
*/ 
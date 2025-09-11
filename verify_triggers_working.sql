-- Verify Triggers Are Working
-- Run this to check if the duplicate email prevention is properly set up

-- Step 1: Check if triggers exist
SELECT '=== CHECKING TRIGGERS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%prevent_duplicate_email%'
ORDER BY trigger_name;

-- Step 2: Check if functions exist
SELECT '=== CHECKING FUNCTIONS ===' as info;

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('prevent_duplicate_email_signup', 'check_email_exists')
ORDER BY routine_name;

-- Step 3: Test the email check function
SELECT '=== TESTING EMAIL CHECK ===' as info;

SELECT 
    'shalconnect00@gmail.com' as test_email,
    check_email_exists('shalconnect00@gmail.com') as exists,
    check_email_exists('nonexistent@email.com') as not_exists;

-- Step 4: Show current users with the test email
SELECT '=== CURRENT USERS WITH TEST EMAIL ===' as info;

SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE LOWER(email) = LOWER('shalconnect00@gmail.com')
ORDER BY created_at;

-- Step 5: Test trigger simulation (this won't actually create a user)
SELECT '=== TRIGGER SIMULATION ===' as info;

-- This will show what would happen if we tried to insert a duplicate
DO $$
BEGIN
    -- Try to simulate what the trigger would do
    IF EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE LOWER(email) = LOWER('shalconnect00@gmail.com')
    ) THEN
        RAISE NOTICE 'Trigger would block: Email shalconnect00@gmail.com already exists';
    ELSE
        RAISE NOTICE 'Trigger would allow: Email shalconnect00@gmail.com does not exist';
    END IF;
END $$;

-- Instructions:
-- 1. Run this script to verify everything is set up correctly
-- 2. If triggers exist, try registering with the existing email
-- 3. If registration is still allowed, there might be an issue with Supabase's auth system 
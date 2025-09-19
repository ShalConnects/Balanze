-- =====================================================
-- CREATE TEST ACCOUNT FOR megmukt@gmail.com
-- =====================================================
-- This script creates a fresh test account to simulate a new user experience

-- Step 1: Check if user already exists
SELECT '=== CHECKING EXISTING USER ===' as info;
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'megmukt@gmail.com';

-- Step 2: Delete existing user if found (to create fresh account)
DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Get the user ID if it exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = 'megmukt@gmail.com';
    
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found existing user with ID: %. Deleting to create fresh account...', existing_user_id;
        
        -- Delete in correct order to respect foreign key constraints
        -- 1. Delete transactions first (references accounts)
        DELETE FROM public.transactions WHERE user_id = existing_user_id;
        RAISE NOTICE 'Deleted transactions for user';
        
        -- 2. Delete lend_borrow records (references accounts)
        DELETE FROM public.lend_borrow WHERE user_id = existing_user_id;
        RAISE NOTICE 'Deleted lend_borrow records for user';
        
        -- 3. Delete savings_goals (references accounts) - before deleting accounts
        BEGIN
            DELETE FROM public.savings_goals WHERE user_id = existing_user_id;
            RAISE NOTICE 'Deleted savings_goals for user';
        EXCEPTION
            WHEN undefined_column THEN
                -- If user_id column doesn't exist, delete via account references
                DELETE FROM public.savings_goals 
                WHERE source_account_id IN (
                    SELECT id FROM public.accounts WHERE user_id = existing_user_id
                );
                RAISE NOTICE 'Deleted savings_goals via account references';
        END;
        
        -- 4. Delete accounts (references users)
        DELETE FROM public.accounts WHERE user_id = existing_user_id;
        RAISE NOTICE 'Deleted accounts for user';
        
        -- 5. Delete other user-related data
        DELETE FROM public.purchases WHERE user_id = existing_user_id;
        DELETE FROM public.purchase_categories WHERE user_id = existing_user_id;
        RAISE NOTICE 'Deleted other user data';
        
        -- 6. Delete profile (references users)
        DELETE FROM public.profiles WHERE id = existing_user_id;
        RAISE NOTICE 'Deleted profile for user';
        
        -- 7. Finally delete from auth.users
        DELETE FROM auth.users WHERE id = existing_user_id;
        RAISE NOTICE 'Deleted user from auth.users';
        
        RAISE NOTICE 'Existing user and all related data deleted successfully';
    ELSE
        RAISE NOTICE 'No existing user found. Proceeding with account creation...';
    END IF;
END $$;

-- Step 3: Create new user account in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id
    gen_random_uuid(), -- id (will be captured)
    'authenticated', -- aud
    'authenticated', -- role
    'megmukt@gmail.com', -- email
    crypt('New12###', gen_salt('bf')), -- encrypted_password
    NOW(), -- email_confirmed_at (auto-confirmed for testing)
    NULL, -- invited_at
    '', -- confirmation_token
    NULL, -- confirmation_sent_at
    '', -- recovery_token
    NULL, -- recovery_sent_at
    '', -- email_change_token_new
    '', -- email_change
    NULL, -- email_change_sent_at
    NULL, -- last_sign_in_at
    '{"provider": "email", "providers": ["email"]}', -- raw_app_meta_data
    '{"full_name": "Test User"}'::jsonb, -- raw_user_meta_data
    false, -- is_super_admin
    NOW(), -- created_at
    NOW(), -- updated_at
    NULL, -- phone
    NULL, -- phone_confirmed_at
    '', -- phone_change
    '', -- phone_change_token
    NULL, -- phone_change_sent_at
    '', -- email_change_token_current
    0, -- email_change_confirm_status
    NULL, -- banned_until
    '', -- reauthentication_token
    NULL, -- reauthentication_sent_at
    false, -- is_sso_user
    NULL -- deleted_at
);

-- Step 4: Get the newly created user ID
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Get the user ID we just created
    SELECT id INTO new_user_id 
    FROM auth.users 
    WHERE email = 'megmukt@gmail.com';
    
    RAISE NOTICE 'Created new user with ID: %', new_user_id;
    
    -- Step 5: Create profile for the new user
    INSERT INTO public.profiles (
        id,
        full_name,
        local_currency,
        role,
        subscription,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'Test User',
        'USD',
        'user',
        '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Profile created successfully for user: %', new_user_id;
    
    -- Step 6: Verify the setup
    RAISE NOTICE '=== VERIFICATION ===';
    RAISE NOTICE 'User ID: %', new_user_id;
    RAISE NOTICE 'Email: megmukt@gmail.com';
    RAISE NOTICE 'Password: New12###';
    RAISE NOTICE 'Profile created: Yes';
    RAISE NOTICE 'Subscription: Free plan';
    RAISE NOTICE 'Status: Ready for testing';
    
END $$;

-- Step 7: Final verification queries
SELECT '=== FINAL VERIFICATION ===' as info;

-- Check auth.users
SELECT 
    'AUTH USERS' as table_name,
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'megmukt@gmail.com';

-- Check profiles
SELECT 
    'PROFILES' as table_name,
    id,
    full_name,
    local_currency,
    role,
    subscription,
    created_at
FROM public.profiles 
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'megmukt@gmail.com'
);

-- Check accounts (should be empty for new user)
SELECT 
    'ACCOUNTS' as table_name,
    COUNT(*) as account_count
FROM public.accounts 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'megmukt@gmail.com'
);

-- Check transactions (should be empty for new user)
SELECT 
    'TRANSACTIONS' as table_name,
    COUNT(*) as transaction_count
FROM public.transactions 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'megmukt@gmail.com'
);

SELECT '=== TEST ACCOUNT SETUP COMPLETE ===' as info;
SELECT 'You can now log in with:' as note1;
SELECT 'Email: megmukt@gmail.com' as note2;
SELECT 'Password: New12###' as note3;
SELECT 'This account will show the new user experience with no existing data.' as note4;

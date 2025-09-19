-- =====================================================
-- SIMPLE TEST ACCOUNT CREATION FOR megmukt@gmail.com
-- =====================================================
-- This script creates a test account using Supabase's built-in functions

-- Step 1: Check if user already exists and clean up if needed
SELECT '=== CHECKING EXISTING USER ===' as info;

DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Get the user ID if it exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = 'megmukt@gmail.com';
    
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found existing user with ID: %. Cleaning up...', existing_user_id;
        
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

-- Step 2: Create the user using Supabase's auth.signup equivalent
-- Note: This is a simplified approach. In production, you'd use the Supabase client
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'megmukt@gmail.com',
    crypt('New12###', gen_salt('bf')),
    NOW(), -- Auto-confirm for testing
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test User"}',
    NOW(),
    NOW()
);

-- Step 3: Create profile using the trigger function
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Get the newly created user ID
    SELECT id INTO new_user_id 
    FROM auth.users 
    WHERE email = 'megmukt@gmail.com';
    
    RAISE NOTICE 'Created user with ID: %', new_user_id;
    
    -- Manually create profile (simulating what the trigger would do)
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
    
    RAISE NOTICE 'Profile created successfully';
    
END $$;

-- Step 4: Verify the setup
SELECT '=== VERIFICATION ===' as info;

SELECT 
    'User Account' as type,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'megmukt@gmail.com';

SELECT 
    'Profile' as type,
    id,
    full_name,
    local_currency,
    role,
    subscription
FROM public.profiles 
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'megmukt@gmail.com'
);

-- Step 5: Show login credentials
SELECT '=== LOGIN CREDENTIALS ===' as info;
SELECT 'Email: megmukt@gmail.com' as credential;
SELECT 'Password: New12###' as credential;
SELECT 'Status: Ready for testing' as status;
SELECT 'Experience: New user (no existing data)' as experience;

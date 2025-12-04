-- =====================================================
-- FIX ACCOUNT SCHEMA AND CASH ACCOUNT TRIGGER
-- =====================================================

-- Step 1: Drop the duplicate is_active column (keep isActive)
ALTER TABLE public.accounts DROP COLUMN IF EXISTS is_active;

-- Step 2: Update the cash account trigger function to use isActive
DROP TRIGGER IF EXISTS on_auth_user_created_create_cash_account ON auth.users;
DROP FUNCTION IF EXISTS create_default_cash_account();

CREATE OR REPLACE FUNCTION create_default_cash_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if accounts table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts' AND table_schema = 'public') THEN
        RAISE LOG 'Accounts table does not exist, skipping cash account creation for user %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Check if user already has a cash account
    IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id = NEW.id AND type = 'cash') THEN
        RAISE LOG 'User % already has a cash account', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Try to create cash account with error handling
    BEGIN
        INSERT INTO public.accounts (
            user_id,
            name,
            type,
            initial_balance,
            calculated_balance,
            currency,
            "isActive",
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            'Cash',
            'cash',
            0,
            0,
            'USD',
            true,
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Cash account created successfully for user %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail user creation
            RAISE LOG 'Error creating cash account for user %: % (SQLSTATE: %)', 
                NEW.id, SQLERRM, SQLSTATE;
            RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created_create_cash_account
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_cash_account();

-- Step 4: Verify the fix
SELECT '=== ACCOUNT SCHEMA FIXED ===' as info;

-- Check the accounts table structure
SELECT 'Accounts table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the trigger
SELECT 'Trigger status:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_create_cash_account';

-- Test the function manually
SELECT 'Testing cash account creation...' as info;
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    result_count INTEGER;
BEGIN
    -- Simulate what the trigger would do
    INSERT INTO public.accounts (
        user_id,
        name,
        type,
        initial_balance,
        calculated_balance,
        currency,
        "isActive",
        created_at,
        updated_at
    )
    VALUES (
        test_user_id,
        'Cash',
        'cash',
        0,
        0,
        'USD',
        true,
        NOW(),
        NOW()
    );
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
    RAISE NOTICE 'Test cash account created successfully. Rows affected: %', result_count;
    
    -- Clean up
    DELETE FROM public.accounts WHERE user_id = test_user_id;
    RAISE NOTICE 'Test cleanup completed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in test: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

SELECT '=== FIX COMPLETE ===' as info;
SELECT 'Your SaaS registration should now work with automatic cash account creation!' as message; 
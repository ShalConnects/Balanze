-- =====================================================
-- FIX THE CASH ACCOUNT TRIGGER ISSUE
-- =====================================================

-- Option 1: Disable the problematic trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created_create_cash_account ON auth.users;

-- Option 2: Create a safe version of the cash account function
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
            is_active,
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

-- Recreate the trigger with the safe function
CREATE TRIGGER on_auth_user_created_create_cash_account
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_cash_account();

-- Verify the fix
SELECT '=== CASH ACCOUNT TRIGGER FIXED ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_create_cash_account'; 
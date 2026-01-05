-- Update create_cash_account function to use 'Cash Wallet' instead of 'Cash (currency)'
-- This standardizes the cash account name format across the application

CREATE OR REPLACE FUNCTION create_cash_account(
    p_currency TEXT DEFAULT 'USD',
    p_initial_balance DECIMAL DEFAULT 0.00
)
RETURNS TABLE (
    success BOOLEAN,
    account_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_account_id UUID;
    v_error_message TEXT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'User not authenticated';
        RETURN;
    END IF;
    
    -- Check if user already has a cash account
    IF EXISTS (
        SELECT 1 FROM accounts 
        WHERE user_id = v_user_id 
        AND type = 'cash' 
        AND currency = p_currency
    ) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Cash account already exists for this currency';
        RETURN;
    END IF;
    
    -- Create cash account
    BEGIN
        INSERT INTO accounts (
            user_id,
            name,
            type,
            initial_balance,
            calculated_balance,
            currency,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            'Cash Wallet',
            'cash',
            p_initial_balance,
            p_initial_balance,
            p_currency,
            true,
            NOW(),
            NOW()
        ) RETURNING id INTO v_account_id;
        
        RETURN QUERY SELECT true, v_account_id, NULL;
        
    EXCEPTION WHEN OTHERS THEN
        v_error_message := SQLERRM;
        RETURN QUERY SELECT false, NULL::UUID, v_error_message;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_default_cash_account trigger function to use 'Cash Wallet' instead of 'Cash'
-- This ensures new users automatically get cash accounts with the correct name format
CREATE OR REPLACE FUNCTION public.create_default_cash_account()
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
            updated_at,
            description
        )
        VALUES (
            NEW.id,
            'Cash Wallet',
            'cash',
            0,
            0,
            'USD',
            true,
            NOW(),
            NOW(),
            'Default cash account'
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


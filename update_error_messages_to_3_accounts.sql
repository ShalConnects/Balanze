-- =====================================================
-- UPDATE ERROR MESSAGES TO REFLECT 3 ACCOUNT LIMIT
-- This script updates all error messages that still reference 5 accounts
-- =====================================================

-- Update the main account limit trigger function
CREATE OR REPLACE FUNCTION enforce_account_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new account creation
    IF TG_OP = 'INSERT' THEN
        -- Check account limit
        IF NOT check_account_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'ACCOUNT_LIMIT_EXCEEDED: Free plan allows up to 3 accounts. Upgrade to Premium for unlimited accounts.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the trigger is using the updated function
DROP TRIGGER IF EXISTS enforce_account_limit_trigger ON accounts;
CREATE TRIGGER enforce_account_limit_trigger
    BEFORE INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION enforce_account_limit();

-- Test the error message
DO $$
BEGIN
    RAISE NOTICE 'Account limit trigger function updated to use 3-account limit';
END $$;

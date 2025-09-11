-- =====================================================
-- CREATE ENFORCEMENT TRIGGERS
-- Triggers to automatically enforce plan limits
-- =====================================================

-- Trigger to enforce account limits
CREATE OR REPLACE FUNCTION enforce_account_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new account creation
    IF TG_OP = 'INSERT' THEN
        -- Check account limit
        IF NOT check_account_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'Account limit exceeded. Free plan allows up to 5 accounts. Upgrade to Premium for unlimited accounts.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_account_limit_trigger ON accounts;
CREATE TRIGGER enforce_account_limit_trigger
    BEFORE INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION enforce_account_limit();

-- Trigger to enforce currency limits
CREATE OR REPLACE FUNCTION enforce_currency_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_currencies TEXT[];
    new_currency_exists BOOLEAN;
BEGIN
    -- Check if this is a new account creation
    IF TG_OP = 'INSERT' THEN
        -- Get current currencies for this user
        SELECT ARRAY_AGG(DISTINCT currency) INTO current_currencies
        FROM accounts 
        WHERE user_id = NEW.user_id AND is_active = true;
        
        -- Check if new currency already exists
        new_currency_exists := NEW.currency = ANY(current_currencies);
        
        -- If new currency and limit would be exceeded
        IF NOT new_currency_exists AND NOT check_currency_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'Currency limit exceeded. Free plan allows only 1 currency. Upgrade to Premium for unlimited currencies.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_currency_limit_trigger ON accounts;
CREATE TRIGGER enforce_currency_limit_trigger
    BEFORE INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION enforce_currency_limit();

-- Trigger to enforce transaction limits
CREATE OR REPLACE FUNCTION enforce_transaction_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new transaction creation
    IF TG_OP = 'INSERT' THEN
        -- Check transaction limit
        IF NOT check_transaction_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'Transaction limit exceeded. Free plan allows up to 100 transactions. Upgrade to Premium for unlimited transactions.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_transaction_limit_trigger ON transactions;
CREATE TRIGGER enforce_transaction_limit_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION enforce_transaction_limit();

-- Trigger to enforce custom categories limit (Premium only)
CREATE OR REPLACE FUNCTION enforce_custom_categories_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new category creation
    IF TG_OP = 'INSERT' THEN
        -- Check if user has custom categories feature
        IF NOT has_feature(NEW.user_id, 'custom_categories') THEN
            RAISE EXCEPTION 'Custom categories are a Premium feature. Upgrade to Premium to create custom categories.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (if purchase_categories table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_categories') THEN
        DROP TRIGGER IF EXISTS enforce_custom_categories_limit_trigger ON purchase_categories;
        CREATE TRIGGER enforce_custom_categories_limit_trigger
            BEFORE INSERT ON purchase_categories
            FOR EACH ROW
            EXECUTE FUNCTION enforce_custom_categories_limit();
    END IF;
END $$;

-- Trigger to enforce lend/borrow limit (Premium only)
CREATE OR REPLACE FUNCTION enforce_lend_borrow_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new lend/borrow record creation
    IF TG_OP = 'INSERT' THEN
        -- Check if user has lend/borrow feature
        IF NOT has_feature(NEW.user_id, 'lend_borrow') THEN
            RAISE EXCEPTION 'Lend & Borrow tracking is a Premium feature. Upgrade to Premium to use this feature.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (if lend_borrow table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lend_borrow') THEN
        DROP TRIGGER IF EXISTS enforce_lend_borrow_limit_trigger ON lend_borrow;
        CREATE TRIGGER enforce_lend_borrow_limit_trigger
            BEFORE INSERT ON lend_borrow
            FOR EACH ROW
            EXECUTE FUNCTION enforce_lend_borrow_limit();
    END IF;
END $$;

-- Trigger to enforce Last Wish limit (Premium only)
CREATE OR REPLACE FUNCTION enforce_last_wish_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new Last Wish record creation
    IF TG_OP = 'INSERT' THEN
        -- Check if user has Last Wish feature
        IF NOT has_feature(NEW.user_id, 'last_wish') THEN
            RAISE EXCEPTION 'Last Wish - Digital Time Capsule is a Premium feature. Upgrade to Premium to use this feature.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (if last_wish_settings table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'last_wish_settings') THEN
        DROP TRIGGER IF EXISTS enforce_last_wish_limit_trigger ON last_wish_settings;
        CREATE TRIGGER enforce_last_wish_limit_trigger
            BEFORE INSERT ON last_wish_settings
            FOR EACH ROW
            EXECUTE FUNCTION enforce_last_wish_limit();
    END IF;
END $$;

-- Function to test the enforcement system
CREATE OR REPLACE FUNCTION test_plan_enforcement(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    result := jsonb_build_object(
        'account_limit_ok', check_account_limit(user_uuid),
        'currency_limit_ok', check_currency_limit(user_uuid),
        'transaction_limit_ok', check_transaction_limit(user_uuid),
        'has_custom_categories', has_feature(user_uuid, 'custom_categories'),
        'has_lend_borrow', has_feature(user_uuid, 'lend_borrow'),
        'has_last_wish', has_feature(user_uuid, 'last_wish'),
        'usage_stats', get_user_usage_stats(user_uuid)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- =====================================================
-- UPDATE TRIGGER ERROR MESSAGES
-- Make error messages more specific for frontend handling
-- =====================================================

-- Update account limit trigger
CREATE OR REPLACE FUNCTION enforce_account_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new account creation
    IF TG_OP = 'INSERT' THEN
        -- Check account limit
        IF NOT check_account_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'ACCOUNT_LIMIT_EXCEEDED: Free plan allows up to 5 accounts. Upgrade to Premium for unlimited accounts.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update currency limit trigger
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
            RAISE EXCEPTION 'CURRENCY_LIMIT_EXCEEDED: Free plan allows only 1 currency. Upgrade to Premium for unlimited currencies.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update transaction limit trigger
CREATE OR REPLACE FUNCTION enforce_transaction_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new transaction creation
    IF TG_OP = 'INSERT' THEN
        -- Check transaction limit
        IF NOT check_transaction_limit(NEW.user_id) THEN
            RAISE EXCEPTION 'TRANSACTION_LIMIT_EXCEEDED: Free plan allows up to 100 transactions. Upgrade to Premium for unlimited transactions.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update custom categories limit trigger
CREATE OR REPLACE FUNCTION enforce_custom_categories_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new category creation
    IF TG_OP = 'INSERT' THEN
        -- Check if user has custom categories feature
        IF NOT has_feature(NEW.user_id, 'custom_categories') THEN
            RAISE EXCEPTION 'FEATURE_NOT_AVAILABLE: Custom categories are a Premium feature. Upgrade to Premium to create custom categories.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update lend/borrow limit trigger
CREATE OR REPLACE FUNCTION enforce_lend_borrow_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new lend/borrow record creation
    IF TG_OP = 'INSERT' THEN
        -- Check if user has lend/borrow feature
        IF NOT has_feature(NEW.user_id, 'lend_borrow') THEN
            RAISE EXCEPTION 'FEATURE_NOT_AVAILABLE: Lend & Borrow tracking is a Premium feature. Upgrade to Premium to use this feature.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update Last Wish limit trigger
CREATE OR REPLACE FUNCTION enforce_last_wish_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a new Last Wish record creation
    IF TG_OP = 'INSERT' THEN
        -- Check if user has Last Wish feature
        IF NOT has_feature(NEW.user_id, 'last_wish') THEN
            RAISE EXCEPTION 'FEATURE_NOT_AVAILABLE: Last Wish - Digital Time Capsule is a Premium feature. Upgrade to Premium to use this feature.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 
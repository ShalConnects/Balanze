-- Safe migration to add user_id column to activity_history
-- This preserves all existing data and allows for backfilling later

-- Step 1: Add user_id column as nullable (safe for existing data)
ALTER TABLE activity_history ADD COLUMN user_id TEXT;

-- Step 2: Update all existing INSERT statements in the triggers to include user_id
-- This ensures new activity will have user_id set

-- Update transaction trigger to include user_id
CREATE OR REPLACE FUNCTION log_transaction_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_history (
        activity_type,
        entity_type,
        entity_id,
        description,
        changes,
        user_id
    ) VALUES (
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'TRANSACTION_CREATED'
            WHEN TG_OP = 'UPDATE' THEN 'TRANSACTION_UPDATED'
            WHEN TG_OP = 'DELETE' THEN 'TRANSACTION_DELETED'
        END,
        'transaction',
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'New transaction created'
            WHEN TG_OP = 'UPDATE' THEN 'Transaction updated'
            WHEN TG_OP = 'DELETE' THEN 'Transaction deleted'
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
        END,
        COALESCE(NEW.user_id, OLD.user_id)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update purchase trigger to include user_id
CREATE OR REPLACE FUNCTION log_purchase_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_history (
        activity_type,
        entity_type,
        entity_id,
        description,
        changes,
        user_id
    ) VALUES (
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'PURCHASE_CREATED'
            WHEN TG_OP = 'UPDATE' THEN 'PURCHASE_UPDATED'
            WHEN TG_OP = 'DELETE' THEN 'PURCHASE_DELETED'
        END,
        'purchase',
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'New purchase created'
            WHEN TG_OP = 'UPDATE' THEN 'Purchase updated'
            WHEN TG_OP = 'DELETE' THEN 'Purchase deleted'
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
        END,
        COALESCE(NEW.user_id, OLD.user_id)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update account trigger to include user_id
CREATE OR REPLACE FUNCTION log_account_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_history (
        activity_type,
        entity_type,
        entity_id,
        description,
        changes,
        user_id
    ) VALUES (
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'ACCOUNT_CREATED'
            WHEN TG_OP = 'UPDATE' THEN 'ACCOUNT_UPDATED'
            WHEN TG_OP = 'DELETE' THEN 'ACCOUNT_DELETED'
        END,
        'account',
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'New account created'
            WHEN TG_OP = 'UPDATE' THEN 'Account updated'
            WHEN TG_OP = 'DELETE' THEN 'Account deleted'
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
        END,
        COALESCE(NEW.user_id, OLD.user_id)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create triggers for accounts table (if not already exists)
DROP TRIGGER IF EXISTS log_account_activity_trigger ON accounts;
CREATE TRIGGER log_account_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON accounts
    FOR EACH ROW EXECUTE FUNCTION log_account_activity();

-- Step 4: Create a function to backfill user_id for existing records
-- This can be run later to populate user_id for old records
CREATE OR REPLACE FUNCTION backfill_activity_history_user_id()
RETURNS void AS $$
DECLARE
    record RECORD;
BEGIN
    -- Backfill user_id for transaction records
    FOR record IN 
        SELECT ah.id, t.user_id 
        FROM activity_history ah
        JOIN transactions t ON ah.entity_id = t.id::text
        WHERE ah.entity_type = 'transaction' AND ah.user_id IS NULL
    LOOP
        UPDATE activity_history 
        SET user_id = record.user_id 
        WHERE id = record.id;
    END LOOP;
    
    -- Backfill user_id for purchase records
    FOR record IN 
        SELECT ah.id, p.user_id 
        FROM activity_history ah
        JOIN purchases p ON ah.entity_id = p.id::text
        WHERE ah.entity_type = 'purchase' AND ah.user_id IS NULL
    LOOP
        UPDATE activity_history 
        SET user_id = record.user_id 
        WHERE id = record.id;
    END LOOP;
    
    -- Backfill user_id for account records
    FOR record IN 
        SELECT ah.id, a.user_id 
        FROM activity_history ah
        JOIN accounts a ON ah.entity_id = a.id::text
        WHERE ah.entity_type = 'account' AND ah.user_id IS NULL
    LOOP
        UPDATE activity_history 
        SET user_id = record.user_id 
        WHERE id = record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a function to run the backfill (optional - run when ready)
-- SELECT backfill_activity_history_user_id(); 
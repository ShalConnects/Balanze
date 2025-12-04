-- Create all history tracking tables and functions
-- This will set up complete history tracking for both transactions and purchases

-- Step 1: Create transaction_history table
CREATE TABLE IF NOT EXISTS transaction_history (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(8) NOT NULL,  -- Use VARCHAR(8) to match transactions.transaction_id
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create purchase_updates table
CREATE TABLE IF NOT EXISTS purchase_updates (
    id SERIAL PRIMARY KEY,
    purchase_id UUID NOT NULL,  -- Use UUID to match purchases.id
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create activity_history table for general activity
CREATE TABLE IF NOT EXISTS activity_history (
    id SERIAL PRIMARY KEY,
    activity_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_changed_at ON transaction_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_purchase_updates_purchase_id ON purchase_updates(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_updates_updated_at ON purchase_updates(updated_at);
CREATE INDEX IF NOT EXISTS idx_activity_history_created_at ON activity_history(created_at);

-- Step 5: Create transaction history logging function
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
    has_changes BOOLEAN := FALSE;
BEGIN
    -- Log changes for each field that was modified
    IF OLD.description IS DISTINCT FROM NEW.description THEN
        INSERT INTO transaction_history (
            transaction_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.transaction_id,
            'description',
            COALESCE(OLD.description, ''),
            COALESCE(NEW.description, ''),
            NOW()
        );
        has_changes := TRUE;
    END IF;
    
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
        INSERT INTO transaction_history (
            transaction_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.transaction_id,
            'amount',
            COALESCE(OLD.amount::TEXT, ''),
            COALESCE(NEW.amount::TEXT, ''),
            NOW()
        );
        has_changes := TRUE;
    END IF;
    
    IF OLD.type IS DISTINCT FROM NEW.type THEN
        INSERT INTO transaction_history (
            transaction_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.transaction_id,
            'type',
            COALESCE(OLD.type, ''),
            COALESCE(NEW.type, ''),
            NOW()
        );
        has_changes := TRUE;
    END IF;
    
    IF OLD.date IS DISTINCT FROM NEW.date THEN
        INSERT INTO transaction_history (
            transaction_id,
            field_name,
            old_value,
            new_value,
            changed_at
        ) VALUES (
            NEW.transaction_id,
            'date',
            COALESCE(OLD.date::TEXT, ''),
            COALESCE(NEW.date::TEXT, ''),
            NOW()
        );
        has_changes := TRUE;
    END IF;
    
    -- Log general activity if there were changes
    IF has_changes THEN
        INSERT INTO activity_history (
            activity_type,
            entity_type,
            entity_id,
            description,
            created_at
        ) VALUES (
            'UPDATE',
            'transaction',
            NEW.transaction_id,
            'Transaction updated',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create purchase history logging function
CREATE OR REPLACE FUNCTION log_purchase_changes()
RETURNS TRIGGER AS $$
DECLARE
    has_changes BOOLEAN := FALSE;
BEGIN
    -- Log changes for each field that was modified
    IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
        INSERT INTO purchase_updates (
            purchase_id,
            field_name,
            old_value,
            new_value,
            updated_at
        ) VALUES (
            NEW.id,  -- This is a UUID
            'item_name',
            COALESCE(OLD.item_name, ''),
            COALESCE(NEW.item_name, ''),
            NOW()
        );
        has_changes := TRUE;
    END IF;
    
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO purchase_updates (
            purchase_id,
            field_name,
            old_value,
            new_value,
            updated_at
        ) VALUES (
            NEW.id,
            'price',
            COALESCE(OLD.price::TEXT, ''),
            COALESCE(NEW.price::TEXT, ''),
            NOW()
        );
        has_changes := TRUE;
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
        INSERT INTO purchase_updates (
            purchase_id,
            field_name,
            old_value,
            new_value,
            updated_at
        ) VALUES (
            NEW.id,
            'category',
            COALESCE(OLD.category, ''),
            COALESCE(NEW.category, ''),
            NOW()
        );
        has_changes := TRUE;
    END IF;
    
    -- Log general activity if there were changes
    IF has_changes THEN
        INSERT INTO activity_history (
            activity_type,
            entity_type,
            entity_id,
            description,
            created_at
        ) VALUES (
            'UPDATE',
            'purchase',
            NEW.id::TEXT,
            'Purchase updated',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers
DROP TRIGGER IF EXISTS trigger_log_transaction_changes ON transactions;
CREATE TRIGGER trigger_log_transaction_changes
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_changes();

DROP TRIGGER IF EXISTS trigger_log_purchase_changes ON purchases;
CREATE TRIGGER trigger_log_purchase_changes
    AFTER UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION log_purchase_changes();

-- Step 8: Verify all tables and triggers were created
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('transaction_history', 'purchase_updates', 'activity_history')
ORDER BY table_name;

SELECT 'Triggers created:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_log_transaction_changes', 'trigger_log_purchase_changes')
ORDER BY trigger_name;

-- Step 9: Test the setup
DO $$
DECLARE
    test_transaction_id VARCHAR(8);
    test_purchase_id UUID;
BEGIN
    -- Test transaction
    SELECT transaction_id INTO test_transaction_id FROM transactions LIMIT 1;
    IF test_transaction_id IS NOT NULL THEN
        UPDATE transactions 
        SET description = description || ' (HISTORY TEST)'
        WHERE transaction_id = test_transaction_id;
        RAISE NOTICE 'Transaction history test completed for: %', test_transaction_id;
    END IF;
    
    -- Test purchase
    SELECT id INTO test_purchase_id FROM purchases LIMIT 1;
    IF test_purchase_id IS NOT NULL THEN
        UPDATE purchases 
        SET item_name = item_name || ' (HISTORY TEST)'
        WHERE id = test_purchase_id;
        RAISE NOTICE 'Purchase history test completed for ID: %', test_purchase_id;
    END IF;
END $$; 
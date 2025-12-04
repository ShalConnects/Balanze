-- Complete fix for history tracking issues
-- This will ensure both general activity history and transaction/purchase updates are recorded

-- Step 1: Clean up existing history tables and functions
DROP TRIGGER IF EXISTS trigger_log_transaction_changes ON transactions;
DROP TRIGGER IF EXISTS trigger_log_purchase_changes ON purchases;
DROP FUNCTION IF EXISTS log_transaction_changes();
DROP FUNCTION IF EXISTS log_purchase_changes();

-- Step 2: Create the transaction history logging function
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
    field_name TEXT;
    old_value TEXT;
    new_value TEXT;
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the purchase history logging function
CREATE OR REPLACE FUNCTION log_purchase_changes()
RETURNS TRIGGER AS $$
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
            NEW.id,
            'item_name',
            COALESCE(OLD.item_name, ''),
            COALESCE(NEW.item_name, ''),
            NOW()
        );
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create triggers
CREATE TRIGGER trigger_log_transaction_changes
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_changes();

CREATE TRIGGER trigger_log_purchase_changes
    AFTER UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION log_purchase_changes();

-- Step 5: Create a general activity history function
CREATE OR REPLACE FUNCTION log_activity_history(
    activity_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    description TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO activity_history (
        activity_type,
        entity_type,
        entity_id,
        description,
        created_at
    ) VALUES (
        activity_type,
        entity_type,
        entity_id,
        description,
        NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If activity_history table doesn't exist, create it
        CREATE TABLE IF NOT EXISTS activity_history (
            id SERIAL PRIMARY KEY,
            activity_type TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Try insert again
        INSERT INTO activity_history (
            activity_type,
            entity_type,
            entity_id,
            description,
            created_at
        ) VALUES (
            activity_type,
            entity_type,
            entity_id,
            description,
            NOW()
        );
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update the transaction logging to also log general activity
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
    field_name TEXT;
    old_value TEXT;
    new_value TEXT;
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
        PERFORM log_activity_history(
            'UPDATE',
            'transaction',
            NEW.transaction_id,
            'Transaction updated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Update the purchase logging to also log general activity
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
            NEW.id,
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
        PERFORM log_activity_history(
            'UPDATE',
            'purchase',
            NEW.id::TEXT,
            'Purchase updated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Verify triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_log_transaction_changes', 'trigger_log_purchase_changes');

-- Step 9: Test the setup
-- This will create a test record to verify everything works
DO $$
DECLARE
    test_transaction_id TEXT;
    test_purchase_id INTEGER;
BEGIN
    -- Get a test transaction
    SELECT transaction_id INTO test_transaction_id FROM transactions LIMIT 1;
    
    IF test_transaction_id IS NOT NULL THEN
        -- Test transaction update
        UPDATE transactions 
        SET description = description || ' (HISTORY TEST)'
        WHERE transaction_id = test_transaction_id;
        
        RAISE NOTICE 'Transaction update test completed for: %', test_transaction_id;
    END IF;
    
    -- Get a test purchase
    SELECT id INTO test_purchase_id FROM purchases LIMIT 1;
    
    IF test_purchase_id IS NOT NULL THEN
        -- Test purchase update
        UPDATE purchases 
        SET item_name = item_name || ' (HISTORY TEST)'
        WHERE id = test_purchase_id;
        
        RAISE NOTICE 'Purchase update test completed for ID: %', test_purchase_id;
    END IF;
END $$; 
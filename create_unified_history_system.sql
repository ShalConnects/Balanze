-- Create Unified History System
-- Single table with human-readable JSON format

-- Step 1: Drop existing history tables and triggers
DROP TRIGGER IF EXISTS trigger_log_transaction_changes ON transactions;
DROP TRIGGER IF EXISTS trigger_log_purchase_changes ON purchases;
DROP FUNCTION IF EXISTS log_transaction_changes();
DROP FUNCTION IF EXISTS log_purchase_changes();
DROP TABLE IF EXISTS transaction_history;
DROP TABLE IF EXISTS purchase_updates;
DROP TABLE IF EXISTS activity_history;

-- Step 2: Create unified activity_history table
CREATE TABLE activity_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,              -- User who performed the action
    activity_type TEXT NOT NULL,        -- "TRANSACTION_UPDATED", "PURCHASE_UPDATED", "TRANSACTION_CREATED", etc.
    entity_type TEXT NOT NULL,          -- "transaction", "purchase", "account", "transfer"
    entity_id TEXT NOT NULL,            -- The ID of the changed item
    description TEXT,                   -- Human-readable summary
    changes JSONB,                      -- Detailed changes in readable format
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_activity_history_created_at ON activity_history(created_at DESC);
CREATE INDEX idx_activity_history_entity ON activity_history(entity_type, entity_id);
CREATE INDEX idx_activity_history_type ON activity_history(activity_type);

-- Step 4: Create unified logging function for transactions
CREATE OR REPLACE FUNCTION log_transaction_activity()
RETURNS TRIGGER AS $$
DECLARE
    changes_array JSONB := '[]'::JSONB;
    change_count INTEGER := 0;
    summary TEXT := '';
BEGIN
    -- Check for changes and build changes array
    IF OLD.description IS DISTINCT FROM NEW.description THEN
        changes_array = changes_array || jsonb_build_object(
            'field', 'Description',
            'old', COALESCE(OLD.description, ''),
            'new', COALESCE(NEW.description, '')
        );
        change_count := change_count + 1;
    END IF;
    
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
        changes_array = changes_array || jsonb_build_object(
            'field', 'Amount',
            'old', COALESCE('$' || OLD.amount::TEXT, ''),
            'new', COALESCE('$' || NEW.amount::TEXT, '')
        );
        change_count := change_count + 1;
    END IF;
    
    IF OLD.type IS DISTINCT FROM NEW.type THEN
        changes_array = changes_array || jsonb_build_object(
            'field', 'Type',
            'old', COALESCE(OLD.type, ''),
            'new', COALESCE(NEW.type, '')
        );
        change_count := change_count + 1;
    END IF;
    
    IF OLD.date IS DISTINCT FROM NEW.date THEN
        changes_array = changes_array || jsonb_build_object(
            'field', 'Date',
            'old', COALESCE(OLD.date::TEXT, ''),
            'new', COALESCE(NEW.date::TEXT, '')
        );
        change_count := change_count + 1;
    END IF;
    
    -- Only log if there are actual changes
    IF change_count > 0 THEN
        -- Create human-readable summary
        IF change_count = 1 THEN
            summary := 'Transaction field updated';
        ELSE
            summary := change_count || ' transaction fields updated';
        END IF;
        
        -- Insert into activity history
        INSERT INTO activity_history (
            user_id,
            activity_type,
            entity_type,
            entity_id,
            description,
            changes,
            created_at
        ) VALUES (
            NEW.user_id,
            'TRANSACTION_UPDATED',
            'transaction',
            NEW.transaction_id,
            summary,
            jsonb_build_object(
                'summary', summary,
                'changes', changes_array
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create unified logging function for purchases
CREATE OR REPLACE FUNCTION log_purchase_activity()
RETURNS TRIGGER AS $$
DECLARE
    changes_array JSONB := '[]'::JSONB;
    change_count INTEGER := 0;
    summary TEXT := '';
BEGIN
    -- Check for changes and build changes array
    IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
        changes_array = changes_array || jsonb_build_object(
            'field', 'Title',
            'old', COALESCE(OLD.item_name, ''),
            'new', COALESCE(NEW.item_name, '')
        );
        change_count := change_count + 1;
    END IF;
    
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        changes_array = changes_array || jsonb_build_object(
            'field', 'Price',
            'old', COALESCE('$' || OLD.price::TEXT, ''),
            'new', COALESCE('$' || NEW.price::TEXT, '')
        );
        change_count := change_count + 1;
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
        changes_array = changes_array || jsonb_build_object(
            'field', 'Category',
            'old', COALESCE(OLD.category, ''),
            'new', COALESCE(NEW.category, '')
        );
        change_count := change_count + 1;
    END IF;
    
    -- Only log if there are actual changes
    IF change_count > 0 THEN
        -- Create human-readable summary
        IF change_count = 1 THEN
            summary := 'Purchase field updated';
        ELSE
            summary := change_count || ' purchase fields updated';
        END IF;
        
        -- Insert into activity history
        INSERT INTO activity_history (
            user_id,
            activity_type,
            entity_type,
            entity_id,
            description,
            changes,
            created_at
        ) VALUES (
            NEW.user_id,
            'PURCHASE_UPDATED',
            'purchase',
            NEW.id::TEXT,
            summary,
            jsonb_build_object(
                'summary', summary,
                'changes', changes_array
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers
CREATE TRIGGER trigger_log_transaction_activity
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_activity();

CREATE TRIGGER trigger_log_purchase_activity
    AFTER UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION log_purchase_activity();

-- Step 7: Create function to log new transactions
CREATE OR REPLACE FUNCTION log_new_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_history (
        user_id,
        activity_type,
        entity_type,
        entity_id,
        description,
        changes,
        created_at
    ) VALUES (
        NEW.user_id,
        'TRANSACTION_CREATED',
        'transaction',
        NEW.transaction_id,
        'New transaction created',
        jsonb_build_object(
            'summary', 'New transaction created',
            'changes', jsonb_build_array(
                jsonb_build_object(
                    'field', 'Description',
                    'new', COALESCE(NEW.description, '')
                ),
                jsonb_build_object(
                    'field', 'Amount',
                    'new', COALESCE('$' || NEW.amount::TEXT, '')
                ),
                jsonb_build_object(
                    'field', 'Type',
                    'new', COALESCE(NEW.type, '')
                )
            )
        ),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for new transactions
CREATE TRIGGER trigger_log_new_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_new_transaction();

-- Step 9: Create function to log new purchases
CREATE OR REPLACE FUNCTION log_new_purchase()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_history (
        user_id,
        activity_type,
        entity_type,
        entity_id,
        description,
        changes,
        created_at
    ) VALUES (
        NEW.user_id,
        'PURCHASE_CREATED',
        'purchase',
        NEW.id::TEXT,
        'New purchase created',
        jsonb_build_object(
            'summary', 'New purchase created',
            'changes', jsonb_build_array(
                jsonb_build_object(
                    'field', 'Title',
                    'new', COALESCE(NEW.item_name, '')
                ),
                jsonb_build_object(
                    'field', 'Price',
                    'new', COALESCE('$' || NEW.price::TEXT, '')
                ),
                jsonb_build_object(
                    'field', 'Category',
                    'new', COALESCE(NEW.category, '')
                )
            )
        ),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger for new purchases
CREATE TRIGGER trigger_log_new_purchase
    AFTER INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION log_new_purchase();

-- Step 11: Verify the setup
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'activity_history';

SELECT 'Triggers created:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_log_transaction_activity',
    'trigger_log_purchase_activity',
    'trigger_log_new_transaction',
    'trigger_log_new_purchase'
)
ORDER BY trigger_name;

-- Step 12: Test the setup
DO $$
DECLARE
    test_transaction_id VARCHAR(8);
    test_purchase_id UUID;
BEGIN
    -- Test transaction update
    SELECT transaction_id INTO test_transaction_id FROM transactions LIMIT 1;
    IF test_transaction_id IS NOT NULL THEN
        UPDATE transactions 
        SET description = description || ' (UNIFIED TEST)'
        WHERE transaction_id = test_transaction_id;
        RAISE NOTICE 'Transaction update test completed for: %', test_transaction_id;
    END IF;
    
    -- Test purchase update
    SELECT id INTO test_purchase_id FROM purchases LIMIT 1;
    IF test_purchase_id IS NOT NULL THEN
        UPDATE purchases 
        SET item_name = item_name || ' (UNIFIED TEST)'
        WHERE id = test_purchase_id;
        RAISE NOTICE 'Purchase update test completed for ID: %', test_purchase_id;
    END IF;
END $$; 
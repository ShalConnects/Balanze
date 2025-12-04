-- Create purchase_updates table for tracking purchase changes
-- This table will store history of purchase field changes

-- Step 1: Create the purchase_updates table
CREATE TABLE IF NOT EXISTS purchase_updates (
    id SERIAL PRIMARY KEY,
    purchase_id UUID NOT NULL,  -- Use UUID to match purchases.id
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_updates_purchase_id ON purchase_updates(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_updates_updated_at ON purchase_updates(updated_at);

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
            NEW.id,  -- This is a UUID
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

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS trigger_log_purchase_changes ON purchases;
CREATE TRIGGER trigger_log_purchase_changes
    AFTER UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION log_purchase_changes();

-- Step 5: Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_updates'
ORDER BY ordinal_position;

-- Step 6: Test the setup
DO $$
DECLARE
    test_purchase_id UUID;
BEGIN
    -- Get a test purchase ID
    SELECT id INTO test_purchase_id FROM purchases LIMIT 1;
    
    IF test_purchase_id IS NOT NULL THEN
        RAISE NOTICE 'Test purchase ID: %', test_purchase_id;
        
        -- Try to insert a test record
        INSERT INTO purchase_updates (
            purchase_id,
            field_name,
            old_value,
            new_value,
            updated_at
        ) VALUES (
            test_purchase_id,
            'test',
            'old',
            'new',
            NOW()
        );
        
        RAISE NOTICE 'Test insert successful';
        
        -- Clean up test record
        DELETE FROM purchase_updates WHERE field_name = 'test';
    ELSE
        RAISE NOTICE 'No purchases found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$; 
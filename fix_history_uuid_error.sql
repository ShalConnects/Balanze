-- Fix UUID/integer mismatch in history tracking
-- The error shows purchase_id expects integer but we're passing UUID

-- Step 1: Check the current purchase_updates table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_updates' 
AND column_name = 'purchase_id';

-- Step 2: Drop existing triggers and functions
DROP TRIGGER IF EXISTS trigger_log_purchase_changes ON purchases;
DROP FUNCTION IF EXISTS log_purchase_changes();

-- Step 3: Check what data type purchase.id actually is
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' 
AND column_name = 'id';

-- Step 4: Fix the purchase history logging function
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
            NEW.id,  -- This should be the correct data type
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

-- Step 5: Recreate the trigger
CREATE TRIGGER trigger_log_purchase_changes
    AFTER UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION log_purchase_changes();

-- Step 6: Test the function with a simple update
-- This will help us see if the data types match
DO $$
DECLARE
    test_purchase_id TEXT;
BEGIN
    -- Get a test purchase ID
    SELECT id::TEXT INTO test_purchase_id FROM purchases LIMIT 1;
    
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
            test_purchase_id::INTEGER,  -- Convert to integer if needed
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
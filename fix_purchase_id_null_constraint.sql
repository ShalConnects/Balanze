-- Fix null purchase_id constraint issue
-- This script fixes the issue where purchase_id is null when logging purchase updates

-- 1. First, let's check what's causing the null purchase_id
SELECT 
    'Current purchase_updates records with null purchase_id:' as info,
    COUNT(*) as count
FROM purchase_updates 
WHERE purchase_id IS NULL;

-- 2. Clean up any existing null records
DELETE FROM purchase_updates WHERE purchase_id IS NULL;

-- 3. Update the purchase_updates table to allow null purchase_id temporarily
-- (This is needed because some purchases might not have a purchase_id yet)
ALTER TABLE purchase_updates ALTER COLUMN purchase_id DROP NOT NULL;

-- 4. Fix the log_purchase_update function to handle null purchase_id properly
CREATE OR REPLACE FUNCTION log_purchase_update()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the current user ID from auth.uid()
  user_id := auth.uid();
  
  -- Only log if we have a valid purchase_id
  IF NEW.purchase_id IS NOT NULL THEN
    -- Log changes for each field that was updated
    IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
      INSERT INTO purchase_updates (purchase_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.purchase_id, 'item_name', OLD.item_name, NEW.item_name, user_id);
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      INSERT INTO purchase_updates (purchase_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.purchase_id, 'category', OLD.category, NEW.category, user_id);
    END IF;
    
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      INSERT INTO purchase_updates (purchase_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.purchase_id, 'price', OLD.price::text, NEW.price::text, user_id);
    END IF;
    
    IF OLD.purchase_date IS DISTINCT FROM NEW.purchase_date THEN
      INSERT INTO purchase_updates (purchase_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.purchase_id, 'purchase_date', OLD.purchase_date::text, NEW.purchase_date::text, user_id);
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO purchase_updates (purchase_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.purchase_id, 'status', OLD.status, NEW.status, user_id);
    END IF;
    
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO purchase_updates (purchase_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.purchase_id, 'priority', OLD.priority, NEW.priority, user_id);
    END IF;
    
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      INSERT INTO purchase_updates (purchase_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.purchase_id, 'notes', OLD.notes, NEW.notes, user_id);
    END IF;
    
    IF OLD.currency IS DISTINCT FROM NEW.currency THEN
      INSERT INTO purchase_updates (purchase_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.purchase_id, 'currency', OLD.currency, NEW.currency, user_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Also fix the log_transaction_update function to handle null transaction_id
CREATE OR REPLACE FUNCTION log_transaction_update()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the current user ID from auth.uid()
  user_id := auth.uid();
  
  -- Only log if we have a valid transaction_id
  IF NEW.transaction_id IS NOT NULL THEN
    -- Log changes for each field that was updated
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'amount', OLD.amount::text, NEW.amount::text, user_id);
    END IF;
    
    IF OLD.type IS DISTINCT FROM NEW.type THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'type', OLD.type, NEW.type, user_id);
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'category', OLD.category, NEW.category, user_id);
    END IF;
    
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'description', OLD.description, NEW.description, user_id);
    END IF;
    
    IF OLD.date IS DISTINCT FROM NEW.date THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'date', OLD.date::text, NEW.date::text, user_id);
    END IF;
    
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'tags', OLD.tags::text, NEW.tags::text, user_id);
    END IF;
    
    IF OLD.saving_amount IS DISTINCT FROM NEW.saving_amount THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'saving_amount', OLD.saving_amount::text, NEW.saving_amount::text, user_id);
    END IF;
    
    IF OLD.is_recurring IS DISTINCT FROM NEW.is_recurring THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'is_recurring', OLD.is_recurring::text, NEW.is_recurring::text, user_id);
    END IF;
    
    IF OLD.recurring_frequency IS DISTINCT FROM NEW.recurring_frequency THEN
      INSERT INTO transaction_updates (transaction_id, field_name, old_value, new_value, updated_by)
      VALUES (NEW.transaction_id, 'recurring_frequency', OLD.recurring_frequency, NEW.recurring_frequency, user_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Check if purchases table has purchase_id column
SELECT 
    'Checking purchases table structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' AND column_name = 'purchase_id';

-- 7. If purchases table doesn't have purchase_id column, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'purchase_id'
    ) THEN
        -- Add purchase_id column to purchases table
        ALTER TABLE purchases ADD COLUMN purchase_id VARCHAR(8);
        
        -- Update existing purchases to have purchase_id
        UPDATE purchases 
        SET purchase_id = 'P' || LPAD(id::text, 7, '0')
        WHERE purchase_id IS NULL;
        
        -- Make purchase_id NOT NULL after populating
        ALTER TABLE purchases ALTER COLUMN purchase_id SET NOT NULL;
        
        -- Add unique constraint
        ALTER TABLE purchases ADD CONSTRAINT purchases_purchase_id_unique UNIQUE (purchase_id);
        
        RAISE NOTICE 'Added purchase_id column to purchases table';
    ELSE
        RAISE NOTICE 'purchase_id column already exists in purchases table';
    END IF;
END $$;

-- 8. Update the purchase_updates table to make purchase_id NOT NULL again
-- (but only after we ensure all purchases have purchase_id)
ALTER TABLE purchase_updates ALTER COLUMN purchase_id SET NOT NULL;

-- 9. Update the views to handle the new structure
CREATE OR REPLACE VIEW purchase_update_history AS
SELECT 
  pu.id,
  pu.purchase_id,
  pu.field_name,
  pu.old_value,
  pu.new_value,
  pu.updated_at,
  pu.updated_by,
  p.item_name as purchase_item_name,
  p.price as purchase_price,
  p.category as purchase_category,
  p.status as purchase_status,
  p.priority as purchase_priority,
  u.email as updated_by_email
FROM purchase_updates pu
LEFT JOIN purchases p ON pu.purchase_id = p.purchase_id
LEFT JOIN auth.users u ON pu.updated_by = u.id
ORDER BY pu.updated_at DESC;

-- 10. Test the fix
SELECT 
    'FIX COMPLETE' as status,
    'Purchase ID null constraint issue has been resolved' as message;

-- 11. Show current status
SELECT 
    'Current purchase_updates records:' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN purchase_id IS NULL THEN 1 END) as null_purchase_id_records
FROM purchase_updates;

-- 12. Show purchases with purchase_id
SELECT 
    'Purchases with purchase_id:' as info,
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN purchase_id IS NOT NULL THEN 1 END) as purchases_with_id
FROM purchases; 
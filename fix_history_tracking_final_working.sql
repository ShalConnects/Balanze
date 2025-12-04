-- Fix History Tracking - Final Working Version
-- This version fixes the null purchase_id constraint issue

-- 1. First, let's see what exists and clean up
SELECT '=== CLEANUP PHASE ===' as step;

-- Drop any existing views that might conflict
DROP VIEW IF EXISTS transaction_history CASCADE;
DROP VIEW IF EXISTS purchase_history CASCADE;
DROP VIEW IF EXISTS transaction_history_view CASCADE;
DROP VIEW IF EXISTS purchase_history_view CASCADE;

-- Drop any existing triggers
DROP TRIGGER IF EXISTS trigger_log_transaction_update ON transactions;
DROP TRIGGER IF EXISTS trigger_log_purchase_update ON purchases;
DROP TRIGGER IF EXISTS trigger_log_transaction_changes ON transactions;
DROP TRIGGER IF EXISTS trigger_log_purchase_changes ON purchases;

-- Drop any existing functions
DROP FUNCTION IF EXISTS log_transaction_update();
DROP FUNCTION IF EXISTS log_purchase_update();
DROP FUNCTION IF EXISTS log_transaction_changes();
DROP FUNCTION IF EXISTS log_purchase_changes();

-- Drop any existing tables (use DROP TABLE for tables)
DROP TABLE IF EXISTS transaction_updates CASCADE;
DROP TABLE IF EXISTS purchase_updates CASCADE;
DROP TABLE IF EXISTS transaction_edit_sessions CASCADE;
DROP TABLE IF EXISTS purchase_edit_sessions CASCADE;
DROP TABLE IF EXISTS transaction_field_changes CASCADE;
DROP TABLE IF EXISTS purchase_field_changes CASCADE;
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS purchase_history CASCADE;

-- 2. Create simple history tables
SELECT '=== CREATING TABLES ===' as step;

CREATE TABLE transaction_history (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(8) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_history (
  id SERIAL PRIMARY KEY,
  purchase_id VARCHAR(8) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_changed_at ON transaction_history(changed_at);
CREATE INDEX idx_purchase_history_purchase_id ON purchase_history(purchase_id);
CREATE INDEX idx_purchase_history_changed_at ON purchase_history(changed_at);

-- 4. Create simple logging functions (no auth dependency)
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if we have a valid transaction_id
  IF NEW.transaction_id IS NOT NULL THEN
    -- Log amount changes
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'amount', OLD.amount::text, NEW.amount::text);
    END IF;
    
    -- Log type changes
    IF OLD.type IS DISTINCT FROM NEW.type THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'type', OLD.type, NEW.type);
    END IF;
    
    -- Log category changes
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'category', OLD.category, NEW.category);
    END IF;
    
    -- Log description changes
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'description', OLD.description, NEW.description);
    END IF;
    
    -- Log date changes
    IF OLD.date IS DISTINCT FROM NEW.date THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'date', OLD.date::text, NEW.date::text);
    END IF;
    
    -- Log tags changes
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'tags', OLD.tags::text, NEW.tags::text);
    END IF;
    
    -- Log saving_amount changes
    IF OLD.saving_amount IS DISTINCT FROM NEW.saving_amount THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'saving_amount', OLD.saving_amount::text, NEW.saving_amount::text);
    END IF;
    
    -- Log is_recurring changes
    IF OLD.is_recurring IS DISTINCT FROM NEW.is_recurring THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'is_recurring', OLD.is_recurring::text, NEW.is_recurring::text);
    END IF;
    
    -- Log recurring_frequency changes
    IF OLD.recurring_frequency IS DISTINCT FROM NEW.recurring_frequency THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'recurring_frequency', OLD.recurring_frequency, NEW.recurring_frequency);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_purchase_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if we have a valid purchase_id
  IF NEW.purchase_id IS NOT NULL THEN
    -- Log item_name changes
    IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'item_name', OLD.item_name, NEW.item_name);
    END IF;
    
    -- Log category changes
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'category', OLD.category, NEW.category);
    END IF;
    
    -- Log price changes
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'price', OLD.price::text, NEW.price::text);
    END IF;
    
    -- Log purchase_date changes
    IF OLD.purchase_date IS DISTINCT FROM NEW.purchase_date THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'purchase_date', OLD.purchase_date::text, NEW.purchase_date::text);
    END IF;
    
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'status', OLD.status, NEW.status);
    END IF;
    
    -- Log priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'priority', OLD.priority, NEW.priority);
    END IF;
    
    -- Log notes changes
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'notes', OLD.notes, NEW.notes);
    END IF;
    
    -- Log currency changes
    IF OLD.currency IS DISTINCT FROM NEW.currency THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'currency', OLD.currency, NEW.currency);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers ONLY on the appropriate tables
CREATE TRIGGER trigger_log_transaction_changes
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_changes();

-- Only create purchase trigger if purchases table has purchase_id column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'purchase_id'
    ) THEN
        CREATE TRIGGER trigger_log_purchase_changes
          AFTER UPDATE ON purchases
          FOR EACH ROW
          EXECUTE FUNCTION log_purchase_changes();
        
        RAISE NOTICE 'Created purchase history trigger';
    ELSE
        RAISE NOTICE 'Skipped purchase history trigger - purchase_id column not found';
    END IF;
END $$;

-- 6. Create views for easy access
CREATE OR REPLACE VIEW transaction_history_view AS
SELECT 
  th.id,
  th.transaction_id,
  th.field_name,
  th.old_value,
  th.new_value,
  th.changed_at,
  t.description as transaction_description,
  t.amount as transaction_amount,
  t.type as transaction_type,
  t.category as transaction_category,
  a.name as account_name
FROM transaction_history th
LEFT JOIN transactions t ON th.transaction_id = t.transaction_id
LEFT JOIN accounts a ON t.account_id = a.id
ORDER BY th.changed_at DESC;

CREATE OR REPLACE VIEW purchase_history_view AS
SELECT 
  ph.id,
  ph.purchase_id,
  ph.field_name,
  ph.old_value,
  ph.new_value,
  ph.changed_at,
  p.item_name as purchase_item_name,
  p.price as purchase_price,
  p.category as purchase_category,
  p.status as purchase_status,
  p.priority as purchase_priority
FROM purchase_history ph
LEFT JOIN purchases p ON ph.purchase_id = p.purchase_id
ORDER BY ph.changed_at DESC;

-- 7. Set up permissions
GRANT SELECT ON transaction_history TO authenticated;
GRANT SELECT ON purchase_history TO authenticated;
GRANT SELECT ON transaction_history_view TO authenticated;
GRANT SELECT ON purchase_history_view TO authenticated;

-- 8. Enable RLS
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
DROP POLICY IF EXISTS "Users can view their own transaction history" ON transaction_history;
CREATE POLICY "Users can view their own transaction history" ON transaction_history
  FOR SELECT USING (
    transaction_id IN (
      SELECT transaction_id FROM transactions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert transaction history" ON transaction_history;
CREATE POLICY "System can insert transaction history" ON transaction_history
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own purchase history" ON purchase_history;
CREATE POLICY "Users can view their own purchase history" ON purchase_history
  FOR SELECT USING (
    purchase_id IN (
      SELECT purchase_id FROM purchases WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert purchase history" ON purchase_history;
CREATE POLICY "System can insert purchase history" ON purchase_history
  FOR INSERT WITH CHECK (true);

-- 10. Test the system
SELECT 
    'FINAL WORKING HISTORY TRACKING SYSTEM SETUP COMPLETE' as status,
    'Now try editing a transaction and check transaction_history table' as message;

-- Show trigger status
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_log_transaction_changes', 'trigger_log_purchase_changes')
ORDER BY trigger_name;

-- Show table counts
SELECT 
    'transaction_history' as table_name,
    COUNT(*) as record_count
FROM transaction_history
UNION ALL
SELECT 
    'purchase_history' as table_name,
    COUNT(*) as record_count
FROM purchase_history;

-- Show what was created
SELECT 
    'Created tables:' as info,
    'transaction_history' as table1,
    'purchase_history' as table2;

SELECT 
    'Created views:' as info,
    'transaction_history_view' as view1,
    'purchase_history_view' as view2; 
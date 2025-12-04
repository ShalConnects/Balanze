-- Simple History Tracking - Final Version
-- This version just creates the system without complex cleanup

-- 1. Drop existing triggers and functions
DROP TRIGGER IF EXISTS trigger_log_transaction_changes ON transactions;
DROP TRIGGER IF EXISTS trigger_log_purchase_changes ON purchases;
DROP FUNCTION IF EXISTS log_transaction_changes();
DROP FUNCTION IF EXISTS log_purchase_changes();

-- 2. Drop existing tables (if they exist)
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS purchase_history CASCADE;

-- 3. Create simple history tables
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

-- 4. Create indexes
CREATE INDEX idx_transaction_history_transaction_id ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_changed_at ON transaction_history(changed_at);
CREATE INDEX idx_purchase_history_purchase_id ON purchase_history(purchase_id);
CREATE INDEX idx_purchase_history_changed_at ON purchase_history(changed_at);

-- 5. Create simple logging functions
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_id IS NOT NULL THEN
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'amount', OLD.amount::text, NEW.amount::text);
    END IF;
    
    IF OLD.type IS DISTINCT FROM NEW.type THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'type', OLD.type, NEW.type);
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'category', OLD.category, NEW.category);
    END IF;
    
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'description', OLD.description, NEW.description);
    END IF;
    
    IF OLD.date IS DISTINCT FROM NEW.date THEN
      INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
      VALUES (NEW.transaction_id, 'date', OLD.date::text, NEW.date::text);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_purchase_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purchase_id IS NOT NULL THEN
    IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'item_name', OLD.item_name, NEW.item_name);
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'category', OLD.category, NEW.category);
    END IF;
    
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      INSERT INTO purchase_history (purchase_id, field_name, old_value, new_value)
      VALUES (NEW.purchase_id, 'price', OLD.price::text, NEW.price::text);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers
CREATE TRIGGER trigger_log_transaction_changes
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_changes();

-- 7. Create views
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
  t.category as transaction_category
FROM transaction_history th
LEFT JOIN transactions t ON th.transaction_id = t.transaction_id
ORDER BY th.changed_at DESC;

-- 8. Set up permissions
GRANT SELECT ON transaction_history TO authenticated;
GRANT SELECT ON transaction_history_view TO authenticated;

-- 9. Enable RLS
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
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

-- 11. Success message
SELECT 'SIMPLE HISTORY TRACKING SETUP COMPLETE' as status; 
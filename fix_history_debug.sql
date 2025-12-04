-- Debug History Tracking
-- This script will help us see what's happening

-- 1. Clean up and create fresh
DROP TRIGGER IF EXISTS trigger_log_transaction_changes ON transactions;
DROP FUNCTION IF EXISTS log_transaction_changes();
DROP TABLE IF EXISTS transaction_history CASCADE;

-- 2. Create simple table
CREATE TABLE transaction_history (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(8) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create debug function
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Debug: Always log when function is called
  RAISE NOTICE 'DEBUG: Function called for transaction_id: %', NEW.transaction_id;
  
  -- Log description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
    VALUES (NEW.transaction_id, 'description', OLD.description, NEW.description);
    RAISE NOTICE 'DEBUG: Logged description change: % -> %', OLD.description, NEW.description;
  END IF;
  
  -- Log amount changes
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
    VALUES (NEW.transaction_id, 'amount', OLD.amount::text, NEW.amount::text);
    RAISE NOTICE 'DEBUG: Logged amount change: % -> %', OLD.amount, NEW.amount;
  END IF;
  
  -- Log category changes
  IF OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO transaction_history (transaction_id, field_name, old_value, new_value)
    VALUES (NEW.transaction_id, 'category', OLD.category, NEW.category);
    RAISE NOTICE 'DEBUG: Logged category change: % -> %', OLD.category, NEW.category;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
CREATE TRIGGER trigger_log_transaction_changes
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_changes();

-- 5. Set up permissions
GRANT SELECT ON transaction_history TO authenticated;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert transaction history" ON transaction_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own transaction history" ON transaction_history
  FOR SELECT USING (
    transaction_id IN (
      SELECT transaction_id FROM transactions WHERE user_id = auth.uid()
    )
  );

-- 6. Success message
SELECT 'DEBUG HISTORY SYSTEM READY' as status;
SELECT 'Now edit a transaction and check the logs for DEBUG messages' as instruction; 
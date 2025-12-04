-- Create tables for tracking transaction and purchase update history
-- This will solve the UUID/VARCHAR mismatch issue by keeping original transaction IDs unchanged

-- Table for tracking transaction updates
CREATE TABLE IF NOT EXISTS transaction_updates (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(8) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table for tracking purchase updates
CREATE TABLE IF NOT EXISTS purchase_updates (
  id SERIAL PRIMARY KEY,
  purchase_id VARCHAR(8) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_updates_transaction_id ON transaction_updates(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_updates_updated_at ON transaction_updates(updated_at);
CREATE INDEX IF NOT EXISTS idx_transaction_updates_updated_by ON transaction_updates(updated_by);

CREATE INDEX IF NOT EXISTS idx_purchase_updates_purchase_id ON purchase_updates(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_updates_updated_at ON purchase_updates(updated_at);
CREATE INDEX IF NOT EXISTS idx_purchase_updates_updated_by ON purchase_updates(updated_by);

-- Create a function to log transaction updates
CREATE OR REPLACE FUNCTION log_transaction_update()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the current user ID from auth.uid()
  user_id := auth.uid();
  
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to log purchase updates
CREATE OR REPLACE FUNCTION log_purchase_update()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the current user ID from auth.uid()
  user_id := auth.uid();
  
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for transaction updates
DROP TRIGGER IF EXISTS trigger_log_transaction_update ON transactions;
CREATE TRIGGER trigger_log_transaction_update
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_update();

-- Create triggers for purchase updates
DROP TRIGGER IF EXISTS trigger_log_purchase_update ON purchases;
CREATE TRIGGER trigger_log_purchase_update
  AFTER UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION log_purchase_update();

-- Create a view to get transaction update history with user information
CREATE OR REPLACE VIEW transaction_update_history AS
SELECT 
  tu.id,
  tu.transaction_id,
  tu.field_name,
  tu.old_value,
  tu.new_value,
  tu.updated_at,
  tu.updated_by,
  tu.metadata,
  t.description as transaction_description,
  t.amount as transaction_amount,
  t.type as transaction_type,
  t.category as transaction_category,
  a.name as account_name,
  u.email as updated_by_email
FROM transaction_updates tu
LEFT JOIN transactions t ON tu.transaction_id = t.transaction_id
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN auth.users u ON tu.updated_by = u.id
ORDER BY tu.updated_at DESC;

-- Create a view to get purchase update history with user information
CREATE OR REPLACE VIEW purchase_update_history AS
SELECT 
  pu.id,
  pu.purchase_id,
  pu.field_name,
  pu.old_value,
  pu.new_value,
  pu.updated_at,
  pu.updated_by,
  pu.metadata,
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

-- Grant necessary permissions
GRANT SELECT ON transaction_updates TO authenticated;
GRANT SELECT ON purchase_updates TO authenticated;
GRANT SELECT ON transaction_update_history TO authenticated;
GRANT SELECT ON purchase_update_history TO authenticated;

-- Enable RLS (Row Level Security) on the new tables
ALTER TABLE transaction_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transaction_updates
CREATE POLICY "Users can view their own transaction updates" ON transaction_updates
  FOR SELECT USING (
    transaction_id IN (
      SELECT transaction_id FROM transactions WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for purchase_updates
CREATE POLICY "Users can view their own purchase updates" ON purchase_updates
  FOR SELECT USING (
    purchase_id IN (
      SELECT purchase_id FROM purchases WHERE user_id = auth.uid()
    )
  );

-- Insert policy for transaction_updates (only system can insert via triggers)
CREATE POLICY "System can insert transaction updates" ON transaction_updates
  FOR INSERT WITH CHECK (true);

-- Insert policy for purchase_updates (only system can insert via triggers)
CREATE POLICY "System can insert purchase updates" ON purchase_updates
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE transaction_updates IS 'Tracks all changes made to transactions to maintain audit trail';
COMMENT ON TABLE purchase_updates IS 'Tracks all changes made to purchases to maintain audit trail';
COMMENT ON VIEW transaction_update_history IS 'View combining transaction updates with transaction and user details';
COMMENT ON VIEW purchase_update_history IS 'View combining purchase updates with purchase and user details'; 
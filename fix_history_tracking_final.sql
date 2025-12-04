-- Fix History Tracking System - Final Solution
-- This script will diagnose and fix all history tracking issues

-- 1. First, let's check what's currently set up
SELECT '=== DIAGNOSIS ===' as step;

-- Check if any history tables exist
SELECT 
    'Current tables:' as info,
    table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) as exists
FROM (VALUES 
    ('transaction_updates'),
    ('purchase_updates'),
    ('transaction_edit_sessions'),
    ('purchase_edit_sessions'),
    ('transaction_field_changes'),
    ('purchase_field_changes')
) AS t(table_name);

-- Check if functions exist
SELECT 
    'Current functions:' as info,
    routine_name,
    EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = routine_name) as exists
FROM (VALUES 
    ('log_transaction_update'),
    ('log_purchase_update'),
    ('generate_session_id'),
    ('create_change_summary')
) AS f(routine_name);

-- Check if triggers exist
SELECT 
    'Current triggers:' as info,
    trigger_name,
    EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = trigger_name) as exists
FROM (VALUES 
    ('trigger_log_transaction_update'),
    ('trigger_log_purchase_update')
) AS tr(trigger_name);

-- 2. Clean up any existing broken system
SELECT '=== CLEANUP ===' as step;

-- Drop all existing triggers
DROP TRIGGER IF EXISTS trigger_log_transaction_update ON transactions;
DROP TRIGGER IF EXISTS trigger_log_purchase_update ON purchases;

-- Drop all existing functions
DROP FUNCTION IF EXISTS log_transaction_update();
DROP FUNCTION IF EXISTS log_purchase_update();
DROP FUNCTION IF EXISTS generate_session_id();
DROP FUNCTION IF EXISTS create_change_summary();

-- Drop old tables if they exist
DROP TABLE IF EXISTS transaction_updates CASCADE;
DROP TABLE IF EXISTS purchase_updates CASCADE;

-- 3. Create the new history tracking system
SELECT '=== CREATING NEW SYSTEM ===' as step;

-- Create new tables for grouped history tracking
CREATE TABLE IF NOT EXISTS transaction_edit_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL, -- UUID for the edit session
  transaction_id VARCHAR(8) NOT NULL,
  edited_at TIMESTAMP DEFAULT NOW(),
  edited_by UUID REFERENCES auth.users(id),
  change_summary TEXT, -- Human-readable summary of changes
  UNIQUE(session_id)
);

CREATE TABLE IF NOT EXISTS purchase_edit_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL, -- UUID for the edit session
  purchase_id VARCHAR(8) NOT NULL,
  edited_at TIMESTAMP DEFAULT NOW(),
  edited_by UUID REFERENCES auth.users(id),
  change_summary TEXT, -- Human-readable summary of changes
  UNIQUE(session_id)
);

CREATE TABLE IF NOT EXISTS transaction_field_changes (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  FOREIGN KEY (session_id) REFERENCES transaction_edit_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_field_changes (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  FOREIGN KEY (session_id) REFERENCES purchase_edit_sessions(session_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_edit_sessions_transaction_id ON transaction_edit_sessions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_edit_sessions_edited_at ON transaction_edit_sessions(edited_at);
CREATE INDEX IF NOT EXISTS idx_transaction_edit_sessions_edited_by ON transaction_edit_sessions(edited_by);

CREATE INDEX IF NOT EXISTS idx_purchase_edit_sessions_purchase_id ON purchase_edit_sessions(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_edit_sessions_edited_at ON purchase_edit_sessions(edited_at);
CREATE INDEX IF NOT EXISTS idx_purchase_edit_sessions_edited_by ON purchase_edit_sessions(edited_by);

CREATE INDEX IF NOT EXISTS idx_transaction_field_changes_session_id ON transaction_field_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_purchase_field_changes_session_id ON purchase_field_changes(session_id);

-- 4. Create helper functions
CREATE OR REPLACE FUNCTION generate_session_id()
RETURNS VARCHAR(36) AS $$
BEGIN
  RETURN gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_change_summary(
  p_field_changes JSONB
)
RETURNS TEXT AS $$
DECLARE
  summary TEXT := '';
  field_name TEXT;
  field_value JSONB;
BEGIN
  FOR field_name, field_value IN SELECT * FROM jsonb_each(p_field_changes)
  LOOP
    IF summary != '' THEN
      summary := summary || ', ';
    END IF;
    
    -- Create readable field names
    CASE field_name
      WHEN 'amount' THEN summary := summary || 'Amount';
      WHEN 'type' THEN summary := summary || 'Type';
      WHEN 'category' THEN summary := summary || 'Category';
      WHEN 'description' THEN summary := summary || 'Description';
      WHEN 'date' THEN summary := summary || 'Date';
      WHEN 'tags' THEN summary := summary || 'Tags';
      WHEN 'saving_amount' THEN summary := summary || 'Saving Amount';
      WHEN 'is_recurring' THEN summary := summary || 'Recurring Status';
      WHEN 'recurring_frequency' THEN summary := summary || 'Recurring Frequency';
      WHEN 'item_name' THEN summary := summary || 'Item Name';
      WHEN 'price' THEN summary := summary || 'Price';
      WHEN 'purchase_date' THEN summary := summary || 'Purchase Date';
      WHEN 'status' THEN summary := summary || 'Status';
      WHEN 'priority' THEN summary := summary || 'Priority';
      WHEN 'notes' THEN summary := summary || 'Notes';
      WHEN 'currency' THEN summary := summary || 'Currency';
      ELSE summary := summary || field_name;
    END CASE;
  END LOOP;
  
  RETURN summary;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the transaction logging function
CREATE OR REPLACE FUNCTION log_transaction_update()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  session_id VARCHAR(36);
  field_changes JSONB := '{}'::jsonb;
  change_count INTEGER := 0;
  summary TEXT;
BEGIN
  -- Get the current user ID from auth.uid()
  user_id := auth.uid();
  
  -- Only log if we have a valid transaction_id
  IF NEW.transaction_id IS NOT NULL THEN
    -- Check for changes and build the changes object
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
      field_changes := field_changes || jsonb_build_object('amount', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.type IS DISTINCT FROM NEW.type THEN
      field_changes := field_changes || jsonb_build_object('type', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      field_changes := field_changes || jsonb_build_object('category', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      field_changes := field_changes || jsonb_build_object('description', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.date IS DISTINCT FROM NEW.date THEN
      field_changes := field_changes || jsonb_build_object('date', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
      field_changes := field_changes || jsonb_build_object('tags', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.saving_amount IS DISTINCT FROM NEW.saving_amount THEN
      field_changes := field_changes || jsonb_build_object('saving_amount', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.is_recurring IS DISTINCT FROM NEW.is_recurring THEN
      field_changes := field_changes || jsonb_build_object('is_recurring', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.recurring_frequency IS DISTINCT FROM NEW.recurring_frequency THEN
      field_changes := field_changes || jsonb_build_object('recurring_frequency', 'changed');
      change_count := change_count + 1;
    END IF;
    
    -- Only create a session if there are actual changes
    IF change_count > 0 THEN
      -- Generate a unique session ID
      session_id := generate_session_id();
      
      -- Create the change summary
      summary := create_change_summary(field_changes);
      
      -- Insert the edit session
      INSERT INTO transaction_edit_sessions (session_id, transaction_id, edited_by, change_summary)
      VALUES (session_id, NEW.transaction_id, user_id, summary);
      
      -- Insert individual field changes
      IF OLD.amount IS DISTINCT FROM NEW.amount THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'amount', OLD.amount::text, NEW.amount::text);
      END IF;
      
      IF OLD.type IS DISTINCT FROM NEW.type THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'type', OLD.type, NEW.type);
      END IF;
      
      IF OLD.category IS DISTINCT FROM NEW.category THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'category', OLD.category, NEW.category);
      END IF;
      
      IF OLD.description IS DISTINCT FROM NEW.description THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'description', OLD.description, NEW.description);
      END IF;
      
      IF OLD.date IS DISTINCT FROM NEW.date THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'date', OLD.date::text, NEW.date::text);
      END IF;
      
      IF OLD.tags IS DISTINCT FROM NEW.tags THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'tags', OLD.tags::text, NEW.tags::text);
      END IF;
      
      IF OLD.saving_amount IS DISTINCT FROM NEW.saving_amount THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'saving_amount', OLD.saving_amount::text, NEW.saving_amount::text);
      END IF;
      
      IF OLD.is_recurring IS DISTINCT FROM NEW.is_recurring THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'is_recurring', OLD.is_recurring::text, NEW.is_recurring::text);
      END IF;
      
      IF OLD.recurring_frequency IS DISTINCT FROM NEW.recurring_frequency THEN
        INSERT INTO transaction_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'recurring_frequency', OLD.recurring_frequency, NEW.recurring_frequency);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the purchase logging function
CREATE OR REPLACE FUNCTION log_purchase_update()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  session_id VARCHAR(36);
  field_changes JSONB := '{}'::jsonb;
  change_count INTEGER := 0;
  summary TEXT;
BEGIN
  -- Get the current user ID from auth.uid()
  user_id := auth.uid();
  
  -- Only log if we have a valid purchase_id
  IF NEW.purchase_id IS NOT NULL THEN
    -- Check for changes and build the changes object
    IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
      field_changes := field_changes || jsonb_build_object('item_name', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.category IS DISTINCT FROM NEW.category THEN
      field_changes := field_changes || jsonb_build_object('category', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      field_changes := field_changes || jsonb_build_object('price', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.purchase_date IS DISTINCT FROM NEW.purchase_date THEN
      field_changes := field_changes || jsonb_build_object('purchase_date', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      field_changes := field_changes || jsonb_build_object('status', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      field_changes := field_changes || jsonb_build_object('priority', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      field_changes := field_changes || jsonb_build_object('notes', 'changed');
      change_count := change_count + 1;
    END IF;
    
    IF OLD.currency IS DISTINCT FROM NEW.currency THEN
      field_changes := field_changes || jsonb_build_object('currency', 'changed');
      change_count := change_count + 1;
    END IF;
    
    -- Only create a session if there are actual changes
    IF change_count > 0 THEN
      -- Generate a unique session ID
      session_id := generate_session_id();
      
      -- Create the change summary
      summary := create_change_summary(field_changes);
      
      -- Insert the edit session
      INSERT INTO purchase_edit_sessions (session_id, purchase_id, edited_by, change_summary)
      VALUES (session_id, NEW.purchase_id, user_id, summary);
      
      -- Insert individual field changes
      IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
        INSERT INTO purchase_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'item_name', OLD.item_name, NEW.item_name);
      END IF;
      
      IF OLD.category IS DISTINCT FROM NEW.category THEN
        INSERT INTO purchase_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'category', OLD.category, NEW.category);
      END IF;
      
      IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO purchase_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'price', OLD.price::text, NEW.price::text);
      END IF;
      
      IF OLD.purchase_date IS DISTINCT FROM NEW.purchase_date THEN
        INSERT INTO purchase_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'purchase_date', OLD.purchase_date::text, NEW.purchase_date::text);
      END IF;
      
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO purchase_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'status', OLD.status, NEW.status);
      END IF;
      
      IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO purchase_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'priority', OLD.priority, NEW.priority);
      END IF;
      
      IF OLD.notes IS DISTINCT FROM NEW.notes THEN
        INSERT INTO purchase_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'notes', OLD.notes, NEW.notes);
      END IF;
      
      IF OLD.currency IS DISTINCT FROM NEW.currency THEN
        INSERT INTO purchase_field_changes (session_id, field_name, old_value, new_value)
        VALUES (session_id, 'currency', OLD.currency, NEW.currency);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create the triggers
CREATE TRIGGER trigger_log_transaction_update
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_update();

CREATE TRIGGER trigger_log_purchase_update
  AFTER UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION log_purchase_update();

-- 8. Create views for easy access
CREATE OR REPLACE VIEW transaction_history AS
SELECT 
  tes.id,
  tes.session_id,
  tes.transaction_id,
  tes.change_summary,
  tes.edited_at,
  tes.edited_by,
  t.description as transaction_description,
  t.amount as transaction_amount,
  t.type as transaction_type,
  t.category as transaction_category,
  a.name as account_name,
  u.email as edited_by_email,
  COUNT(tfc.id) as field_change_count
FROM transaction_edit_sessions tes
LEFT JOIN transactions t ON tes.transaction_id = t.transaction_id
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN auth.users u ON tes.edited_by = u.id
LEFT JOIN transaction_field_changes tfc ON tes.session_id = tfc.session_id
GROUP BY tes.id, tes.session_id, tes.transaction_id, tes.change_summary, tes.edited_at, tes.edited_by, 
         t.description, t.amount, t.type, t.category, a.name, u.email
ORDER BY tes.edited_at DESC;

CREATE OR REPLACE VIEW purchase_history AS
SELECT 
  pes.id,
  pes.session_id,
  pes.purchase_id,
  pes.change_summary,
  pes.edited_at,
  pes.edited_by,
  p.item_name as purchase_item_name,
  p.price as purchase_price,
  p.category as purchase_category,
  p.status as purchase_status,
  p.priority as purchase_priority,
  u.email as edited_by_email,
  COUNT(pfc.id) as field_change_count
FROM purchase_edit_sessions pes
LEFT JOIN purchases p ON pes.purchase_id = p.purchase_id
LEFT JOIN auth.users u ON pes.edited_by = u.id
LEFT JOIN purchase_field_changes pfc ON pes.session_id = pfc.session_id
GROUP BY pes.id, pes.session_id, pes.purchase_id, pes.change_summary, pes.edited_at, pes.edited_by,
         p.item_name, p.price, p.category, p.status, p.priority, u.email
ORDER BY pes.edited_at DESC;

-- 9. Set up permissions and RLS
GRANT SELECT ON transaction_edit_sessions TO authenticated;
GRANT SELECT ON purchase_edit_sessions TO authenticated;
GRANT SELECT ON transaction_field_changes TO authenticated;
GRANT SELECT ON purchase_field_changes TO authenticated;
GRANT SELECT ON transaction_history TO authenticated;
GRANT SELECT ON purchase_history TO authenticated;

ALTER TABLE transaction_edit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_edit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_field_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_field_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own transaction edit sessions" ON transaction_edit_sessions;
CREATE POLICY "Users can view their own transaction edit sessions" ON transaction_edit_sessions
  FOR SELECT USING (
    transaction_id IN (
      SELECT transaction_id FROM transactions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert transaction edit sessions" ON transaction_edit_sessions;
CREATE POLICY "System can insert transaction edit sessions" ON transaction_edit_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own purchase edit sessions" ON purchase_edit_sessions;
CREATE POLICY "Users can view their own purchase edit sessions" ON purchase_edit_sessions
  FOR SELECT USING (
    purchase_id IN (
      SELECT purchase_id FROM purchases WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert purchase edit sessions" ON purchase_edit_sessions;
CREATE POLICY "System can insert purchase edit sessions" ON purchase_edit_sessions
  FOR INSERT WITH CHECK (true);

-- 10. Test the system
SELECT '=== TESTING ===' as step;

-- Show final status
SELECT 
    'HISTORY TRACKING SYSTEM SETUP COMPLETE' as status,
    'Now try editing a transaction and check the history' as message;

-- Show trigger status
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_log_transaction_update', 'trigger_log_purchase_update')
ORDER BY trigger_name;

-- Show table counts
SELECT 
    'transaction_edit_sessions' as table_name,
    COUNT(*) as record_count
FROM transaction_edit_sessions
UNION ALL
SELECT 
    'purchase_edit_sessions' as table_name,
    COUNT(*) as record_count
FROM purchase_edit_sessions; 
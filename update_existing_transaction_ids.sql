-- Update existing transactions that don't have a transaction_id
-- This script generates new transaction IDs for existing records

-- Function to generate a random 7-digit number
CREATE OR REPLACE FUNCTION generate_random_7_digits()
RETURNS TEXT AS $$
BEGIN
  RETURN 'F' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Update transactions table
UPDATE transactions 
SET transaction_id = generate_random_7_digits()
WHERE transaction_id IS NULL OR transaction_id = '';

-- Update dps_transfers table
UPDATE dps_transfers 
SET transaction_id = generate_random_7_digits()
WHERE transaction_id IS NULL OR transaction_id = '';

-- Update accounts table
UPDATE accounts 
SET transaction_id = generate_random_7_digits()
WHERE transaction_id IS NULL OR transaction_id = '';

-- Update purchases table
UPDATE purchases 
SET transaction_id = generate_random_7_digits()
WHERE transaction_id IS NULL OR transaction_id = '';

-- Update purchase_categories table
UPDATE purchase_categories 
SET transaction_id = generate_random_7_digits()
WHERE transaction_id IS NULL OR transaction_id = '';

-- Update savings_goals table
UPDATE savings_goals 
SET transaction_id = generate_random_7_digits()
WHERE transaction_id IS NULL OR transaction_id = '';

-- Update notifications table
UPDATE notifications 
SET transaction_id = generate_random_7_digits()
WHERE transaction_id IS NULL OR transaction_id = '';

-- Verify the updates
SELECT 
  'transactions' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id,
  COUNT(*) - COUNT(transaction_id) as records_without_transaction_id
FROM transactions

UNION ALL

SELECT 
  'purchases' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id,
  COUNT(*) - COUNT(transaction_id) as records_without_transaction_id
FROM purchases

UNION ALL

SELECT 
  'accounts' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id,
  COUNT(*) - COUNT(transaction_id) as records_without_transaction_id
FROM accounts;

-- Show sample transaction IDs to verify format
SELECT 
  'transactions' as table_name,
  transaction_id,
  description
FROM transactions 
WHERE transaction_id IS NOT NULL 
LIMIT 5

UNION ALL

SELECT 
  'purchases' as table_name,
  transaction_id,
  item_name as description
FROM purchases 
WHERE transaction_id IS NOT NULL 
LIMIT 5; 
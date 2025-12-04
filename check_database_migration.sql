-- Check if transaction_id columns exist in the database
-- Run this in Supabase SQL Editor to verify migration status

-- Check transactions table
SELECT 
  'transactions' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'transaction_id';

-- Check dps_transfers table
SELECT 
  'dps_transfers' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'dps_transfers' AND column_name = 'transaction_id';

-- Check accounts table
SELECT 
  'accounts' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'transaction_id';

-- Check if any transaction_id values exist
SELECT 
  'transactions' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id,
  COUNT(*) - COUNT(transaction_id) as records_without_transaction_id
FROM transactions

UNION ALL

SELECT 
  'dps_transfers' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id,
  COUNT(*) - COUNT(transaction_id) as records_without_transaction_id
FROM dps_transfers

UNION ALL

SELECT 
  'accounts' as table_name,
  COUNT(*) as total_records,
  COUNT(transaction_id) as records_with_transaction_id,
  COUNT(*) - COUNT(transaction_id) as records_without_transaction_id
FROM accounts; 
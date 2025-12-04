-- Verify that transaction_id columns exist with correct format
-- Run this in Supabase SQL Editor to check if migration was successful

-- Check if transaction_id columns exist in each table with correct data type
SELECT 
  'transactions' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'dps_transfers' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'dps_transfers' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'accounts' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchases' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'purchases' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchase_categories' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'purchase_categories' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'savings_goals' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'savings_goals' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'notifications' as table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name = 'transaction_id';

-- Check if indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE indexname LIKE '%transaction_id%';

-- Check sample transaction IDs to verify FF format
SELECT 
  'transactions' as table_name,
  transaction_id,
  COUNT(*) as count
FROM transactions 
WHERE transaction_id IS NOT NULL 
GROUP BY transaction_id 
LIMIT 5

UNION ALL

SELECT 
  'dps_transfers' as table_name,
  transaction_id,
  COUNT(*) as count
FROM dps_transfers 
WHERE transaction_id IS NOT NULL 
GROUP BY transaction_id 
LIMIT 5; 
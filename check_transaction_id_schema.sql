-- Check current transaction_id column data types
-- This will help identify the UUID/VARCHAR mismatch issue

SELECT 
  'transactions' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchases' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'accounts' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchase_categories' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_categories' AND column_name = 'transaction_id';

-- Check if there are any foreign key constraints on transaction_id
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND kcu.column_name = 'transaction_id';

-- Check sample data to see what format transaction_ids are in
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
FROM purchases; 
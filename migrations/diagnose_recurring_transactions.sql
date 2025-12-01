-- Diagnostic script to check why recurring transactions aren't getting first instances

-- Check the 13 recurring transactions in detail
SELECT 
  t.id,
  t.description,
  t.date as parent_date,
  t.user_id,
  t.account_id,
  t.type,
  t.category,
  t.recurring_frequency,
  t.occurrence_count,
  t.next_occurrence_date,
  t.is_paused,
  -- Check if account exists
  a.id as account_exists,
  -- Check if user exists (basic check)
  CASE WHEN t.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_user_id,
  -- Check for existing instances
  (SELECT COUNT(*) FROM transactions WHERE parent_recurring_id = t.id) as existing_instances,
  -- Check for instance with same date
  (SELECT COUNT(*) FROM transactions WHERE parent_recurring_id = t.id AND date = t.date) as instances_with_same_date
FROM transactions t
LEFT JOIN accounts a ON a.id = t.account_id
WHERE t.is_recurring = true
  AND t.occurrence_count = 0
  AND t.recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')
ORDER BY t.date;

-- Test creating one instance manually to see what error we get
-- (This will help identify the issue)
DO $$
DECLARE
  test_rec RECORD;
  test_instance_id UUID;
BEGIN
  -- Get first recurring transaction
  SELECT * INTO test_rec
  FROM transactions
  WHERE is_recurring = true
    AND occurrence_count = 0
    AND recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')
  LIMIT 1;
  
  IF test_rec.id IS NOT NULL THEN
    RAISE NOTICE 'Testing with transaction: % (description: %, date: %, user_id: %, account_id: %)', 
      test_rec.id, test_rec.description, test_rec.date, test_rec.user_id, test_rec.account_id;
    
    -- Try to create instance
    BEGIN
      INSERT INTO transactions (
        user_id,
        account_id,
        type,
        amount,
        description,
        category,
        date,
        tags,
        saving_amount,
        donation_amount,
        is_recurring,
        parent_recurring_id,
        transaction_id,
        created_at,
        updated_at
      ) VALUES (
        test_rec.user_id,
        test_rec.account_id,
        test_rec.type,
        0,
        COALESCE(test_rec.description, ''),
        COALESCE(test_rec.category, ''),
        test_rec.date,
        COALESCE(test_rec.tags, ARRAY[]::TEXT[]),
        0,
        0,
        false,
        test_rec.id,
        'TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
        NOW(),
        NOW()
      ) RETURNING id INTO test_instance_id;
      
      RAISE NOTICE 'SUCCESS: Created test instance with id: %', test_instance_id;
      
      -- Clean up test instance
      DELETE FROM transactions WHERE id = test_instance_id;
      RAISE NOTICE 'Cleaned up test instance';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'ERROR creating test instance: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    END;
  ELSE
    RAISE NOTICE 'No recurring transactions found to test';
  END IF;
END $$;


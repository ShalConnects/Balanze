-- Force migration: Create first instances without checking if they exist
-- Use this if the diagnostic shows no existing instances

DO $$
DECLARE
  recurring_rec RECORD;
  first_instance_id UUID;
  calculated_next_date DATE;
  success_count INT := 0;
  error_count INT := 0;
BEGIN
  FOR recurring_rec IN
    SELECT 
      t.id,
      t.user_id,
      t.account_id,
      t.type,
      t.description,
      t.category,
      t.date,
      t.tags,
      t.recurring_frequency
    FROM transactions t
    WHERE t.is_recurring = true
      AND t.occurrence_count = 0
      AND t.recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')
    ORDER BY t.date
  LOOP
    BEGIN
      -- Calculate next occurrence date
      calculated_next_date := calculate_next_occurrence(
        recurring_rec.date,
        recurring_rec.recurring_frequency
      );
      
      -- Create first instance (force create, ignore duplicates)
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
        recurring_rec.user_id,
        recurring_rec.account_id,
        recurring_rec.type,
        0,
        COALESCE(recurring_rec.description, ''),
        COALESCE(recurring_rec.category, ''),
        recurring_rec.date,
        COALESCE(recurring_rec.tags, ARRAY[]::TEXT[]),
        0,
        0,
        false,
        recurring_rec.id,
        'TR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8)),
        NOW(),
        NOW()
      ) ON CONFLICT DO NOTHING
      RETURNING id INTO first_instance_id;
      
      -- Only update parent if instance was created
      IF first_instance_id IS NOT NULL THEN
        UPDATE transactions
        SET 
          occurrence_count = 1,
          next_occurrence_date = calculated_next_date,
          updated_at = NOW()
        WHERE id = recurring_rec.id;
        
        success_count := success_count + 1;
        RAISE NOTICE 'Created first instance for transaction %', recurring_rec.id;
      ELSE
        -- Instance already exists, just update occurrence_count
        UPDATE transactions
        SET 
          occurrence_count = 1,
          updated_at = NOW()
        WHERE id = recurring_rec.id
          AND occurrence_count = 0;
        
        RAISE NOTICE 'Instance already exists for transaction %, updated occurrence_count', recurring_rec.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'ERROR for transaction %: %', recurring_rec.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Force migration completed: % successful, % errors', success_count, error_count;
END $$;

-- Summary
SELECT 
  'Force migration completed' as status,
  COUNT(*) FILTER (WHERE is_recurring = true AND occurrence_count > 0) as recurring_with_instances,
  COUNT(*) FILTER (WHERE is_recurring = true AND occurrence_count = 0) as recurring_without_instances
FROM transactions;


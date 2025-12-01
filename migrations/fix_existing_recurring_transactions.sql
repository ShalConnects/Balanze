-- Migration script to fix existing recurring transactions
-- Creates the first instance for recurring transactions with occurrence_count = 0
-- Sets amount to 0 for new instances

-- Function to generate transaction ID (similar to frontend logic)
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next occurrence date (matches frontend logic)
CREATE OR REPLACE FUNCTION calculate_next_occurrence(input_date DATE, frequency TEXT)
RETURNS DATE AS $$
DECLARE
  result_date DATE;
  original_day INT;
  original_month INT;
BEGIN
  result_date := input_date;
  original_day := EXTRACT(DAY FROM input_date);
  original_month := EXTRACT(MONTH FROM input_date);
  
  CASE frequency
    WHEN 'daily' THEN
      result_date := input_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      result_date := input_date + INTERVAL '7 days';
    WHEN 'monthly' THEN
      result_date := input_date + INTERVAL '1 month';
      -- If day doesn't exist in new month, adjust to last day of month
      IF EXTRACT(DAY FROM result_date) != original_day THEN
        result_date := (DATE_TRUNC('month', result_date) + INTERVAL '1 month - 1 day')::DATE;
      END IF;
    WHEN 'yearly' THEN
      result_date := input_date + INTERVAL '1 year';
      -- Handle Feb 29 -> Feb 28 in non-leap years
      IF original_month = 2 AND original_day = 29 AND EXTRACT(MONTH FROM result_date) = 3 THEN
        result_date := (DATE_TRUNC('year', result_date) + INTERVAL '2 months - 1 day')::DATE;
      END IF;
    ELSE
      RETURN input_date;
  END CASE;
  
  RETURN result_date;
END;
$$ LANGUAGE plpgsql;

-- Main migration: Create first instance for recurring transactions with occurrence_count = 0
DO $$
DECLARE
  recurring_rec RECORD;
  first_instance_id UUID;
  first_instance_transaction_id TEXT;
  calculated_next_date DATE;
BEGIN
  -- Loop through all recurring transactions with occurrence_count = 0
  FOR recurring_rec IN
    SELECT 
      id,
      user_id,
      account_id,
      type,
      description,
      category,
      date,
      tags,
      recurring_frequency,
      transactions.next_occurrence_date as current_next_occurrence
    FROM transactions
    WHERE is_recurring = true
      AND occurrence_count = 0
      AND recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')
  LOOP
    BEGIN
      -- Check if first instance already exists (by date)
      IF NOT EXISTS (
        SELECT 1 
        FROM transactions 
        WHERE parent_recurring_id = recurring_rec.id 
          AND date = recurring_rec.date
      ) THEN
        -- Generate transaction ID for first instance
        first_instance_transaction_id := generate_transaction_id();
        
        -- Create first instance with amount: 0
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
          0, -- Start with 0, user can edit
          recurring_rec.description,
          recurring_rec.category,
          recurring_rec.date, -- Use parent's transaction date
          COALESCE(recurring_rec.tags, ARRAY[]::TEXT[]),
          0, -- Start with 0
          0, -- Start with 0
          false, -- Instance is not recurring
          recurring_rec.id,
          first_instance_transaction_id,
          NOW(),
          NOW()
        ) RETURNING id INTO first_instance_id;
        
        -- Calculate next occurrence date from parent's transaction date
        calculated_next_date := calculate_next_occurrence(
          recurring_rec.date,
          recurring_rec.recurring_frequency
        );
        
        -- Update parent transaction: set occurrence_count to 1 and update next_occurrence_date
        UPDATE transactions
        SET 
          occurrence_count = 1,
          next_occurrence_date = calculated_next_date,
          updated_at = NOW()
        WHERE id = recurring_rec.id;
        
        RAISE NOTICE 'Created first instance for recurring transaction % (parent date: %, next occurrence: %)', 
          recurring_rec.id, recurring_rec.date, calculated_next_date;
      ELSE
        RAISE NOTICE 'First instance already exists for recurring transaction %', recurring_rec.id;
        
        -- Still update occurrence_count if it's 0
        UPDATE transactions
        SET 
          occurrence_count = 1,
          updated_at = NOW()
        WHERE id = recurring_rec.id
          AND occurrence_count = 0;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error processing recurring transaction %: %', recurring_rec.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- Clean up helper functions (optional - comment out if you want to keep them)
-- DROP FUNCTION IF EXISTS generate_transaction_id();
-- DROP FUNCTION IF EXISTS calculate_next_occurrence(DATE, TEXT);

-- Summary
SELECT 
  'Migration completed' as status,
  COUNT(*) FILTER (WHERE is_recurring = true AND occurrence_count > 0) as recurring_with_instances,
  COUNT(*) FILTER (WHERE is_recurring = true AND occurrence_count = 0) as recurring_without_instances
FROM transactions;

-- Diagnostic: Check why instances weren't created
-- This will show recurring transactions with occurrence_count = 0 and whether they have child instances
SELECT 
  t.id as parent_id,
  t.description,
  t.date as parent_date,
  t.occurrence_count,
  t.next_occurrence_date,
  COUNT(child.id) as child_instance_count,
  MIN(child.date) as first_child_date,
  MAX(child.date) as last_child_date
FROM transactions t
LEFT JOIN transactions child ON child.parent_recurring_id = t.id
WHERE t.is_recurring = true
  AND t.occurrence_count = 0
GROUP BY t.id, t.description, t.date, t.occurrence_count, t.next_occurrence_date
ORDER BY t.date;


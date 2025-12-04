-- Simple direct fix: Create first instances for recurring transactions
-- This script directly inserts instances without complex checks

-- Ensure helper functions exist
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
      IF EXTRACT(DAY FROM result_date) != original_day THEN
        result_date := (DATE_TRUNC('month', result_date) + INTERVAL '1 month - 1 day')::DATE;
      END IF;
    WHEN 'yearly' THEN
      result_date := input_date + INTERVAL '1 year';
      IF original_month = 2 AND original_day = 29 AND EXTRACT(MONTH FROM result_date) = 3 THEN
        result_date := (DATE_TRUNC('year', result_date) + INTERVAL '2 months - 1 day')::DATE;
      END IF;
    ELSE
      RETURN input_date;
  END CASE;
  
  RETURN result_date;
END;
$$ LANGUAGE plpgsql;

-- Direct INSERT for all 13 transactions
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
)
SELECT 
  t.user_id,
  t.account_id,
  t.type,
  0 as amount,
  COALESCE(t.description, ''),
  COALESCE(t.category, ''),
  t.date,
  COALESCE(t.tags, ARRAY[]::TEXT[]),
  0 as saving_amount,
  0 as donation_amount,
  false as is_recurring,
  t.id as parent_recurring_id,
  'F' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0') as transaction_id,
  NOW() as created_at,
  NOW() as updated_at
FROM transactions t
WHERE t.is_recurring = true
  AND t.occurrence_count = 0
  AND t.recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')
  AND NOT EXISTS (
    SELECT 1 
    FROM transactions child 
    WHERE child.parent_recurring_id = t.id 
      AND child.date = t.date
  );

-- Update parent transactions
UPDATE transactions t
SET 
  occurrence_count = 1,
  next_occurrence_date = calculate_next_occurrence(t.date, t.recurring_frequency),
  updated_at = NOW()
WHERE t.is_recurring = true
  AND t.occurrence_count = 0
  AND t.recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')
  AND EXISTS (
    SELECT 1 
    FROM transactions child 
    WHERE child.parent_recurring_id = t.id 
      AND child.date = t.date
  );

-- Summary
SELECT 
  'Simple migration completed' as status,
  COUNT(*) FILTER (WHERE is_recurring = true AND occurrence_count > 0) as recurring_with_instances,
  COUNT(*) FILTER (WHERE is_recurring = true AND occurrence_count = 0) as recurring_without_instances,
  (SELECT COUNT(*) FROM transactions WHERE parent_recurring_id IS NOT NULL) as total_instances_created
FROM transactions;


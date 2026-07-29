-- Remediation after excluding recurring templates from account_balances.
-- Old model: parent template amount counted in balance; first child was often amount=0.
-- After the view change, that first occurrence vanished from balances.
-- This backfill restores money onto real child instances only (templates stay excluded).

-- 1) Zero-amount placeholder children on the parent's date → copy template amounts
UPDATE transactions AS child
SET
  amount = parent.amount,
  saving_amount = COALESCE(parent.saving_amount, child.saving_amount, 0),
  updated_at = NOW()
FROM transactions AS parent
WHERE child.parent_recurring_id = parent.id
  AND parent.is_recurring IS TRUE
  AND COALESCE(child.is_recurring, false) IS FALSE
  AND COALESCE(child.amount, 0) = 0
  AND COALESCE(parent.amount, 0) <> 0
  AND child.date = parent.date;

-- 2) Recurring parents with money but no child instances → create the first real instance
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
  p.user_id,
  p.account_id,
  p.type,
  p.amount,
  COALESCE(p.description, ''),
  COALESCE(p.category, ''),
  p.date,
  COALESCE(p.tags, ARRAY[]::TEXT[]),
  COALESCE(p.saving_amount, 0),
  0,
  false,
  p.id,
  'F' || LPAD((FLOOR(RANDOM() * 10000000))::TEXT, 7, '0'),
  COALESCE(p.created_at, NOW()),
  NOW()
FROM transactions p
WHERE p.is_recurring IS TRUE
  AND COALESCE(p.amount, 0) <> 0
  AND NOT EXISTS (
    SELECT 1 FROM transactions c WHERE c.parent_recurring_id = p.id
  );

-- 3) Align occurrence_count when parents now have instances but count is still 0
UPDATE transactions p
SET
  occurrence_count = GREATEST(COALESCE(p.occurrence_count, 0), 1),
  updated_at = NOW()
WHERE p.is_recurring IS TRUE
  AND EXISTS (SELECT 1 FROM transactions c WHERE c.parent_recurring_id = p.id)
  AND COALESCE(p.occurrence_count, 0) = 0;

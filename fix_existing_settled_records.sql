-- Fix existing fully returned records that aren't marked as settled
-- This script finds lend_borrow records where the total returned amount
-- equals or exceeds the original amount, but the status is still 'active' or 'overdue'
-- and updates them to 'settled'
--
-- SAFE: This only updates records that are already fully paid, just missing the status update

-- Step 1: Show records that will be fixed (for verification)
SELECT 
    lb.id,
    lb.person_name,
    lb.type,
    lb.amount as original_amount,
    COALESCE(SUM(lbr.amount), 0) as total_returned,
    lb.amount - COALESCE(SUM(lbr.amount), 0) as remaining_amount,
    lb.status as current_status,
    'settled' as new_status
FROM lend_borrow lb
LEFT JOIN lend_borrow_returns lbr ON lb.id = lbr.lend_borrow_id
WHERE lb.status != 'settled'  -- Only check non-settled records
GROUP BY lb.id, lb.person_name, lb.type, lb.amount, lb.status
HAVING COALESCE(SUM(lbr.amount), 0) >= lb.amount  -- Fully returned
ORDER BY lb.created_at DESC;

-- Step 2: Update records that are fully returned but not marked as settled
UPDATE lend_borrow lb
SET 
    status = 'settled',
    updated_at = NOW()
WHERE lb.id IN (
    SELECT lb2.id
    FROM lend_borrow lb2
    LEFT JOIN lend_borrow_returns lbr ON lb2.id = lbr.lend_borrow_id
    WHERE lb2.status != 'settled'  -- Only update non-settled records
    GROUP BY lb2.id, lb2.amount
    HAVING COALESCE(SUM(lbr.amount), 0) >= lb2.amount  -- Fully returned
);

-- Step 3: Show summary of what was fixed
SELECT 
    COUNT(*) as records_fixed,
    'Records updated from active/overdue to settled' as description
FROM lend_borrow lb
LEFT JOIN lend_borrow_returns lbr ON lb.id = lbr.lend_borrow_id
WHERE lb.status = 'settled'
GROUP BY lb.id, lb.amount
HAVING COALESCE(SUM(lbr.amount), 0) >= lb.amount;

-- Step 4: Verify the fix - show any remaining issues
SELECT 
    'Verification: Records that are fully returned but still not settled' as check_type,
    COUNT(*) as count
FROM (
    SELECT lb.id
    FROM lend_borrow lb
    LEFT JOIN lend_borrow_returns lbr ON lb.id = lbr.lend_borrow_id
    WHERE lb.status != 'settled'
    GROUP BY lb.id, lb.amount
    HAVING COALESCE(SUM(lbr.amount), 0) >= lb.amount
) as fully_returned_not_settled;

-- If count is 0, all fully returned records are now settled ✅


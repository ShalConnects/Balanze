-- Rollback script for lend/borrow accounts implementation
-- Run this in your Supabase SQL Editor to revert any changes
-- This is safe to run even if no changes were made

-- WARNING: This will remove the lend/borrow account functionality
-- Make sure you have a backup before running this

-- 1. Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_lend_borrow_account_balance ON lend_borrow;

-- 2. Drop the functions if they exist
DROP FUNCTION IF EXISTS update_lend_borrow_account_balance();
DROP FUNCTION IF EXISTS calculate_lend_borrow_balance(UUID);

-- 3. Drop the view if it exists
DROP VIEW IF EXISTS lend_borrow_accounts;

-- 4. Check if account_id column exists before trying to use it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lend_borrow' 
        AND column_name = 'account_id'
    ) THEN
        -- Update lend/borrow records to remove account_id references
        UPDATE lend_borrow SET account_id = NULL WHERE account_id IS NOT NULL;
        RAISE NOTICE 'Updated lend_borrow records to remove account_id references';
    ELSE
        RAISE NOTICE 'account_id column does not exist in lend_borrow table';
    END IF;
END $$;

-- 5. Remove the new columns from lend_borrow table if they exist
ALTER TABLE lend_borrow DROP COLUMN IF EXISTS transaction_id;
ALTER TABLE lend_borrow DROP COLUMN IF EXISTS account_id;

-- 6. Now safely delete any lend/borrow accounts that exist
DELETE FROM accounts WHERE type = 'lend_borrow';

-- 7. Now safely remove lend_borrow from account types constraint
DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_type_check' 
        AND table_name = 'accounts'
    ) THEN
        ALTER TABLE accounts DROP CONSTRAINT accounts_type_check;
        
        -- Recreate the constraint without 'lend_borrow'
        ALTER TABLE accounts ADD CONSTRAINT accounts_type_check 
            CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash'));
            
        RAISE NOTICE 'Removed lend_borrow from account types constraint';
    ELSE
        RAISE NOTICE 'accounts_type_check constraint not found';
    END IF;
END $$;

-- 8. Verify rollback
SELECT 
    'Rollback verification' as check_type,
    COUNT(*) as lend_borrow_accounts_remaining
FROM accounts 
WHERE type = 'lend_borrow';

SELECT 
    'Account types after rollback' as check_type,
    string_agg(DISTINCT type, ', ') as available_types
FROM accounts;

-- 9. Check if any lend/borrow records exist (should show total count)
SELECT 
    'Lend/borrow records check' as check_type,
    COUNT(*) as total_records
FROM lend_borrow;

-- 10. Check if any account-related functions remain
SELECT 
    'Remaining account-related functions' as check_type,
    routine_name
FROM information_schema.routines 
WHERE routine_name LIKE '%lend_borrow_account%';

-- 11. Check if any account-related triggers remain
SELECT 
    'Remaining account-related triggers' as check_type,
    trigger_name
FROM information_schema.triggers 
WHERE trigger_name LIKE '%lend_borrow_account%';

-- Note: The lend_borrow table and records will remain intact
-- Only the account-based functionality will be removed 
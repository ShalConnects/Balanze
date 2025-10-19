-- MIGRATION SCRIPT FOR EXISTING LEND/BORROW RECORDS WITH TOGGLE OPTION
-- This script allows users to choose whether existing records should affect account balance

-- Step 1: Create backup of existing data
CREATE TABLE IF NOT EXISTS lend_borrow_backup_toggle AS 
SELECT * FROM lend_borrow;

-- Step 2: Function to migrate existing records with user choice
CREATE OR REPLACE FUNCTION migrate_existing_lend_borrow_with_toggle(
    affect_balance BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    user_id UUID,
    records_migrated INTEGER,
    transactions_created INTEGER,
    status TEXT
) AS $$
DECLARE
    user_record RECORD;
    account_record RECORD;
    lend_borrow_record RECORD;
    transaction_id TEXT;
    records_updated INTEGER;
    transactions_created INTEGER;
BEGIN
    -- Loop through each user with lend/borrow records
    FOR user_record IN 
        SELECT DISTINCT user_id FROM lend_borrow WHERE account_id IS NULL
    LOOP
        records_updated := 0;
        transactions_created := 0;
        
        -- Find user's primary account (first account in their list)
        SELECT * INTO account_record 
        FROM accounts 
        WHERE user_id = user_record.user_id 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF account_record IS NULL THEN
            -- No account found for this user
            RETURN QUERY SELECT 
                user_record.user_id, 
                0, 
                0, 
                'No account found - skipped';
            CONTINUE;
        END IF;
        
        -- Update all lend/borrow records for this user
        UPDATE lend_borrow 
        SET 
            account_id = CASE WHEN affect_balance THEN account_record.id ELSE NULL END,
            affect_account_balance = affect_balance
        WHERE user_id = user_record.user_id AND account_id IS NULL;
        
        GET DIAGNOSTICS records_updated = ROW_COUNT;
        
        -- Only create retroactive transactions if affect_balance is true
        IF affect_balance THEN
            -- Create retroactive transactions for existing records
            FOR lend_borrow_record IN 
                SELECT * FROM lend_borrow 
                WHERE user_id = user_record.user_id 
                AND account_id = account_record.id
                AND transaction_id IS NULL
            LOOP
                -- Generate transaction ID
                transaction_id := 'LB-RETRO-' || EXTRACT(EPOCH FROM lend_borrow_record.created_at)::TEXT || '-' || SUBSTRING(lend_borrow_record.id::TEXT, 1, 8);
                
                -- Create transaction based on type
                IF lend_borrow_record.type = 'lend' THEN
                    -- Lending money = expense (money going out)
                    INSERT INTO transactions (
                        user_id, account_id, amount, type, description, date, category, tags, transaction_id
                    ) VALUES (
                        lend_borrow_record.user_id,
                        lend_borrow_record.account_id,
                        -lend_borrow_record.amount, -- Negative for expense
                        'expense',
                        'Lent to ' || lend_borrow_record.person_name,
                        lend_borrow_record.created_at,
                        'Lend & Borrow',
                        ARRAY['lend_borrow', lend_borrow_record.id::TEXT, lend_borrow_record.type, 'retroactive'],
                        transaction_id
                    );
                    
                    -- Update account balance
                    UPDATE accounts 
                    SET calculated_balance = calculated_balance - lend_borrow_record.amount 
                    WHERE id = lend_borrow_record.account_id;
                    
                ELSIF lend_borrow_record.type = 'borrow' THEN
                    -- Borrowing money = income (money coming in)
                    INSERT INTO transactions (
                        user_id, account_id, amount, type, description, date, category, tags, transaction_id
                    ) VALUES (
                        lend_borrow_record.user_id,
                        lend_borrow_record.account_id,
                        lend_borrow_record.amount, -- Positive for income
                        'income',
                        'Borrowed from ' || lend_borrow_record.person_name,
                        lend_borrow_record.created_at,
                        'Lend & Borrow',
                        ARRAY['lend_borrow', lend_borrow_record.id::TEXT, lend_borrow_record.type, 'retroactive'],
                        transaction_id
                    );
                    
                    -- Update account balance
                    UPDATE accounts 
                    SET calculated_balance = calculated_balance + lend_borrow_record.amount 
                    WHERE id = lend_borrow_record.account_id;
                END IF;
                
                -- Store transaction ID in lend_borrow record
                UPDATE lend_borrow 
                SET transaction_id = transaction_id 
                WHERE id = lend_borrow_record.id;
                
                transactions_created := transactions_created + 1;
                
                -- If the loan is already settled, create repayment transaction
                IF lend_borrow_record.status = 'settled' THEN
                    -- Generate repayment transaction ID
                    transaction_id := 'LB-REPAY-RETRO-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || SUBSTRING(lend_borrow_record.id::TEXT, 1, 8);
                    
                    -- Create repayment transaction (opposite of original)
                    IF lend_borrow_record.type = 'lend' THEN
                        -- Loan repayment = income (money coming back)
                        INSERT INTO transactions (
                            user_id, account_id, amount, type, description, date, category, tags, transaction_id
                        ) VALUES (
                            lend_borrow_record.user_id,
                            lend_borrow_record.account_id,
                            lend_borrow_record.amount, -- Positive for income
                            'income',
                            'Loan repayment from ' || lend_borrow_record.person_name,
                            lend_borrow_record.updated_at, -- Use updated_at as repayment date
                            'Lend & Borrow',
                            ARRAY['lend_borrow', lend_borrow_record.id::TEXT, 'repayment', 'retroactive'],
                            transaction_id
                        );
                        
                        -- Update account balance
                        UPDATE accounts 
                        SET calculated_balance = calculated_balance + lend_borrow_record.amount 
                        WHERE id = lend_borrow_record.account_id;
                        
                    ELSIF lend_borrow_record.type = 'borrow' THEN
                        -- Debt repayment = expense (money going out)
                        INSERT INTO transactions (
                            user_id, account_id, amount, type, description, date, category, tags, transaction_id
                        ) VALUES (
                            lend_borrow_record.user_id,
                            lend_borrow_record.account_id,
                            -lend_borrow_record.amount, -- Negative for expense
                            'expense',
                            'Debt repayment to ' || lend_borrow_record.person_name,
                            lend_borrow_record.updated_at, -- Use updated_at as repayment date
                            'Lend & Borrow',
                            ARRAY['lend_borrow', lend_borrow_record.id::TEXT, 'repayment', 'retroactive'],
                            transaction_id
                        );
                        
                        -- Update account balance
                        UPDATE accounts 
                        SET calculated_balance = calculated_balance - lend_borrow_record.amount 
                        WHERE id = lend_borrow_record.account_id;
                    END IF;
                    
                    -- Store repayment transaction ID
                    UPDATE lend_borrow 
                    SET repayment_transaction_id = transaction_id 
                    WHERE id = lend_borrow_record.id;
                    
                    transactions_created := transactions_created + 1;
                END IF;
            END LOOP;
        END IF;
        
        -- Return results for this user
        RETURN QUERY SELECT 
            user_record.user_id, 
            records_updated, 
            transactions_created, 
            'Success';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Migration options
-- Option A: Migrate all records to affect account balance (default behavior)
-- SELECT * FROM migrate_existing_lend_borrow_with_toggle(TRUE);

-- Option B: Migrate all records to NOT affect account balance (standalone)
-- SELECT * FROM migrate_existing_lend_borrow_with_toggle(FALSE);

-- Step 4: Verify migration results
DO $$
DECLARE
    total_records INTEGER;
    records_with_accounts INTEGER;
    records_with_transactions INTEGER;
    records_affecting_balance INTEGER;
    records_standalone INTEGER;
    total_transactions INTEGER;
BEGIN
    -- Count total lend/borrow records
    SELECT COUNT(*) INTO total_records FROM lend_borrow;
    
    -- Count records with accounts
    SELECT COUNT(*) INTO records_with_accounts 
    FROM lend_borrow WHERE account_id IS NOT NULL;
    
    -- Count records with transactions
    SELECT COUNT(*) INTO records_with_transactions 
    FROM lend_borrow WHERE transaction_id IS NOT NULL;
    
    -- Count records affecting balance
    SELECT COUNT(*) INTO records_affecting_balance 
    FROM lend_borrow WHERE affect_account_balance = TRUE;
    
    -- Count standalone records
    SELECT COUNT(*) INTO records_standalone 
    FROM lend_borrow WHERE affect_account_balance = FALSE;
    
    -- Count total transactions created
    SELECT COUNT(*) INTO total_transactions 
    FROM transactions WHERE 'lend_borrow' = ANY(tags);
    
    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE 'Total lend/borrow records: %', total_records;
    RAISE NOTICE 'Records with accounts: %', records_with_accounts;
    RAISE NOTICE 'Records with transactions: %', records_with_transactions;
    RAISE NOTICE 'Records affecting balance: %', records_affecting_balance;
    RAISE NOTICE 'Standalone records: %', records_standalone;
    RAISE NOTICE 'Total transactions created: %', total_transactions;
    
    IF records_with_accounts = records_affecting_balance THEN
        RAISE NOTICE '✅ All records affecting balance have accounts assigned';
    ELSE
        RAISE NOTICE '❌ Some records affecting balance are missing accounts';
    END IF;
    
    IF records_with_transactions = records_affecting_balance THEN
        RAISE NOTICE '✅ All records affecting balance have transactions created';
    ELSE
        RAISE NOTICE '❌ Some records affecting balance are missing transactions';
    END IF;
END $$;

-- Step 5: Clean up
DROP FUNCTION IF EXISTS migrate_existing_lend_borrow_with_toggle(BOOLEAN);

-- Step 6: Final status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migration completed successfully!';
    RAISE NOTICE 'Existing lend/borrow records now have:';
    RAISE NOTICE '- Toggle setting for account balance effect';
    RAISE NOTICE '- Account assignments (if affecting balance)';
    RAISE NOTICE '- Retroactive transactions (if affecting balance)';
    RAISE NOTICE '- Updated account balances (if affecting balance)';
    RAISE NOTICE '- Repayment transactions for settled loans (if affecting balance)';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can now choose whether their lend/borrow records affect their account balance!';
END $$;

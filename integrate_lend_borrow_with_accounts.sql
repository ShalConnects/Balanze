-- Integrate lend_borrow with accounts and transactions
-- This migration adds account integration to the lend_borrow system

-- Step 1: Add new columns to lend_borrow table
ALTER TABLE lend_borrow 
ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
ADD COLUMN transaction_id TEXT,
ADD COLUMN repayment_transaction_id TEXT,
ADD COLUMN interest_transaction_id TEXT,
ADD COLUMN affect_account_balance BOOLEAN DEFAULT TRUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lend_borrow_account_id ON lend_borrow(account_id);
CREATE INDEX IF NOT EXISTS idx_lend_borrow_transaction_id ON lend_borrow(transaction_id);
CREATE INDEX IF NOT EXISTS idx_lend_borrow_repayment_transaction_id ON lend_borrow(repayment_transaction_id);

-- Step 2: Create function to handle lend/borrow transactions
CREATE OR REPLACE FUNCTION create_lend_borrow_transaction()
RETURNS TRIGGER AS $$
DECLARE
    transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only create transactions if affect_account_balance is true
    IF NEW.affect_account_balance = FALSE THEN
        RETURN NEW;
    END IF;
    
    -- Generate transaction ID (shorter format)
    transaction_id := 'LB-' || SUBSTRING(NEW.id::TEXT, 1, 8) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Get account details
    SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
    
    IF account_record IS NULL THEN
        RAISE EXCEPTION 'Account not found for lend/borrow record';
    END IF;
    
    -- Create transaction based on type
    IF NEW.type = 'lend' THEN
        -- Lending money = expense (money going out)
        INSERT INTO transactions (
            user_id, account_id, amount, type, description, date, category, tags, transaction_id
        ) VALUES (
            NEW.user_id,
            NEW.account_id,
            -NEW.amount, -- Negative for expense
            'expense',
            'Lent to ' || NEW.person_name,
            NEW.created_at,
            'Lend & Borrow',
            ARRAY['lend_borrow', NEW.id::TEXT, NEW.type],
            transaction_id
        );
        
        -- Update account balance
        UPDATE accounts 
        SET calculated_balance = calculated_balance - NEW.amount 
        WHERE id = NEW.account_id;
        
    ELSIF NEW.type = 'borrow' THEN
        -- Borrowing money = income (money coming in)
        INSERT INTO transactions (
            user_id, account_id, amount, type, description, date, category, tags, transaction_id
        ) VALUES (
            NEW.user_id,
            NEW.account_id,
            NEW.amount, -- Positive for income
            'income',
            'Borrowed from ' || NEW.person_name,
            NEW.created_at,
            'Lend & Borrow',
            ARRAY['lend_borrow', NEW.id::TEXT, NEW.type],
            transaction_id
        );
        
        -- Update account balance
        UPDATE accounts 
        SET calculated_balance = calculated_balance + NEW.amount 
        WHERE id = NEW.account_id;
    END IF;
    
    -- Store transaction ID in lend_borrow record
    NEW.transaction_id := transaction_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger for new lend/borrow records
CREATE TRIGGER trigger_create_lend_borrow_transaction
    AFTER INSERT ON lend_borrow
    FOR EACH ROW
    WHEN (NEW.account_id IS NOT NULL)
    EXECUTE FUNCTION create_lend_borrow_transaction();

-- Step 4: Create function to handle loan settlements
CREATE OR REPLACE FUNCTION settle_lend_borrow_loan()
RETURNS TRIGGER AS $$
DECLARE
    repayment_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only process if status changed to 'settled' and we have a transaction and affect_account_balance is true
    IF NEW.status = 'settled' AND OLD.status != 'settled' AND NEW.transaction_id IS NOT NULL AND NEW.affect_account_balance = TRUE THEN
        
        -- Generate repayment transaction ID (shorter format)
        repayment_transaction_id := 'LB-R-' || SUBSTRING(NEW.id::TEXT, 1, 8) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
        
        -- Get account details
        SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
        
        IF account_record IS NULL THEN
            RAISE EXCEPTION 'Account not found for loan settlement';
        END IF;
        
        -- Create repayment transaction (opposite of original)
        IF NEW.type = 'lend' THEN
            -- Loan repayment = income (money coming back)
            INSERT INTO transactions (
                user_id, account_id, amount, type, description, date, category, tags, transaction_id
            ) VALUES (
                NEW.user_id,
                NEW.account_id,
                NEW.amount, -- Positive for income
                'income',
                'Loan repayment from ' || NEW.person_name,
                NOW(),
                'Lend & Borrow',
                ARRAY['lend_borrow', NEW.id::TEXT, 'repayment'],
                repayment_transaction_id
            );
            
            -- Update account balance
            UPDATE accounts 
            SET calculated_balance = calculated_balance + NEW.amount 
            WHERE id = NEW.account_id;
            
        ELSIF NEW.type = 'borrow' THEN
            -- Debt repayment = expense (money going out)
            INSERT INTO transactions (
                user_id, account_id, amount, type, description, date, category, tags, transaction_id
            ) VALUES (
                NEW.user_id,
                NEW.account_id,
                -NEW.amount, -- Negative for expense
                'expense',
                'Debt repayment to ' || NEW.person_name,
                NOW(),
                'Lend & Borrow',
                ARRAY['lend_borrow', NEW.id::TEXT, 'repayment'],
                repayment_transaction_id
            );
            
            -- Update account balance
            UPDATE accounts 
            SET calculated_balance = calculated_balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        
        -- Store repayment transaction ID
        NEW.repayment_transaction_id := repayment_transaction_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for loan settlements
CREATE TRIGGER trigger_settle_lend_borrow_loan
    AFTER UPDATE ON lend_borrow
    FOR EACH ROW
    WHEN (NEW.status = 'settled' AND OLD.status != 'settled')
    EXECUTE FUNCTION settle_lend_borrow_loan();

-- Step 6: Create function to handle partial returns
CREATE OR REPLACE FUNCTION handle_partial_return()
RETURNS TRIGGER AS $$
DECLARE
    partial_transaction_id TEXT;
    account_record RECORD;
BEGIN
    -- Only process if partial_return_amount is set and greater than 0 and affect_account_balance is true
    IF NEW.partial_return_amount IS NOT NULL AND NEW.partial_return_amount > 0 AND NEW.affect_account_balance = TRUE THEN
        
        -- Generate partial return transaction ID (shorter format)
        partial_transaction_id := 'LB-P-' || SUBSTRING(NEW.id::TEXT, 1, 8) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
        
        -- Get account details
        SELECT * INTO account_record FROM accounts WHERE id = NEW.account_id;
        
        IF account_record IS NULL THEN
            RAISE EXCEPTION 'Account not found for partial return';
        END IF;
        
        -- Create partial return transaction
        IF NEW.type = 'lend' THEN
            -- Partial loan repayment = income
            INSERT INTO transactions (
                user_id, account_id, amount, type, description, date, category, tags, transaction_id
            ) VALUES (
                NEW.user_id,
                NEW.account_id,
                NEW.partial_return_amount,
                'income',
                'Partial loan repayment from ' || NEW.person_name || ' (' || NEW.partial_return_amount || ')',
                COALESCE(NEW.partial_return_date::TIMESTAMP, NOW()),
                'Lend & Borrow',
                ARRAY['lend_borrow', NEW.id::TEXT, 'partial_repayment'],
                partial_transaction_id
            );
            
            -- Update account balance
            UPDATE accounts 
            SET calculated_balance = calculated_balance + NEW.partial_return_amount 
            WHERE id = NEW.account_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for partial returns
CREATE TRIGGER trigger_handle_partial_return
    AFTER UPDATE ON lend_borrow
    FOR EACH ROW
    WHEN (NEW.partial_return_amount IS NOT NULL AND NEW.partial_return_amount > 0)
    EXECUTE FUNCTION handle_partial_return();

-- Step 8: Create rollback function (for safety)
CREATE OR REPLACE FUNCTION rollback_lend_borrow_integration()
RETURNS VOID AS $$
BEGIN
    -- Drop triggers
    DROP TRIGGER IF EXISTS trigger_create_lend_borrow_transaction ON lend_borrow;
    DROP TRIGGER IF EXISTS trigger_settle_lend_borrow_loan ON lend_borrow;
    DROP TRIGGER IF EXISTS trigger_handle_partial_return ON lend_borrow;
    
    -- Drop functions
    DROP FUNCTION IF EXISTS create_lend_borrow_transaction();
    DROP FUNCTION IF EXISTS settle_lend_borrow_loan();
    DROP FUNCTION IF EXISTS handle_partial_return();
    
    -- Remove columns (optional - comment out if you want to keep the columns)
    -- ALTER TABLE lend_borrow DROP COLUMN IF EXISTS account_id;
    -- ALTER TABLE lend_borrow DROP COLUMN IF EXISTS transaction_id;
    -- ALTER TABLE lend_borrow DROP COLUMN IF EXISTS repayment_transaction_id;
    -- ALTER TABLE lend_borrow DROP COLUMN IF EXISTS interest_transaction_id;
    
    RAISE NOTICE 'Lend/borrow integration rolled back successfully';
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create migration script for existing records
CREATE OR REPLACE FUNCTION migrate_existing_lend_borrow_records()
RETURNS VOID AS $$
DECLARE
    record RECORD;
    default_account_id UUID;
BEGIN
    -- Get user's default account (first account in their list)
    FOR record IN 
        SELECT DISTINCT user_id FROM lend_borrow WHERE account_id IS NULL
    LOOP
        -- Find user's first account
        SELECT id INTO default_account_id 
        FROM accounts 
        WHERE user_id = record.user_id 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- Update lend_borrow records for this user
        IF default_account_id IS NOT NULL THEN
            UPDATE lend_borrow 
            SET account_id = default_account_id 
            WHERE user_id = record.user_id AND account_id IS NULL;
            
            RAISE NOTICE 'Migrated lend/borrow records for user % to account %', record.user_id, default_account_id;
        ELSE
            RAISE WARNING 'No account found for user %, skipping migration', record.user_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed';
END;
$$ LANGUAGE plpgsql;

-- Step 10: Run migration for existing records
SELECT migrate_existing_lend_borrow_records();

-- Step 11: Create view for easy querying
CREATE OR REPLACE VIEW lend_borrow_with_transactions AS
SELECT 
    lb.*,
    a.name as account_name,
    a.currency as account_currency,
    t.amount as transaction_amount,
    t.type as transaction_type,
    t.date as transaction_date
FROM lend_borrow lb
LEFT JOIN accounts a ON lb.account_id = a.id
LEFT JOIN transactions t ON lb.transaction_id = t.transaction_id;

-- Step 12: Add helpful comments
COMMENT ON COLUMN lend_borrow.account_id IS 'Account from which money is lent/borrowed';
COMMENT ON COLUMN lend_borrow.transaction_id IS 'Transaction ID for the initial lend/borrow transaction';
COMMENT ON COLUMN lend_borrow.repayment_transaction_id IS 'Transaction ID for the repayment when loan is settled';
COMMENT ON COLUMN lend_borrow.interest_transaction_id IS 'Transaction ID for interest payments (future feature)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Lend/borrow account integration completed successfully!';
    RAISE NOTICE 'New features:';
    RAISE NOTICE '- Lend/borrow records now create transactions';
    RAISE NOTICE '- Account balances are updated automatically';
    RAISE NOTICE '- Loan settlements create repayment transactions';
    RAISE NOTICE '- Partial returns are tracked';
    RAISE NOTICE '- Use rollback_lend_borrow_integration() if needed';
END $$;

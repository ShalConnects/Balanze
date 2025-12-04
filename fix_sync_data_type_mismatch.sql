-- Fix data type mismatch in sync test function
-- This script fixes the real vs numeric type mismatch

-- 1. Fix the test function to handle the correct data types
CREATE OR REPLACE FUNCTION test_purchase_transaction_sync()
RETURNS TABLE(
    test_result TEXT,
    purchase_item_name TEXT,
    transaction_description TEXT,
    purchase_category TEXT,
    transaction_category TEXT,
    purchase_price REAL,
    transaction_amount REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p.item_name = t.description AND p.category = t.category AND p.price = t.amount 
            THEN 'SYNC WORKING' 
            ELSE 'SYNC ISSUE DETECTED' 
        END as test_result,
        p.item_name,
        t.description,
        p.category,
        t.category,
        p.price,
        t.amount
    FROM purchases p
    JOIN transactions t ON p.transaction_id = t.transaction_id
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- 2. Also fix the sync functions to handle the correct data types
CREATE OR REPLACE FUNCTION sync_purchase_to_transaction()
RETURNS TRIGGER AS $$
DECLARE
    old_amount REAL;
    account_id UUID;
    transaction_type TEXT;
BEGIN
    -- When a purchase is updated, sync ALL fields with the linked transaction
    IF NEW.transaction_id IS NOT NULL THEN
        -- Get the current transaction details for account balance calculation
        SELECT t.amount, t.account_id, t.type 
        INTO old_amount, account_id, transaction_type
        FROM transactions t 
        WHERE t.transaction_id = NEW.transaction_id;
        
        -- Update ALL transaction fields to match purchase
        UPDATE transactions 
        SET 
            amount = NEW.price,
            description = NEW.item_name,
            category = NEW.category,
            updated_at = NOW()
        WHERE transaction_id = NEW.transaction_id;
        
        -- Update account balance if price changed
        IF account_id IS NOT NULL AND old_amount IS NOT NULL AND NEW.price != OLD.price THEN
            IF transaction_type = 'expense' THEN
                -- For expenses: remove old amount, add new amount (negative adjustment)
                UPDATE accounts 
                SET balance = balance + old_amount - NEW.price,
                    updated_at = NOW()
                WHERE id = account_id;
            ELSIF transaction_type = 'income' THEN
                -- For income: remove old amount, add new amount (positive adjustment)
                UPDATE accounts 
                SET balance = balance - old_amount + NEW.price,
                    updated_at = NOW()
                WHERE id = account_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Fix the transaction to purchase sync function
CREATE OR REPLACE FUNCTION sync_transaction_to_purchase()
RETURNS TRIGGER AS $$
DECLARE
    old_amount REAL;
    account_id UUID;
    transaction_type TEXT;
BEGIN
    -- When a transaction is updated, sync ALL fields with the linked purchase
    IF NEW.amount != OLD.amount OR NEW.description != OLD.description OR NEW.category != OLD.category THEN
        -- Update ALL purchase fields to match transaction
        UPDATE purchases 
        SET 
            price = NEW.amount,
            item_name = NEW.description,
            category = NEW.category,
            updated_at = NOW()
        WHERE transaction_id = NEW.transaction_id;
        
        -- Update account balance if amount changed
        account_id := NEW.account_id;
        old_amount := OLD.amount;
        transaction_type := NEW.type;
        
        IF account_id IS NOT NULL AND old_amount IS NOT NULL AND NEW.amount != OLD.amount THEN
            IF transaction_type = 'expense' THEN
                -- For expenses: remove old amount, add new amount (negative adjustment)
                UPDATE accounts 
                SET balance = balance + old_amount - NEW.amount,
                    updated_at = NOW()
                WHERE id = account_id;
            ELSIF transaction_type = 'income' THEN
                -- For income: remove old amount, add new amount (positive adjustment)
                UPDATE accounts 
                SET balance = balance - old_amount + NEW.amount,
                    updated_at = NOW()
                WHERE id = account_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Test the fixed sync
SELECT 
    'DATA TYPE MISMATCH FIXED' as status,
    'Sync functions now use correct data types (REAL)' as message;

-- 5. Run the test function
SELECT * FROM test_purchase_transaction_sync();

-- 6. Show sample of linked purchases and transactions with correct data types
SELECT 
    'Sample of linked purchases and transactions:' as info,
    p.item_name as purchase_item,
    t.description as transaction_description,
    p.category as purchase_category,
    t.category as transaction_category,
    p.price as purchase_price,
    t.amount as transaction_amount,
    CASE 
        WHEN p.item_name = t.description AND p.category = t.category AND p.price = t.amount 
        THEN '✅ SYNCED' 
        ELSE '❌ NOT SYNCED' 
    END as sync_status
FROM purchases p
JOIN transactions t ON p.transaction_id = t.transaction_id
LIMIT 10;

-- 7. Show trigger status
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('sync_purchase_to_transaction_trigger', 'sync_transaction_to_purchase_trigger')
ORDER BY trigger_name;

-- 8. Check data types of price/amount columns
SELECT 
    'Data types check:' as info,
    'purchases.price' as column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'purchases' AND column_name = 'price'

UNION ALL

SELECT 
    'transactions.amount' as column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'amount'; 
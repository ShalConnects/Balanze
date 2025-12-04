-- =====================================================
-- CREATE DUMMY TRANSACTIONS FOR anylogin85@gmail.com
-- User ID: 0d497c5c-3242-425e-aa73-1081385f46e5
-- Currency: JPY
-- Date Range: October 2025
-- Note: Respects 25 transaction limit per month
-- =====================================================

DO $$
DECLARE
    target_user_id UUID := '0d497c5c-3242-425e-aa73-1081385f46e5';
    user_email TEXT := 'anylogin85@gmail.com';
    account_id_found UUID;
    transaction_count INTEGER := 0;
    existing_count INTEGER := 0;
    remaining_limit INTEGER := 0;
BEGIN
    -- Verify the user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id AND email = user_email) THEN
        RAISE EXCEPTION 'User with ID % and email % not found', target_user_id, user_email;
    END IF;
    
    -- Check existing transactions for October 2025
    SELECT COUNT(*) INTO existing_count
    FROM transactions t
    JOIN auth.users u ON t.user_id = u.id
    WHERE u.email = user_email 
    AND EXTRACT(YEAR FROM t.date) = 2025 
    AND EXTRACT(MONTH FROM t.date) = 10;
    
    remaining_limit := 25 - existing_count;
    
    RAISE NOTICE 'Existing transactions in October 2025: %', existing_count;
    RAISE NOTICE 'Remaining transaction limit: %', remaining_limit;
    
    IF remaining_limit <= 0 THEN
        RAISE NOTICE 'Transaction limit reached for October 2025. Cannot add more transactions.';
        RETURN;
    END IF;
    
    -- Get the first active account for this user (or create a default cash account)
    SELECT id INTO account_id_found 
    FROM accounts 
    WHERE user_id = target_user_id AND is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If no account exists, create a default cash account
    IF account_id_found IS NULL THEN
        INSERT INTO accounts (
            user_id, name, type, initial_balance, calculated_balance, 
            currency, is_active, created_at, updated_at
        ) VALUES (
            target_user_id, 'Cash Account', 'cash', 0, 0, 'JPY', true, NOW(), NOW()
        ) RETURNING id INTO account_id_found;
        
        RAISE NOTICE 'Created default cash account for user: %', user_email;
    END IF;
    
    RAISE NOTICE 'Using account ID: % for user: %', account_id_found, user_email;
    RAISE NOTICE 'Will insert up to % transactions', LEAST(remaining_limit, 25);
    
    -- Insert transactions up to the remaining limit
    -- Priority order: Income first, then essential expenses, then other expenses
    
    -- Income Transactions (up to 8, but limited by remaining_limit)
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'income', 450000.00, 'Monthly Salary', 'Salary', '2025-10-15', true, 'monthly', 45000.00, '2025-10-15 09:00:00+00', '2025-10-15 09:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'income', 85000.00, 'Freelance Web Development', 'Freelance', '2025-10-03', false, null, 8500.00, '2025-10-03 14:30:00+00', '2025-10-03 14:30:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'income', 120000.00, 'Freelance Design Project', 'Freelance', '2025-10-18', false, null, 12000.00, '2025-10-18 16:45:00+00', '2025-10-18 16:45:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'income', 25000.00, 'Stock Dividends', 'Investment', '2025-10-31', false, null, 2500.00, '2025-10-31 10:00:00+00', '2025-10-31 10:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'income', 18000.00, 'Investment Returns', 'Investment', '2025-10-25', false, null, 1800.00, '2025-10-25 11:15:00+00', '2025-10-25 11:15:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'income', 35000.00, 'Side Project Payment', 'Freelance', '2025-10-12', false, null, 3500.00, '2025-10-12 13:20:00+00', '2025-10-12 13:20:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'income', 15000.00, 'Bonus Payment', 'Salary', '2025-10-20', false, null, 1500.00, '2025-10-20 15:30:00+00', '2025-10-20 15:30:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'income', 22000.00, 'Consulting Fee', 'Freelance', '2025-10-28', false, null, 2200.00, '2025-10-28 17:00:00+00', '2025-10-28 17:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    -- Essential Expense Transactions (prioritized)
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 85000.00, 'Monthly Rent', 'Rent & Housing', '2025-10-01', true, 'monthly', 0, '2025-10-01 00:00:00+00', '2025-10-01 00:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 12000.00, 'Electricity Bill', 'Bills & Utilities', '2025-10-05', true, 'monthly', 0, '2025-10-05 08:00:00+00', '2025-10-05 08:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 8500.00, 'Internet Bill', 'Bills & Utilities', '2025-10-10', true, 'monthly', 0, '2025-10-10 10:00:00+00', '2025-10-10 10:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 15000.00, 'Monthly Train Pass', 'Transportation', '2025-10-01', true, 'monthly', 0, '2025-10-01 07:00:00+00', '2025-10-01 07:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 15000.00, 'Health Insurance', 'Insurance', '2025-10-01', true, 'monthly', 0, '2025-10-01 00:00:00+00', '2025-10-01 00:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    -- Food & Dining Transactions
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 3500.00, 'Lunch at Restaurant', 'Food & Dining', '2025-10-02', false, null, 0, '2025-10-02 12:30:00+00', '2025-10-02 12:30:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 2800.00, 'Coffee and Pastry', 'Food & Dining', '2025-10-04', false, null, 0, '2025-10-04 15:45:00+00', '2025-10-04 15:45:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 4500.00, 'Dinner with Friends', 'Food & Dining', '2025-10-07', false, null, 0, '2025-10-07 19:00:00+00', '2025-10-07 19:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 12000.00, 'Grocery Shopping', 'Food & Dining', '2025-10-09', false, null, 0, '2025-10-09 16:30:00+00', '2025-10-09 16:30:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 3200.00, 'Quick Lunch', 'Food & Dining', '2025-10-11', false, null, 0, '2025-10-11 13:15:00+00', '2025-10-11 13:15:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    -- Shopping & Entertainment
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 25000.00, 'New Laptop', 'Shopping', '2025-10-06', false, null, 0, '2025-10-06 14:20:00+00', '2025-10-06 14:20:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 8500.00, 'Netflix Subscription', 'Subscriptions', '2025-10-15', true, 'monthly', 0, '2025-10-15 00:00:00+00', '2025-10-15 00:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 12000.00, 'Movie Tickets', 'Entertainment', '2025-10-08', false, null, 0, '2025-10-08 20:00:00+00', '2025-10-08 20:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 8000.00, 'Concert Tickets', 'Entertainment', '2025-10-14', false, null, 0, '2025-10-14 19:30:00+00', '2025-10-14 19:30:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 5000.00, 'Charity Donation', 'Donations', '2025-10-16', false, null, 0, '2025-10-16 12:00:00+00', '2025-10-16 12:00:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 3000.00, 'Doctor Visit', 'Healthcare', '2025-10-19', false, null, 0, '2025-10-19 10:30:00+00', '2025-10-19 10:30:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 18000.00, 'New Winter Clothes', 'Shopping', '2025-10-22', false, null, 0, '2025-10-22 15:45:00+00', '2025-10-22 15:45:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 6500.00, 'Bookstore Shopping', 'Shopping', '2025-10-26', false, null, 0, '2025-10-26 14:20:00+00', '2025-10-26 14:20:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    IF remaining_limit > 0 THEN
        INSERT INTO transactions (user_id, account_id, type, amount, description, category, date, is_recurring, recurring_frequency, saving_amount, created_at, updated_at)
        VALUES (target_user_id, account_id_found, 'expense', 4200.00, 'Taxi Ride', 'Transportation', '2025-10-29', false, null, 0, '2025-10-29 18:30:00+00', '2025-10-29 18:30:00+00');
        remaining_limit := remaining_limit - 1;
    END IF;
    
    -- Count how many transactions were actually inserted
    SELECT COUNT(*) INTO transaction_count
    FROM transactions t
    JOIN auth.users u ON t.user_id = u.id
    WHERE u.email = user_email 
    AND EXTRACT(YEAR FROM t.date) = 2025 
    AND EXTRACT(MONTH FROM t.date) = 10;
    
    RAISE NOTICE 'Successfully created transactions for user: %', user_email;
    RAISE NOTICE 'Total transactions in October 2025: %', transaction_count;
    RAISE NOTICE 'All transactions are in JPY currency';
    RAISE NOTICE 'Transaction date range: October 2025';
    
END $$;

-- Verification: Check the created transactions
SELECT 
    'VERIFICATION' as status,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    MIN(date) as earliest_transaction,
    MAX(date) as latest_transaction
FROM transactions t
JOIN auth.users u ON t.user_id = u.id
WHERE u.email = 'anylogin85@gmail.com';

-- Show sample of created transactions
SELECT 
    type,
    amount,
    description,
    category,
    date,
    is_recurring,
    saving_amount
FROM transactions t
JOIN auth.users u ON t.user_id = u.id
WHERE u.email = 'anylogin85@gmail.com'
ORDER BY date DESC, type ASC
LIMIT 10;

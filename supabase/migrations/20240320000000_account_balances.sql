-- Create a view to calculate account balances from transactions
CREATE OR REPLACE VIEW account_balances AS
SELECT 
    a.id as account_id,
    a.user_id,
    a.name,
    a.type,
    a.currency,
    a.is_active,
    a.created_at,
    a.donation_preference,
    a.initial_balance,
    (a.initial_balance + COALESCE(
        SUM(
            CASE 
                WHEN t.type = 'income' THEN t.amount
                WHEN t.type = 'expense' THEN -t.amount
                ELSE 0
            END
        ),
        0
    )) as calculated_balance
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.user_id, a.name, a.type, a.currency, a.is_active, a.created_at, a.donation_preference, a.initial_balance;

-- Create a function to update account balances
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- No need to update the account's balance anymore since we're using the view
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain account balances
DROP TRIGGER IF EXISTS update_balance_after_transaction ON transactions;
CREATE TRIGGER update_balance_after_transaction
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- Ensure the base tables have proper RLS policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for accounts if they don't exist
DO $$ 
BEGIN
    -- Accounts policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can view their own accounts') THEN
        CREATE POLICY "Users can view their own accounts"
            ON accounts
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can insert their own accounts') THEN
        CREATE POLICY "Users can insert their own accounts"
            ON accounts
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can update their own accounts') THEN
        CREATE POLICY "Users can update their own accounts"
            ON accounts
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can delete their own accounts') THEN
        CREATE POLICY "Users can delete their own accounts"
            ON accounts
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;

    -- Transactions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view their own transactions') THEN
        CREATE POLICY "Users can view their own transactions"
            ON transactions
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can insert their own transactions') THEN
        CREATE POLICY "Users can insert their own transactions"
            ON transactions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can update their own transactions') THEN
        CREATE POLICY "Users can update their own transactions"
            ON transactions
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can delete their own transactions') THEN
        CREATE POLICY "Users can delete their own transactions"
            ON transactions
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$; 
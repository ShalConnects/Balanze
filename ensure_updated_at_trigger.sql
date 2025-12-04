-- Ensure updated_at trigger is properly set up for transactions
-- This will guarantee the updated_at field is automatically updated

-- First, ensure the updated_at column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'updated_at') THEN
        ALTER TABLE transactions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to transactions table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in transactions table';
    END IF;
END $$;

-- Create or replace the function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on transactions table
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the trigger is working
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'transactions' 
AND trigger_name = 'update_transactions_updated_at';

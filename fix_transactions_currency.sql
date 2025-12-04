-- Fix the transactions table to include currency column
-- This script will add the missing currency column to the transactions table

-- First, check if currency column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'currency'
    ) THEN
        -- Add currency column if it doesn't exist
        ALTER TABLE transactions ADD COLUMN currency VARCHAR(10);
        
        -- Update existing records to have a default currency (you may want to adjust this)
        UPDATE transactions SET currency = 'USD' WHERE currency IS NULL;
        
        -- Make currency NOT NULL
        ALTER TABLE transactions ALTER COLUMN currency SET NOT NULL;
        
        RAISE NOTICE 'Currency column added to transactions table';
    ELSE
        RAISE NOTICE 'Currency column already exists in transactions table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'currency';

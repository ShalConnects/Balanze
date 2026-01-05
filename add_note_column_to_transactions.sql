-- Migration: Add note column to transactions table if it doesn't exist
-- This migration is safe to run multiple times (idempotent)

-- Check if the column exists, and add it if it doesn't
DO $$
BEGIN
    -- Check if the 'note' column exists in the transactions table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'note'
    ) THEN
        -- Add the note column
        ALTER TABLE transactions 
        ADD COLUMN note TEXT;
        
        RAISE NOTICE 'Note column added to transactions table';
    ELSE
        RAISE NOTICE 'Note column already exists in transactions table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'transactions'
AND column_name = 'note';


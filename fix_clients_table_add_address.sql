-- Fix clients table - Add missing address column if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Check if address column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE clients ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to clients table';
    ELSE
        RAISE NOTICE 'Address column already exists in clients table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;


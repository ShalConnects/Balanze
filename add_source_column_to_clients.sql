-- Add source column to clients table
-- This adds a dedicated source field for tracking where clients came from (Fiverr, Upwork, etc.)

-- Add source column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE clients 
        ADD COLUMN source TEXT;
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);
        
        RAISE NOTICE 'Source column added successfully to clients table';
    ELSE
        RAISE NOTICE 'Source column already exists in clients table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' 
    AND column_name = 'source';


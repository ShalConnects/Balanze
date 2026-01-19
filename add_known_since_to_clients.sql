-- Add known_since column to clients table
-- This adds a field for tracking when the user first knew/started working with the client
-- This is separate from created_at which tracks when the record was created in the system

-- Add known_since column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'known_since'
    ) THEN
        ALTER TABLE clients 
        ADD COLUMN known_since DATE;
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_clients_known_since ON clients(known_since);
        
        RAISE NOTICE 'known_since column added successfully to clients table';
    ELSE
        RAISE NOTICE 'known_since column already exists in clients table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' 
    AND column_name = 'known_since';

-- Fix orders to clients relationship
-- This ensures the foreign key constraint exists and is recognized by Supabase
-- NOTE: This script assumes the orders table already exists. 
-- If you get an error that the table doesn't exist, run create_client_management_schema.sql first.

DO $$
BEGIN
    -- First check if the orders table exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'orders'
    ) THEN
        RAISE EXCEPTION 'The orders table does not exist. Please run create_client_management_schema.sql first to create all required tables.';
    END IF;

    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_client_id_fkey' 
        AND table_name = 'orders'
    ) THEN
        -- Add the foreign key constraint if it doesn't exist
        ALTER TABLE orders 
        ADD CONSTRAINT orders_client_id_fkey 
        FOREIGN KEY (client_id) 
        REFERENCES clients(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint orders_client_id_fkey added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint orders_client_id_fkey already exists';
    END IF;
END $$;

-- Verify the constraint
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'orders'
    AND kcu.column_name = 'client_id';


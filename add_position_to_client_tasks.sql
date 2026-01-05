-- =====================================================
-- ADD POSITION FIELD TO CLIENT_TASKS TABLE
-- =====================================================
-- This migration adds a position field to enable within-column reordering

-- Add position column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_tasks' AND column_name = 'position'
    ) THEN
        ALTER TABLE client_tasks ADD COLUMN position INTEGER;
        
        -- Initialize position based on created_at for existing tasks
        -- Group by status and assign sequential positions
        WITH ranked_tasks AS (
            SELECT 
                id,
                status,
                ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at ASC) as pos
            FROM client_tasks
        )
        UPDATE client_tasks
        SET position = ranked_tasks.pos
        FROM ranked_tasks
        WHERE client_tasks.id = ranked_tasks.id;
        
        -- Create index for better performance when ordering by position
        CREATE INDEX IF NOT EXISTS idx_client_tasks_position ON client_tasks(status, position);
    END IF;
END $$;


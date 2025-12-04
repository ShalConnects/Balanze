-- =====================================================
-- ADD POSITION FIELD FOR MANUAL TASK REORDERING
-- =====================================================

-- Add position field to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing tasks to have position based on created_at (newest first)
-- This maintains the current default ordering
UPDATE tasks 
SET position = subquery.row_number
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_number
    FROM tasks
) as subquery
WHERE tasks.id = subquery.id;

-- Create index for better performance on position-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_position 
ON tasks(user_id, position);

-- Add comment to document the field
COMMENT ON COLUMN tasks.position IS 'Manual ordering position for tasks. Lower numbers appear first. 0 means use default ordering.';


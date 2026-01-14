-- =====================================================
-- ADD SUBTASKS SUPPORT TO STANDALONE TASKS
-- =====================================================
-- This migration adds parent_id column to enable subtasks
-- Supports 2-level nesting: parent task → subtask (no subtasks of subtasks)

-- Add parent_id column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Create index for efficient queries of subtasks
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id) 
WHERE parent_id IS NOT NULL;

-- Create composite index for parent + position ordering
CREATE INDEX IF NOT EXISTS idx_tasks_parent_position ON tasks(parent_id, position) 
WHERE parent_id IS NOT NULL;

-- Add constraint to prevent subtasks from having their own subtasks (2-level max)
-- This is enforced at application level, but we can add a check constraint
-- Note: PostgreSQL doesn't support recursive CHECK constraints easily,
-- so we'll enforce this in the application logic

-- Add comment to document the field
COMMENT ON COLUMN tasks.parent_id IS 'Reference to parent task. NULL for top-level tasks. Supports 2-level nesting only (parent → subtask).';

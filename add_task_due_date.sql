-- =====================================================
-- ADD DUE_DATE FIELD TO STANDALONE TASKS TABLE
-- =====================================================
-- This migration adds due_date field to enable roadmap/timeline functionality
-- Due date is optional - existing tasks will have NULL due_date

-- Add due_date column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Create index for efficient timeline queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) 
WHERE due_date IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN tasks.due_date IS 'Optional due date for task. Used for roadmap timeline visualization.';

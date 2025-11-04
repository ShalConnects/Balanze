-- =====================================================
-- ADD SECTION_OVERRIDE FIELD FOR MANUAL TASK GROUPING
-- =====================================================

-- Add section_override field to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS section_override TEXT CHECK (section_override IN ('today', 'this_week', 'this_month') OR section_override IS NULL);

-- Create index for better performance on section_override queries
CREATE INDEX IF NOT EXISTS idx_tasks_section_override 
ON tasks(user_id, section_override);

-- Add comment to document the field
COMMENT ON COLUMN tasks.section_override IS 'Manual section override for tasks. If set, overrides created_at date for grouping. Values: today, this_week, this_month, or NULL for automatic date-based grouping.';


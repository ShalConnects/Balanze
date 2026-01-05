-- =====================================================
-- CLIENT TASKS TABLE
-- =====================================================
-- This table stores tasks/orders for clients
-- Tasks are simpler than orders - focused on task management
-- Note: This is separate from the standalone 'tasks' table

CREATE TABLE IF NOT EXISTS client_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('in_progress', 'waiting_on_client', 'waiting_on_me', 'completed', 'cancelled')) DEFAULT 'in_progress',
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_tasks_user_id ON client_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_client_id ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON client_tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_priority ON client_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_client_tasks_due_date ON client_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_client_tasks_created_at ON client_tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_tasks
DROP POLICY IF EXISTS "Users can view their own client tasks" ON client_tasks;
CREATE POLICY "Users can view their own client tasks" ON client_tasks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own client tasks" ON client_tasks;
CREATE POLICY "Users can insert their own client tasks" ON client_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own client tasks" ON client_tasks;
CREATE POLICY "Users can update their own client tasks" ON client_tasks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own client tasks" ON client_tasks;
CREATE POLICY "Users can delete their own client tasks" ON client_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_client_tasks_updated_at_trigger ON client_tasks;
CREATE TRIGGER update_client_tasks_updated_at_trigger
    BEFORE UPDATE ON client_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_client_tasks_updated_at();

-- Trigger to set completed_date when status changes to 'completed'
CREATE OR REPLACE FUNCTION set_client_task_completed_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_date = CURRENT_DATE;
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_date = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_client_task_completed_date_trigger ON client_tasks;
CREATE TRIGGER set_client_task_completed_date_trigger
    BEFORE UPDATE ON client_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_client_task_completed_date();


-- Migration: Create notes table for dashboard hybrid notes/to-do widget
CREATE TABLE IF NOT EXISTS notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    text text,
    color text DEFAULT 'yellow',
    pinned boolean DEFAULT false,
    checklist jsonb,
    images jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone DEFAULT timezone('utc', now()),
    reminder_at timestamp with time zone,
    is_task boolean DEFAULT false,
    task_id uuid,
    CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned); 
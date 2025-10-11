-- Fix savings_goals table schema
-- Add missing columns that the frontend expects

-- Add target_date column
ALTER TABLE savings_goals 
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Add user_id column for easier querying
ALTER TABLE savings_goals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to have user_id based on source_account_id
UPDATE savings_goals 
SET user_id = (
  SELECT user_id 
  FROM accounts 
  WHERE accounts.id = savings_goals.source_account_id
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after populating existing records
ALTER TABLE savings_goals 
ALTER COLUMN user_id SET NOT NULL;

-- Add updated_at column
ALTER TABLE savings_goals 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_savings_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW EXECUTE FUNCTION update_savings_goals_updated_at();

-- Update RLS policies to use user_id directly
DROP POLICY IF EXISTS "Users can view their own savings goals" ON savings_goals;
CREATE POLICY "Users can view their own savings goals" ON savings_goals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own savings goals" ON savings_goals;
CREATE POLICY "Users can insert their own savings goals" ON savings_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own savings goals" ON savings_goals;
CREATE POLICY "Users can update their own savings goals" ON savings_goals
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own savings goals" ON savings_goals;
CREATE POLICY "Users can delete their own savings goals" ON savings_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);

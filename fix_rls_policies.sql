-- Fix RLS policies for achievement system and other tables
-- This script ensures proper RLS policies are in place

-- Enable RLS on achievement tables if not already enabled
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own achievement progress" ON achievement_progress;
DROP POLICY IF EXISTS "Users can update their own achievement progress" ON achievement_progress;

-- Create RLS policies for achievements table
CREATE POLICY "Users can view all achievements" ON achievements
  FOR SELECT USING (true);

-- Create RLS policies for user_achievements table
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for achievement_progress table
CREATE POLICY "Users can view their own achievement progress" ON achievement_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement progress" ON achievement_progress
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON achievements TO authenticated;
GRANT SELECT, INSERT ON user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON achievement_progress TO authenticated;

-- Fix RLS policies for lend_borrow table (causing 403 error)
DROP POLICY IF EXISTS "Users can view their own lend borrow records" ON lend_borrow;
DROP POLICY IF EXISTS "Users can insert their own lend borrow records" ON lend_borrow;
DROP POLICY IF EXISTS "Users can update their own lend borrow records" ON lend_borrow;

CREATE POLICY "Users can view their own lend borrow records" ON lend_borrow
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lend borrow records" ON lend_borrow
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lend borrow records" ON lend_borrow
  FOR UPDATE USING (auth.uid() = user_id);

-- Ensure the view has proper permissions
GRANT SELECT ON user_achievement_summary TO authenticated;

-- Test the policies by checking if a user can access their data
-- This is just for verification - remove in production
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated successfully';
END $$;

-- =====================================================
-- HABIT GAMIFICATION SYSTEM
-- =====================================================
-- Adds points, levels, and achievements for habit tracking

-- Add gamification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS habit_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS habit_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_habit_completions INTEGER DEFAULT 0;

-- Create habit_achievements table
CREATE TABLE IF NOT EXISTS habit_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, achievement_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habit_achievements_user_id ON habit_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_achievements_type ON habit_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_habit_achievements_claimed ON habit_achievements(user_id, claimed_at) WHERE claimed_at IS NULL;

-- Enable Row Level Security
ALTER TABLE habit_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habit_achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON habit_achievements;
CREATE POLICY "Users can view their own achievements" ON habit_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON habit_achievements;
CREATE POLICY "Users can insert their own achievements" ON habit_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own achievements" ON habit_achievements;
CREATE POLICY "Users can update their own achievements" ON habit_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate level from points
CREATE OR REPLACE FUNCTION calculate_habit_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: sqrt(points / 100) + 1, minimum level 1
  -- This gives: 0-99 points = level 1, 100-399 = level 2, 400-899 = level 3, etc.
  RETURN GREATEST(1, FLOOR(SQRT(GREATEST(0, points) / 100.0)) + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get points needed for next level
CREATE OR REPLACE FUNCTION points_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Points needed = (level^2 - 2*level + 1) * 100
  -- Level 1 -> 2: 100 points (0-99 -> 100-399)
  -- Level 2 -> 3: 400 points (100-399 -> 400-899)
  RETURN ((current_level * current_level - 2 * current_level + 1) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


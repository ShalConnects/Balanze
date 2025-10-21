-- Fix for achievement schema issues
-- Run this if you get the "column a.is_active does not exist" error

-- First, check if the column exists and add it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE achievements ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Drop the view if it exists to recreate it
DROP VIEW IF EXISTS user_achievement_summary;

-- Recreate the view with proper column references
CREATE OR REPLACE VIEW user_achievement_summary AS
SELECT 
    ua.user_id,
    COUNT(ua.id) as total_achievements,
    COUNT(CASE WHEN a.rarity = 'bronze' THEN 1 END) as bronze_badges,
    COUNT(CASE WHEN a.rarity = 'silver' THEN 1 END) as silver_badges,
    COUNT(CASE WHEN a.rarity = 'gold' THEN 1 END) as gold_badges,
    COUNT(CASE WHEN a.rarity = 'diamond' THEN 1 END) as diamond_badges,
    COUNT(CASE WHEN a.rarity = 'rainbow' THEN 1 END) as rainbow_badges,
    SUM(a.points) as total_points,
    MAX(ua.earned_at) as last_achievement_earned
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE a.is_active = true
GROUP BY ua.user_id;

-- Grant permissions
GRANT SELECT ON user_achievement_summary TO authenticated;

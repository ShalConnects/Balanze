-- Notify all users about the new achievement system
-- This script creates a notification for all existing users about the achievement system

-- Insert achievement system announcement for all users
INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
SELECT 
  u.id as user_id,
  'info' as type,
  '🏆 New Achievement System is Here!' as title,
  'We''ve added an exciting new achievement system to Balanze! Earn badges for completing financial tasks, maintaining good habits, and reaching milestones. Check out your achievements page to see what you can unlock!' as body,
  false as is_read,
  NOW() as created_at
FROM auth.users u
WHERE NOT EXISTS (
  -- Don't send if user already has an achievement notification
  SELECT 1 FROM notifications n 
  WHERE n.user_id = u.id 
  AND n.type = 'info' 
  AND n.title LIKE '%Achievement%'
);

-- Show how many notifications were created
SELECT COUNT(*) as notifications_created FROM notifications 
WHERE type = 'info' 
AND title LIKE '%Achievement%'
AND created_at >= NOW() - INTERVAL '1 minute';

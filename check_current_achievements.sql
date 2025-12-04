-- Check what achievements we currently have in the database
-- Compare with the comprehensive list provided

-- Show all current achievements
SELECT 'Current achievements in database:' as info;
SELECT 
  name,
  category,
  rarity,
  description,
  points,
  is_active
FROM achievements 
ORDER BY category, rarity, name;

-- Count achievements by category
SELECT 'Achievement counts by category:' as info;
SELECT 
  category,
  COUNT(*) as badge_count,
  COUNT(CASE WHEN rarity = 'bronze' THEN 1 END) as bronze,
  COUNT(CASE WHEN rarity = 'silver' THEN 1 END) as silver,
  COUNT(CASE WHEN rarity = 'gold' THEN 1 END) as gold,
  COUNT(CASE WHEN rarity = 'diamond' THEN 1 END) as diamond,
  COUNT(CASE WHEN rarity = 'rainbow' THEN 1 END) as rainbow
FROM achievements 
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Show total counts
SELECT 'Total achievement summary:' as info;
SELECT 
  COUNT(*) as total_achievements,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_achievements,
  COUNT(CASE WHEN rarity = 'bronze' THEN 1 END) as bronze_badges,
  COUNT(CASE WHEN rarity = 'silver' THEN 1 END) as silver_badges,
  COUNT(CASE WHEN rarity = 'gold' THEN 1 END) as gold_badges,
  COUNT(CASE WHEN rarity = 'diamond' THEN 1 END) as diamond_badges,
  COUNT(CASE WHEN rarity = 'rainbow' THEN 1 END) as rainbow_badges
FROM achievements;

-- Check Achievement Count and Categories
-- This script will help identify why we're seeing 24 badges instead of 31

-- 1. Check total count of achievements
SELECT 
  'Total Achievements' as metric,
  COUNT(*) as count
FROM achievements 
WHERE is_active = true;

-- 2. Check achievements by category
SELECT 
  category,
  COUNT(*) as count
FROM achievements 
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 3. Check for duplicate achievements (same name)
SELECT 
  name,
  COUNT(*) as duplicate_count
FROM achievements 
WHERE is_active = true
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 4. Check for achievements with missing categories
SELECT 
  'Missing Category' as issue,
  COUNT(*) as count
FROM achievements 
WHERE is_active = true 
  AND (category IS NULL OR category = '');

-- 5. List all achievement names and categories
SELECT 
  name,
  category,
  rarity,
  is_active
FROM achievements 
WHERE is_active = true
ORDER BY category, name;

-- 6. Check if we have the expected 31 achievements
SELECT 
  CASE 
    WHEN COUNT(*) = 31 THEN '✅ Correct count (31)'
    WHEN COUNT(*) < 31 THEN '❌ Missing achievements (' || COUNT(*) || '/31)'
    WHEN COUNT(*) > 31 THEN '⚠️ Too many achievements (' || COUNT(*) || ')'
  END as status
FROM achievements 
WHERE is_active = true;

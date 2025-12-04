-- Check Supabase Rate Limit Settings
-- Run this in your Supabase SQL Editor to see current limits

-- Check auth settings
SELECT 
    'auth' as setting_type,
    name,
    value,
    description
FROM pg_settings 
WHERE name LIKE '%auth%' 
   OR name LIKE '%email%' 
   OR name LIKE '%rate%'
   OR name LIKE '%limit%'
ORDER BY name;

-- Check if there are any custom rate limit configurations
SELECT 
    'custom_config' as setting_type,
    'Check Supabase Dashboard > Settings > Auth > Email Templates' as info;

-- Check recent auth events (if you have access)
-- This might not work depending on your permissions
SELECT 
    'recent_auth_events' as setting_type,
    'Check Supabase Dashboard > Authentication > Users' as info;

-- Instructions:
-- 1. Run this script in Supabase SQL Editor
-- 2. Check your Supabase Dashboard > Settings > Auth
-- 3. Look for "Email Templates" and "Rate Limiting" settings
-- 4. You can adjust rate limits in the dashboard if needed 
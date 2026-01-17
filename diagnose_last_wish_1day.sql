-- Diagnostic query to check why 1-day frequency users aren't being detected
-- Run this in Supabase SQL Editor to see what's blocking detection

-- First, check what the RPC function returns
SELECT '=== RPC Function Results ===' as section;
SELECT * FROM check_overdue_last_wish();

-- Then check all Last Wish settings and their status
SELECT '=== Detailed Status Check ===' as section;
SELECT 
    lws.user_id,
    au.email as user_email,
    lws.is_enabled,
    lws.is_active,
    lws.delivery_triggered,
    lws.check_in_frequency,
    lws.last_check_in,
    lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency as expected_check_in_deadline,
    NOW() as current_time,
    -- Calculate if overdue
    CASE 
        WHEN lws.check_in_frequency >= 1 THEN
            (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) < NOW()
        ELSE
            (lws.last_check_in + INTERVAL '1 second' * (lws.check_in_frequency * 24 * 60 * 60)) < NOW()
    END as is_overdue,
    -- Calculate hours overdue
    CASE 
        WHEN lws.check_in_frequency >= 1 THEN
            EXTRACT(EPOCH FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency))) / 3600
        ELSE
            EXTRACT(EPOCH FROM (NOW() - (lws.last_check_in + INTERVAL '1 second' * (lws.check_in_frequency * 24 * 60 * 60)))) / 3600
    END as hours_overdue,
    -- Check why it might be filtered out
    CASE 
        WHEN lws.is_enabled = false THEN '❌ is_enabled = false'
        WHEN lws.is_active = false THEN '❌ is_active = false'
        WHEN COALESCE(lws.delivery_triggered, false) = true THEN '❌ delivery_triggered = true'
        WHEN lws.last_check_in IS NULL THEN '❌ last_check_in IS NULL'
        WHEN lws.check_in_frequency >= 1 AND (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) >= NOW() THEN '⏰ Not overdue yet'
        WHEN lws.check_in_frequency < 1 AND (lws.last_check_in + INTERVAL '1 second' * (lws.check_in_frequency * 24 * 60 * 60)) >= NOW() THEN '⏰ Not overdue yet'
        ELSE '✅ Should be detected'
    END as status_reason
FROM last_wish_settings lws
LEFT JOIN auth.users au ON lws.user_id = au.id
WHERE lws.check_in_frequency = 1  -- Focus on 1-day frequency
ORDER BY lws.last_check_in DESC;

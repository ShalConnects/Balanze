-- =============================================================================
-- CHECK PENDING LAST WISH EMAILS
-- Run this in Supabase SQL Editor to check for pending email deliveries
-- =============================================================================

-- 1. Check for overdue users who should have emails sent
-- This shows users who are past their check-in deadline
SELECT 
    lws.user_id,
    au.email as user_email,
    lws.is_enabled,
    lws.is_active,
    lws.delivery_triggered,
    lws.check_in_frequency,
    lws.last_check_in,
    lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency as next_check_in_deadline,
    NOW() as current_time,
    EXTRACT(EPOCH FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency))) / 3600 as hours_overdue,
    CASE 
        WHEN lws.delivery_triggered = true THEN 'Already triggered'
        WHEN NOW() > (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) THEN 'OVERDUE - Should send email'
        ELSE 'Not overdue yet'
    END as status,
    jsonb_array_length(lws.recipients) as recipient_count,
    lws.recipients
FROM last_wish_settings lws
LEFT JOIN auth.users au ON lws.user_id = au.id
WHERE lws.is_enabled = true
AND lws.is_active = true
AND lws.last_check_in IS NOT NULL
ORDER BY hours_overdue DESC NULLS LAST;

-- 2. Check delivery_triggered column (if it exists)
-- This shows if the system has already marked users for delivery
SELECT 
    COUNT(*) as total_active_users,
    COUNT(*) FILTER (WHERE delivery_triggered = true) as already_triggered,
    COUNT(*) FILTER (WHERE delivery_triggered = false) as not_triggered,
    COUNT(*) FILTER (WHERE delivery_triggered IS NULL) as null_triggered
FROM last_wish_settings
WHERE is_enabled = true
AND is_active = true;

-- 3. Check for users who are overdue but haven't been triggered
SELECT 
    lws.user_id,
    au.email as user_email,
    lws.last_check_in,
    lws.check_in_frequency,
    lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency as deadline,
    NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency) as time_overdue,
    EXTRACT(EPOCH FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency))) / 3600 as hours_overdue,
    lws.delivery_triggered,
    jsonb_array_length(lws.recipients) as recipient_count
FROM last_wish_settings lws
LEFT JOIN auth.users au ON lws.user_id = au.id
WHERE lws.is_enabled = true
AND lws.is_active = true
AND lws.delivery_triggered = false
AND lws.last_check_in IS NOT NULL
AND NOW() > (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)
ORDER BY hours_overdue DESC;

-- 4. Check delivery logs to see what has been sent
SELECT 
    lwd.id,
    lwd.user_id,
    au.email as user_email,
    lwd.recipient_email,
    lwd.delivery_status,
    lwd.sent_at,
    lwd.error_message,
    lwd.created_at,
    CASE 
        WHEN lwd.delivery_status = 'sent' THEN '✅ Sent'
        WHEN lwd.delivery_status = 'failed' THEN '❌ Failed'
        WHEN lwd.delivery_status = 'pending' THEN '⏳ Pending'
        ELSE '❓ Unknown'
    END as status_display
FROM last_wish_deliveries lwd
LEFT JOIN auth.users au ON lwd.user_id = au.id
ORDER BY lwd.created_at DESC
LIMIT 50;

-- 5. Summary: Count deliveries by status
SELECT 
    delivery_status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE sent_at IS NOT NULL) as with_sent_at,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM last_wish_deliveries
GROUP BY delivery_status
ORDER BY count DESC;

-- 6. Test the check_overdue_last_wish function directly
SELECT * FROM check_overdue_last_wish();

-- 7. Check if delivery_triggered column exists (run this first to verify schema)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'last_wish_settings'
AND column_name IN ('delivery_triggered', 'is_active', 'is_enabled')
ORDER BY column_name;


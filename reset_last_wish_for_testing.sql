-- Reset Last Wish settings for testing
-- Run this in Supabase SQL Editor to allow testing again

UPDATE last_wish_settings 
SET 
    is_active = true,
    delivery_triggered = false,
    last_check_in = NOW() - INTERVAL '2 days'  -- Set to 2 days ago so you're immediately overdue
WHERE user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

-- Verify the update
SELECT 
    user_id,
    is_enabled,
    is_active,
    delivery_triggered,
    check_in_frequency,
    last_check_in,
    last_check_in + INTERVAL '1 day' * check_in_frequency as expected_deadline,
    NOW() as current_time,
    CASE 
        WHEN (last_check_in + INTERVAL '1 day' * check_in_frequency) < NOW() THEN '✅ Overdue'
        ELSE '⏰ Not overdue yet'
    END as status
FROM last_wish_settings
WHERE user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

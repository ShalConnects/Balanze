-- =====================================================
-- SEND NOTIFICATION TO ALL USERS ABOUT NEW RE-ARRANGE FEATURE
-- =====================================================

-- Insert notification for all users about the new drag-and-drop reordering feature
INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    is_read,
    created_at
)
SELECT 
    u.id as user_id,
    '🎉 New Feature: Drag & Drop Account Reordering!' as title,
    'You can now reorder your accounts by dragging them! Click the "Re-arrange" button next to "Add Account" to get started. This feature is available on desktop for the best experience.' as body,
    'info' as type,
    false as is_read,
    NOW() as created_at
FROM auth.users u
WHERE u.id IS NOT NULL;

-- Get count of notifications sent
SELECT 
    'NOTIFICATION_SENT' as status,
    COUNT(*) as total_notifications_sent,
    'All users have been notified about the new drag-and-drop feature' as message
FROM notifications 
WHERE title = '🎉 New Feature: Drag & Drop Account Reordering!'
  AND created_at >= NOW() - INTERVAL '1 minute';

-- Optional: Check if any users have disabled new feature notifications
SELECT 
    'USERS_WITH_DISABLED_NOTIFICATIONS' as status,
    COUNT(DISTINCT np.user_id) as users_with_disabled_new_features,
    'These users have disabled new feature notifications' as message
FROM notification_preferences np
WHERE np.preference_key = 'notification_settings'
  AND (np.preference_value->'system'->>'new_features')::boolean = false;

-- Show sample of the notification that was sent
SELECT 
    'SAMPLE_NOTIFICATION' as status,
    title,
    body,
    type,
    created_at
FROM notifications 
WHERE title = '🎉 New Feature: Drag & Drop Account Reordering!'
ORDER BY created_at DESC
LIMIT 1;

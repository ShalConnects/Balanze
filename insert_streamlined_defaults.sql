-- Insert streamlined default notification preferences for users who don't have any yet
INSERT INTO public.notification_preferences (user_id, preference_key, preference_value)
SELECT 
    u.id,
    'notification_settings',
    '{
        "financial": {
            "overdue_payments": true,
            "due_soon_reminders": true,
            "low_balance_alerts": true
        },
        "system": {
            "new_features": true
        },
        "activity": {
            "account_changes": true
        },
        "communication": {
            "in_app_notifications": true,
            "email_notifications": false
        },
        "frequency": {
            "real_time": true,
            "daily_digest": false,
            "weekly_summary": false,
            "monthly_report": false
        }
    }'::jsonb
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np 
    WHERE np.user_id = u.id AND np.preference_key = 'notification_settings'
);

-- Show the count of new records inserted
SELECT COUNT(*) as new_records_inserted 
FROM public.notification_preferences 
WHERE preference_key = 'notification_settings';

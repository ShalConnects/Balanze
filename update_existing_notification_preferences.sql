-- Simple migration to update existing notification preferences
-- This only updates the data, doesn't try to recreate tables or policies

-- Update existing notification preferences to remove unwanted types
UPDATE public.notification_preferences 
SET preference_value = jsonb_build_object(
    'financial', jsonb_build_object(
        'overdue_payments', COALESCE((preference_value->'financial'->>'overdue_payments')::boolean, true),
        'due_soon_reminders', COALESCE((preference_value->'financial'->>'due_soon_reminders')::boolean, true),
        'low_balance_alerts', COALESCE((preference_value->'financial'->>'low_balance_alerts')::boolean, true)
    ),
    'system', jsonb_build_object(
        'new_features', COALESCE((preference_value->'system'->>'new_features')::boolean, true)
    ),
    'activity', jsonb_build_object(
        'account_changes', COALESCE((preference_value->'activity'->>'account_changes')::boolean, true)
    ),
    'communication', jsonb_build_object(
        'in_app_notifications', COALESCE((preference_value->'communication'->>'in_app_notifications')::boolean, true),
        'email_notifications', COALESCE((preference_value->'communication'->>'email_notifications')::boolean, false)
    ),
    'frequency', jsonb_build_object(
        'real_time', COALESCE((preference_value->'frequency'->>'real_time')::boolean, true),
        'daily_digest', COALESCE((preference_value->'frequency'->>'daily_digest')::boolean, false),
        'weekly_summary', COALESCE((preference_value->'frequency'->>'weekly_summary')::boolean, false),
        'monthly_report', COALESCE((preference_value->'frequency'->>'monthly_report')::boolean, false)
    )
),
updated_at = NOW()
WHERE preference_key = 'notification_settings';

-- Show the count of updated records
SELECT COUNT(*) as updated_records 
FROM public.notification_preferences 
WHERE preference_key = 'notification_settings';

-- Migration to remove unwanted notification types from existing user preferences
-- This script will update existing notification preferences to the streamlined version

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
        'email_notifications', COALESCE((preference_value->'communication'->>'email_notifications')::boolean, false),
        'quiet_hours_enabled', COALESCE((preference_value->'communication'->>'quiet_hours_enabled')::boolean, false),
        'quiet_hours_start', COALESCE(preference_value->'communication'->>'quiet_hours_start', '"22:00"'),
        'quiet_hours_end', COALESCE(preference_value->'communication'->>'quiet_hours_end', '"08:00"')
    ),
    'frequency', jsonb_build_object(
        'instant', COALESCE((preference_value->'frequency'->>'instant')::boolean, true),
        'real_time', COALESCE((preference_value->'frequency'->>'real_time')::boolean, true),
        'five_minute_test', COALESCE((preference_value->'frequency'->>'five_minute_test')::boolean, false),
        'daily_digest', COALESCE((preference_value->'frequency'->>'daily_digest')::boolean, false),
        'weekly_summary', COALESCE((preference_value->'frequency'->>'weekly_summary')::boolean, false),
        'monthly_report', COALESCE((preference_value->'frequency'->>'monthly_report')::boolean, false)
    )
),
updated_at = NOW()
WHERE preference_key = 'notification_settings'
AND (
    -- Only update if the old structure exists
    preference_value ? 'financial' AND (
        preference_value->'financial' ? 'upcoming_deadlines' OR
        preference_value->'financial' ? 'budget_exceeded' OR
        preference_value->'financial' ? 'large_transactions'
    )
    OR
    preference_value ? 'system' AND (
        preference_value->'system' ? 'system_updates' OR
        preference_value->'system' ? 'tips_guidance' OR
        preference_value->'system' ? 'security_alerts'
    )
    OR
    preference_value ? 'activity' AND (
        preference_value->'activity' ? 'transaction_confirmations' OR
        preference_value->'activity' ? 'category_updates' OR
        preference_value->'activity' ? 'backup_reminders'
    )
    OR
    preference_value ? 'communication' AND (
        preference_value->'communication' ? 'push_notifications'
    )
);

-- Log the migration
INSERT INTO public.migration_log (migration_name, executed_at, description)
VALUES (
    'notification_preferences_cleanup',
    NOW(),
    'Removed unwanted notification types: Budget Exceeded, Upcoming Deadlines, Large Transactions, Backup Reminders, Category Updates, Transaction Confirmations, Tips Guidance, System Updates, Security Alerts, Push Notifications'
) ON CONFLICT DO NOTHING;

-- Create migration_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    migration_name TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT
);

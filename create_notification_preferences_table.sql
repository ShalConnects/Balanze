-- Create notification_preferences table for storing user notification settings
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_key ON public.notification_preferences(preference_key);

-- Enable Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.notification_preferences TO authenticated;

-- Insert default notification preferences for existing users (streamlined version)
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

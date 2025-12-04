-- Complete reset of the last_wish_settings table
-- This will restore it to the original working state

-- 1. Drop the table completely (this will delete all data!)
DROP TABLE IF EXISTS last_wish_settings CASCADE;

-- 2. Recreate the table exactly as it was originally
CREATE TABLE last_wish_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    check_in_frequency INTEGER DEFAULT 30,
    last_check_in TIMESTAMP WITH TIME ZONE,
    recipients JSONB DEFAULT '[]'::jsonb,
    include_data JSONB DEFAULT '{
        "accounts": true,
        "transactions": true,
        "purchases": true,
        "lendBorrow": true,
        "savings": true,
        "analytics": true
    }'::jsonb,
    message TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_last_wish_settings_user_id ON last_wish_settings(user_id);
CREATE INDEX idx_last_wish_settings_enabled ON last_wish_settings(is_enabled) WHERE is_enabled = TRUE;

-- 4. Enable RLS
ALTER TABLE last_wish_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create the RLS policy
CREATE POLICY "Users can manage their own last wish settings" ON last_wish_settings
    FOR ALL USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON last_wish_settings TO authenticated;

-- 7. Create the trigger function
CREATE OR REPLACE FUNCTION update_last_wish_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the trigger
CREATE TRIGGER update_last_wish_settings_updated_at
    BEFORE UPDATE ON last_wish_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_last_wish_settings_updated_at();

-- 9. Test the setup
SELECT 'Table reset completed successfully' as status;
SELECT COUNT(*) as record_count FROM last_wish_settings;

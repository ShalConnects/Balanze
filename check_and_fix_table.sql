-- Check and fix the last_wish_settings table
-- This addresses the 406 error

-- 1. Check if the table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'last_wish_settings') 
        THEN 'Table exists' 
        ELSE 'Table does not exist' 
    END as table_status;

-- 2. If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS last_wish_settings (
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
CREATE INDEX IF NOT EXISTS idx_last_wish_settings_user_id ON last_wish_settings(user_id);

-- 4. Enable RLS
ALTER TABLE last_wish_settings ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own last wish settings" ON last_wish_settings;

-- 6. Create the RLS policy
CREATE POLICY "Users can manage their own last wish settings" ON last_wish_settings
    FOR ALL USING (auth.uid() = user_id);

-- 7. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON last_wish_settings TO authenticated;

-- 8. Test the setup
SELECT 'Table setup completed successfully' as status;

-- 9. Check if we can query the table (this should work if everything is set up correctly)
SELECT COUNT(*) as record_count FROM last_wish_settings;

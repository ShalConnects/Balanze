-- Comprehensive fix for Last Wish settings update failures
-- This addresses RLS policy and permission issues

-- 1. Check current table status
SELECT 'Starting Last Wish permissions fix...' as status;

-- 2. Ensure the table exists with correct structure
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

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_last_wish_settings_user_id ON last_wish_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_last_wish_settings_enabled ON last_wish_settings(is_enabled) WHERE is_enabled = TRUE;

-- 4. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage their own last wish settings" ON last_wish_settings;
DROP POLICY IF EXISTS "Users can view their own last wish settings" ON last_wish_settings;
DROP POLICY IF EXISTS "Users can insert their own last wish settings" ON last_wish_settings;
DROP POLICY IF EXISTS "Users can update their own last wish settings" ON last_wish_settings;
DROP POLICY IF EXISTS "Users can delete their own last wish settings" ON last_wish_settings;

-- 5. Enable RLS
ALTER TABLE last_wish_settings ENABLE ROW LEVEL SECURITY;

-- 6. Create comprehensive RLS policies
-- Policy for SELECT operations
CREATE POLICY "Users can view their own last wish settings" ON last_wish_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT operations
CREATE POLICY "Users can insert their own last wish settings" ON last_wish_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE operations
CREATE POLICY "Users can update their own last wish settings" ON last_wish_settings
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE operations
CREATE POLICY "Users can delete their own last wish settings" ON last_wish_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON last_wish_settings TO authenticated;

-- 8. Create the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_last_wish_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create the trigger
DROP TRIGGER IF EXISTS update_last_wish_settings_updated_at ON last_wish_settings;
CREATE TRIGGER update_last_wish_settings_updated_at
    BEFORE UPDATE ON last_wish_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_last_wish_settings_updated_at();

-- 10. Test the setup by checking if we can query the table
SELECT 'Permissions fix completed successfully' as status;

-- 11. Check if there are any existing records
SELECT COUNT(*) as existing_records FROM last_wish_settings;

-- 12. Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'last_wish_settings' 
ORDER BY ordinal_position;

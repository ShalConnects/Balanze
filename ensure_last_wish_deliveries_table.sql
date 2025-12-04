-- Ensure the last_wish_deliveries table exists with proper structure
-- Run this in Supabase Dashboard > SQL Editor

-- Create the last_wish_deliveries table if it doesn't exist
CREATE TABLE IF NOT EXISTS last_wish_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    delivery_data JSONB DEFAULT '{}'::jsonb,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_last_wish_deliveries_user_id ON last_wish_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_last_wish_deliveries_status ON last_wish_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_last_wish_deliveries_sent_at ON last_wish_deliveries(sent_at);

-- Enable RLS
ALTER TABLE last_wish_deliveries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own delivery records" ON last_wish_deliveries;
CREATE POLICY "Users can view their own delivery records" ON last_wish_deliveries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all delivery records" ON last_wish_deliveries;
CREATE POLICY "Service role can manage all delivery records" ON last_wish_deliveries
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_last_wish_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_last_wish_deliveries_updated_at ON last_wish_deliveries;
CREATE TRIGGER update_last_wish_deliveries_updated_at
    BEFORE UPDATE ON last_wish_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_last_wish_deliveries_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON last_wish_deliveries TO authenticated;
GRANT ALL ON last_wish_deliveries TO service_role;

SELECT 'Last Wish deliveries table created/updated successfully!' as status;

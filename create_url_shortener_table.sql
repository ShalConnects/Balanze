-- Create url_shortener table for attachment URL shortening
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS url_shortener (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_url_shortener_short_code ON url_shortener(short_code);
CREATE INDEX IF NOT EXISTS idx_url_shortener_purchase_id ON url_shortener(purchase_id);
CREATE INDEX IF NOT EXISTS idx_url_shortener_user_id ON url_shortener(user_id);
CREATE INDEX IF NOT EXISTS idx_url_shortener_expires_at ON url_shortener(expires_at);

-- Enable Row Level Security
ALTER TABLE url_shortener ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to see their own shortened URLs
CREATE POLICY "Users can view their own shortened URLs" ON url_shortener
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own shortened URLs
CREATE POLICY "Users can insert their own shortened URLs" ON url_shortener
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own shortened URLs
CREATE POLICY "Users can update their own shortened URLs" ON url_shortener
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own shortened URLs
CREATE POLICY "Users can delete their own shortened URLs" ON url_shortener
    FOR DELETE USING (auth.uid() = user_id);

-- Policy for public access to resolve short URLs (for the redirect endpoint)
CREATE POLICY "Public can resolve short URLs" ON url_shortener
    FOR SELECT USING (expires_at > NOW());

-- Create function to clean up expired URLs
CREATE OR REPLACE FUNCTION cleanup_expired_urls()
RETURNS void AS $$
BEGIN
    DELETE FROM url_shortener WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired URLs (optional)
-- This would need to be set up in your Supabase cron jobs
-- SELECT cron.schedule('cleanup-expired-urls', '0 2 * * *', 'SELECT cleanup_expired_urls();');

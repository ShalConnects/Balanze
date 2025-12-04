-- Create purchase_attachments table if it doesn't exist
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS purchase_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_attachments_purchase_id ON purchase_attachments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_attachments_user_id ON purchase_attachments(user_id);

-- Enable Row Level Security
ALTER TABLE purchase_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to see their own attachments
CREATE POLICY "Users can view their own purchase attachments" ON purchase_attachments
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own attachments
CREATE POLICY "Users can insert their own purchase attachments" ON purchase_attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own attachments
CREATE POLICY "Users can update their own purchase attachments" ON purchase_attachments
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own attachments
CREATE POLICY "Users can delete their own purchase attachments" ON purchase_attachments
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchase_attachments_updated_at 
    BEFORE UPDATE ON purchase_attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 
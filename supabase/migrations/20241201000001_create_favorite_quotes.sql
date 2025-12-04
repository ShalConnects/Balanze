-- Create favorite_quotes table for storing user-specific favorite quotes
CREATE TABLE IF NOT EXISTS favorite_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quote TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT CHECK (category IN ('financial', 'motivation', 'success', 'wisdom')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorite_quotes_user_id ON favorite_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_quotes_category ON favorite_quotes(category);

-- Create unique constraint to prevent duplicate quotes for the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_quotes_user_quote_author 
ON favorite_quotes(user_id, quote, author);

-- Create RLS policies
ALTER TABLE favorite_quotes ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own favorite quotes
CREATE POLICY "Users can manage their own favorite quotes" ON favorite_quotes
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_favorite_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_favorite_quotes_updated_at
    BEFORE UPDATE ON favorite_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_favorite_quotes_updated_at();

-- Grant necessary permissions
GRANT ALL ON favorite_quotes TO authenticated; 
-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT CHECK (status IN ('planned', 'purchased', 'cancelled')) DEFAULT 'planned',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchases
CREATE POLICY "Users can view their own purchases"
    ON purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
    ON purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases"
    ON purchases FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases"
    ON purchases FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_category ON purchases(category);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date DESC); 
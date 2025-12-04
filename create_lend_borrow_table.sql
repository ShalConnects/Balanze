-- Create lend_borrow table for tracking money lent and borrowed
CREATE TABLE IF NOT EXISTS lend_borrow (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('lend', 'borrow')),
    person_name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'cancelled')),
    interest_rate DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lend_borrow_user_id ON lend_borrow(user_id);
CREATE INDEX IF NOT EXISTS idx_lend_borrow_type ON lend_borrow(type);
CREATE INDEX IF NOT EXISTS idx_lend_borrow_status ON lend_borrow(status);
CREATE INDEX IF NOT EXISTS idx_lend_borrow_due_date ON lend_borrow(due_date);
CREATE INDEX IF NOT EXISTS idx_lend_borrow_person_name ON lend_borrow(person_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_lend_borrow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lend_borrow_updated_at
    BEFORE UPDATE ON lend_borrow
    FOR EACH ROW
    EXECUTE FUNCTION update_lend_borrow_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE lend_borrow ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own lend_borrow records" ON lend_borrow
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lend_borrow records" ON lend_borrow
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lend_borrow records" ON lend_borrow
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lend_borrow records" ON lend_borrow
    FOR DELETE USING (auth.uid() = user_id); 
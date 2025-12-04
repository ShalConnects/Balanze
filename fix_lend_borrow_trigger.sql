-- Fix lend_borrow table trigger issue
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_lend_borrow_updated_at ON lend_borrow;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_lend_borrow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_lend_borrow_updated_at
    BEFORE UPDATE ON lend_borrow
    FOR EACH ROW
    EXECUTE FUNCTION update_lend_borrow_updated_at();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own lend_borrow records" ON lend_borrow;
DROP POLICY IF EXISTS "Users can insert their own lend_borrow records" ON lend_borrow;
DROP POLICY IF EXISTS "Users can update their own lend_borrow records" ON lend_borrow;
DROP POLICY IF EXISTS "Users can delete their own lend_borrow records" ON lend_borrow;

-- Create RLS policies
CREATE POLICY "Users can view their own lend_borrow records" ON lend_borrow
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lend_borrow records" ON lend_borrow
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lend_borrow records" ON lend_borrow
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lend_borrow records" ON lend_borrow
    FOR DELETE USING (auth.uid() = user_id); 
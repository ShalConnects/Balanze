-- Create table for tracking multiple partial returns
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lend_borrow_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lend_borrow_id UUID REFERENCES lend_borrow(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for the new table
ALTER TABLE lend_borrow_returns ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own returns
CREATE POLICY "Users can view their own lend_borrow_returns" ON lend_borrow_returns
  FOR SELECT USING (
    lend_borrow_id IN (
      SELECT id FROM lend_borrow WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to insert their own returns
CREATE POLICY "Users can insert their own lend_borrow_returns" ON lend_borrow_returns
  FOR INSERT WITH CHECK (
    lend_borrow_id IN (
      SELECT id FROM lend_borrow WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to update their own returns
CREATE POLICY "Users can update their own lend_borrow_returns" ON lend_borrow_returns
  FOR UPDATE USING (
    lend_borrow_id IN (
      SELECT id FROM lend_borrow WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to delete their own returns
CREATE POLICY "Users can delete their own lend_borrow_returns" ON lend_borrow_returns
  FOR DELETE USING (
    lend_borrow_id IN (
      SELECT id FROM lend_borrow WHERE user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lend_borrow_returns_lend_borrow_id ON lend_borrow_returns(lend_borrow_id);
CREATE INDEX IF NOT EXISTS idx_lend_borrow_returns_created_at ON lend_borrow_returns(created_at); 
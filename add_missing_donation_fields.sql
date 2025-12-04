-- Add missing fields to donation_saving_records table
ALTER TABLE donation_saving_records 
ADD COLUMN IF NOT EXISTS mode_value NUMERIC,
ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'pending' CHECK (status IN ('pending', 'donated'));
 
-- Add index for status field for better query performance
CREATE INDEX IF NOT EXISTS idx_donation_saving_status ON donation_saving_records(status); 
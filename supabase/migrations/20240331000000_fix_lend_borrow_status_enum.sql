-- Fix lend_borrow status enum to match frontend expectations
-- Change 'paid' to 'settled' and 'cancelled' to 'overdue' for consistency

-- First, update existing records
UPDATE lend_borrow SET status = 'settled' WHERE status = 'paid';
UPDATE lend_borrow SET status = 'overdue' WHERE status = 'cancelled';

-- Drop the existing check constraint
ALTER TABLE lend_borrow DROP CONSTRAINT IF EXISTS lend_borrow_status_check;

-- Add the new check constraint with correct status values
ALTER TABLE lend_borrow ADD CONSTRAINT lend_borrow_status_check 
    CHECK (status IN ('active', 'settled', 'overdue'));

-- Also remove the interest_rate column since we removed it from the frontend
ALTER TABLE lend_borrow DROP COLUMN IF EXISTS interest_rate;

-- Add partial return fields if they don't exist
ALTER TABLE lend_borrow ADD COLUMN IF NOT EXISTS partial_return_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lend_borrow ADD COLUMN IF NOT EXISTS partial_return_date DATE; 
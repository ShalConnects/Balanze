-- Remove installment-related fields from lend_borrow table
ALTER TABLE lend_borrow 
DROP COLUMN IF EXISTS has_installments,
DROP COLUMN IF EXISTS installment_count,
DROP COLUMN IF EXISTS installment_frequency,
DROP COLUMN IF EXISTS installment_start_date,
DROP COLUMN IF EXISTS installment_amount;

-- Drop the installments table
DROP TABLE IF EXISTS lend_borrow_installments;

-- Add a partial_return_amount field to track partial returns
ALTER TABLE lend_borrow 
ADD COLUMN IF NOT EXISTS partial_return_amount DECIMAL(15,2) DEFAULT 0.00;

-- Add a partial_return_date field to track when partial returns were made
ALTER TABLE lend_borrow 
ADD COLUMN IF NOT EXISTS partial_return_date TIMESTAMP WITH TIME ZONE; 
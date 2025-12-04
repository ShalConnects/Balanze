-- Fix purchase_attachments table schema to use UUID instead of VARCHAR(8)
-- This will restore the original working schema

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE purchase_attachments DROP CONSTRAINT IF EXISTS purchase_attachments_purchase_id_fkey;

-- Change the purchase_id column back to UUID
ALTER TABLE purchase_attachments ALTER COLUMN purchase_id TYPE UUID USING purchase_id::UUID;

-- Add the correct foreign key constraint back
ALTER TABLE purchase_attachments 
  ADD CONSTRAINT purchase_attachments_purchase_id_fkey 
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE;

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'purchase_attachments' 
  AND column_name = 'purchase_id'; 
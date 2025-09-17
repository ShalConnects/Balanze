-- Simple fix to add the missing delivery_triggered column
-- Run this in Supabase SQL Editor

-- Add the missing column
ALTER TABLE last_wish_settings 
ADD COLUMN delivery_triggered BOOLEAN DEFAULT FALSE;

-- Update existing records
UPDATE last_wish_settings 
SET delivery_triggered = false 
WHERE delivery_triggered IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'last_wish_settings' 
AND column_name = 'delivery_triggered';

-- Show success message
SELECT 'delivery_triggered column added successfully!' as status;

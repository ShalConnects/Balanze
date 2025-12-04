-- Check if purchase_attachments table exists and has correct structure
-- Run this in your Supabase SQL Editor

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'purchase_attachments'
) as table_exists;

-- If table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'purchase_attachments'
ORDER BY ordinal_position;

-- Check if there are any existing attachments
SELECT COUNT(*) as total_attachments FROM purchase_attachments;

-- Show sample attachments if any exist
SELECT * FROM purchase_attachments LIMIT 5;

-- Check if the table has the correct RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'purchase_attachments'; 
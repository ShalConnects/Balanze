-- Delete an existing user account from Supabase
-- Replace 'user_email_or_id' with the actual email or user ID you want to delete

-- Option 1: Delete by user ID (recommended)
DELETE FROM auth.users 
WHERE id = 'user_id_here';

-- Option 2: Delete by email
DELETE FROM auth.users 
WHERE email = 'user_email_here';

-- Option 3: Delete by email (case insensitive)
DELETE FROM auth.users 
WHERE LOWER(email) = LOWER('user_email_here');

-- Option 4: Delete multiple users by email pattern
DELETE FROM auth.users 
WHERE email LIKE '%@example.com';

-- Option 5: Delete user and all related data (if you have foreign key constraints)
-- This will cascade delete related records in other tables
DELETE FROM auth.users 
WHERE id = 'user_id_here'
CASCADE;

-- Example with actual values:
-- DELETE FROM auth.users WHERE email = 'test@example.com';
-- DELETE FROM auth.users WHERE id = 'a68ec4f5-72b0-4982-a2f1-eab24c98f316';

-- 🎯 READY TO EXECUTE - Delete specific user:
DELETE FROM auth.users WHERE id = 'a68ec4f5-72b0-4982-a2f1-eab24c98f316';

-- Alternative: Delete related data first, then user (if needed):
-- First delete from your custom tables (if they exist):
-- DELETE FROM accounts WHERE user_id = 'a68ec4f5-72b0-4982-a2f1-eab24c98f316';
-- DELETE FROM transactions WHERE user_id = 'a68ec4f5-72b0-4982-a2f1-eab24c98f316';
-- DELETE FROM purchases WHERE user_id = 'a68ec4f5-72b0-4982-a2f1-eab24c98f316';
-- Then delete the user:
-- DELETE FROM auth.users WHERE id = 'a68ec4f5-72b0-4982-a2f1-eab24c98f316';

-- ⚠️ WARNING: This will permanently delete the user and all their data
-- Make sure to backup any important data before running this command
-- Consider using soft delete (marking as deleted) instead of hard delete 
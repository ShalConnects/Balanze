-- Disable email confirmation requirement for quick SaaS launch
-- This allows users to sign up and log in immediately

-- Update Supabase auth settings to disable email confirmation
-- Note: This needs to be done in Supabase Dashboard > Authentication > Settings

-- Alternative: Update the auth store to handle unconfirmed users
-- This is a temporary fix for development/production launch

-- Check current auth settings
SELECT * FROM auth.users LIMIT 1;

-- If you want to enable all existing users without email confirmation:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- For new signups, you can modify the auth store to not require email confirmation
-- This is done in the frontend code, not database 
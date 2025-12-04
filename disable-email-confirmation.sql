-- Disable email confirmation requirement in Supabase
-- Run this in your Supabase SQL editor if you have admin access

-- Option 1: Disable email confirmation globally (if you have admin access)
-- This requires admin privileges in Supabase

-- Option 2: Create a trigger to auto-confirm users (safer approach)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm the user's email
  UPDATE auth.users 
  SET email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Option 3: Update existing users to be confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Option 4: Create a function to manually confirm users
CREATE OR REPLACE FUNCTION confirm_user_email(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage: SELECT confirm_user_email('user@test.com'); 
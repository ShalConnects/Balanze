-- Comprehensive Duplicate Email Prevention Fix
-- This script creates robust database-level protection against duplicate emails
-- Run this in your Supabase SQL Editor

-- =====================================================
-- PART 0: CLEAN UP EXISTING FUNCTIONS (AVOID CONFLICTS)
-- =====================================================

-- Drop existing triggers FIRST (they depend on functions)
DROP TRIGGER IF EXISTS prevent_duplicate_email_insert ON auth.users;
DROP TRIGGER IF EXISTS prevent_duplicate_email_update ON auth.users;
DROP TRIGGER IF EXISTS prevent_duplicate_email ON auth.users;
DROP TRIGGER IF EXISTS prevent_oauth_email_duplicate ON auth.users;

-- Now drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS check_email_exists(TEXT);
DROP FUNCTION IF EXISTS get_user_by_email(TEXT);
DROP FUNCTION IF EXISTS prevent_duplicate_email_signup();
DROP FUNCTION IF EXISTS prevent_duplicate_signup();
DROP FUNCTION IF EXISTS prevent_oauth_duplicate();
DROP FUNCTION IF EXISTS find_duplicate_emails();
DROP FUNCTION IF EXISTS cleanup_duplicate_emails();

-- =====================================================
-- PART 1: CREATE EMAIL CHECKING FUNCTIONS
-- =====================================================

-- Function to check if email exists (already exists, but ensuring it's robust)
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count users with this email (case insensitive)
    SELECT COUNT(*) INTO user_count 
    FROM auth.users 
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(email_to_check))
    AND deleted_at IS NULL; -- Only count non-deleted users
    
    RETURN user_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user ID by email (for OAuth duplicate checking)
CREATE OR REPLACE FUNCTION get_user_by_email(email_to_check TEXT)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id
    FROM auth.users 
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(email_to_check))
    AND deleted_at IS NULL
    LIMIT 1;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 2: CREATE DUPLICATE PREVENTION TRIGGERS
-- =====================================================

-- Function to prevent duplicate email signups
CREATE OR REPLACE FUNCTION prevent_duplicate_email_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip check if this is an update and email hasn't changed
    IF TG_OP = 'UPDATE' AND OLD.email = NEW.email THEN
        RETURN NEW;
    END IF;
    
    -- Check if email already exists (case insensitive)
    IF EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
        AND id != NEW.id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_EMAIL: This email address is already registered. Please use a different email or try logging in with your existing account.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS prevent_duplicate_email_insert ON auth.users;
DROP TRIGGER IF EXISTS prevent_duplicate_email_update ON auth.users;

-- Create triggers for both INSERT and UPDATE
CREATE TRIGGER prevent_duplicate_email_insert
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_email_signup();

CREATE TRIGGER prevent_duplicate_email_update
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_email_signup();

-- =====================================================
-- PART 3: CREATE AUDIT AND MONITORING FUNCTIONS
-- =====================================================

-- Function to find existing duplicate emails (for cleanup)
CREATE OR REPLACE FUNCTION find_duplicate_emails()
RETURNS TABLE(email TEXT, user_count BIGINT, user_ids UUID[], created_dates TIMESTAMPTZ[]) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.email::TEXT,
        COUNT(*) as user_count,
        ARRAY_AGG(u.id) as user_ids,
        ARRAY_AGG(u.created_at) as created_dates
    FROM auth.users u
    WHERE u.deleted_at IS NULL
    GROUP BY u.email
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely clean up duplicate emails (keeps the oldest account)
CREATE OR REPLACE FUNCTION cleanup_duplicate_emails()
RETURNS TABLE(cleaned_email TEXT, kept_user_id UUID, removed_user_ids UUID[]) AS $$
DECLARE
    duplicate_record RECORD;
    oldest_user_id UUID;
    users_to_remove UUID[];
BEGIN
    -- Find all duplicate emails
    FOR duplicate_record IN 
        SELECT email, user_ids, created_dates 
        FROM find_duplicate_emails()
    LOOP
        -- Find the oldest user (first created)
        SELECT user_ids[array_position(created_dates, (SELECT MIN(unnest) FROM unnest(created_dates)))]
        INTO oldest_user_id
        FROM (SELECT duplicate_record.user_ids as user_ids, duplicate_record.created_dates as created_dates) t;
        
        -- Get list of users to remove (all except oldest)
        SELECT ARRAY(
            SELECT unnest(duplicate_record.user_ids) 
            EXCEPT 
            SELECT oldest_user_id
        ) INTO users_to_remove;
        
        -- Soft delete the duplicate users (don't actually delete, just mark as deleted)
        UPDATE auth.users 
        SET deleted_at = NOW()
        WHERE id = ANY(users_to_remove);
        
        -- Return the cleanup info
        RETURN QUERY SELECT 
            duplicate_record.email::TEXT,
            oldest_user_id,
            users_to_remove;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 4: VERIFICATION AND TESTING
-- =====================================================

-- Test the functions
DO $$
BEGIN
    RAISE NOTICE '=== TESTING EMAIL CHECK FUNCTIONS ===';
    
    -- Test email existence check
    IF check_email_exists('test@example.com') THEN
        RAISE NOTICE 'Email test@example.com exists';
    ELSE
        RAISE NOTICE 'Email test@example.com does not exist';
    END IF;
    
    RAISE NOTICE '=== FUNCTIONS CREATED SUCCESSFULLY ===';
END $$;

-- Show current duplicate emails (if any)
SELECT '=== CURRENT DUPLICATE EMAILS ===' as info;
SELECT * FROM find_duplicate_emails();

-- Show created triggers
SELECT '=== CREATED TRIGGERS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%prevent_duplicate_email%'
ORDER BY trigger_name;

-- Show created functions
SELECT '=== CREATED FUNCTIONS ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'check_email_exists', 
    'get_user_by_email', 
    'prevent_duplicate_email_signup',
    'find_duplicate_emails',
    'cleanup_duplicate_emails'
)
ORDER BY routine_name;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
/*
1. Run this script in your Supabase SQL Editor
2. Check the output to see if there are any existing duplicate emails
3. If duplicates exist, you can run: SELECT * FROM cleanup_duplicate_emails();
4. Test the system by trying to register with an existing email
5. The triggers will now prevent duplicates at the database level
6. The functions provide both checking and cleanup capabilities

IMPORTANT NOTES:
- This uses soft deletion (sets deleted_at) rather than hard deletion
- The oldest account is always kept when cleaning up duplicates
- All functions are SECURITY DEFINER so they run with elevated privileges
- The triggers work for both INSERT and UPDATE operations
*/

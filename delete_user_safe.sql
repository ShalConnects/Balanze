-- =====================================================
-- SAFE USER DELETION SCRIPT
-- =====================================================

-- WARNING: This will permanently delete the user and ALL their data
-- Make sure you have a backup before running this!

-- Replace 'user_email@example.com' with the actual email
DO $$
DECLARE
    user_id_to_delete UUID;
    user_email TEXT := 'user_email@example.com'; -- CHANGE THIS
BEGIN
    -- Get the user ID from email
    SELECT id INTO user_id_to_delete 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id_to_delete IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: % for email: %', user_id_to_delete, user_email;
    
    -- Delete user data from all tables (in correct order due to foreign keys)
    -- 1. Delete from custom tables first
    DELETE FROM public.notifications WHERE user_id = user_id_to_delete;
    DELETE FROM public.last_wish_deliveries WHERE user_id = user_id_to_delete;
    DELETE FROM public.last_wish_settings WHERE user_id = user_id_to_delete;
    DELETE FROM public.lend_borrow WHERE user_id = user_id_to_delete;
    DELETE FROM public.purchases WHERE user_id = user_id_to_delete;
    DELETE FROM public.transactions WHERE user_id = user_id_to_delete;
    DELETE FROM public.accounts WHERE user_id = user_id_to_delete;
    DELETE FROM public.savings_goals WHERE user_id = user_id_to_delete;
    DELETE FROM public.profiles WHERE id = user_id_to_delete;
    
    -- 2. Finally delete from auth.users (this will cascade to auth.identities)
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RAISE NOTICE 'User % and all associated data deleted successfully', user_email;
END $$;

-- Alternative: Delete by user ID directly
-- DELETE FROM auth.users WHERE id = 'user-uuid-here'; 
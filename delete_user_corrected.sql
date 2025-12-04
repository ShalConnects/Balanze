-- =====================================================
-- CORRECTED USER DELETION SCRIPT
-- =====================================================

-- WARNING: This will permanently delete the user and ALL their data
-- Make sure you have a backup before running this!

-- Replace 'user_email@example.com' with the actual email
DO $$
DECLARE
    user_id_to_delete UUID;
    user_email TEXT := 'user_email@example.com'; -- CHANGE THIS
    table_name TEXT;
    column_name TEXT;
    delete_query TEXT;
    result_count INTEGER;
BEGIN
    -- Get the user ID from email
    SELECT id INTO user_id_to_delete 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id_to_delete IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: % for email: %', user_id_to_delete, user_email;
    
    -- Delete from tables that definitely exist and have user_id column
    -- We'll check each table individually to avoid errors
    
    -- 1. Delete from notifications (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DELETE FROM public.notifications WHERE user_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % notifications', result_count;
        END IF;
    END IF;
    
    -- 2. Delete from last_wish_deliveries (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'last_wish_deliveries' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'last_wish_deliveries' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DELETE FROM public.last_wish_deliveries WHERE user_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % last wish deliveries', result_count;
        END IF;
    END IF;
    
    -- 3. Delete from last_wish_settings (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'last_wish_settings' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'last_wish_settings' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DELETE FROM public.last_wish_settings WHERE user_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % last wish settings', result_count;
        END IF;
    END IF;
    
    -- 4. Delete from lend_borrow (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lend_borrow' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lend_borrow' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DELETE FROM public.lend_borrow WHERE user_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % lend/borrow records', result_count;
        END IF;
    END IF;
    
    -- 5. Delete from purchases (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DELETE FROM public.purchases WHERE user_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % purchases', result_count;
        END IF;
    END IF;
    
    -- 6. Delete from transactions (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DELETE FROM public.transactions WHERE user_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % transactions', result_count;
        END IF;
    END IF;
    
    -- 7. Delete from accounts (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DELETE FROM public.accounts WHERE user_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % accounts', result_count;
        END IF;
    END IF;
    
    -- 8. Delete from savings_goals (if table exists) - check for different column names
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'savings_goals' AND table_schema = 'public') THEN
        -- Check if it has user_id column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DELETE FROM public.savings_goals WHERE user_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % savings goals', result_count;
        -- Check if it has profile_id column (common alternative)
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'profile_id' AND table_schema = 'public') THEN
            DELETE FROM public.savings_goals WHERE profile_id = user_id_to_delete;
            GET DIAGNOSTICS result_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % savings goals (using profile_id)', result_count;
        END IF;
    END IF;
    
    -- 9. Finally delete from profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        DELETE FROM public.profiles WHERE id = user_id_to_delete;
        GET DIAGNOSTICS result_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % profile records', result_count;
    END IF;
    
    -- 10. Finally delete from auth.users (this will cascade to auth.identities)
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    GET DIAGNOSTICS result_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user from auth.users', result_count;
    
    RAISE NOTICE 'User % and all associated data deleted successfully', user_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during deletion: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        -- Continue with auth.users deletion even if some tables fail
        DELETE FROM auth.users WHERE id = user_id_to_delete;
        RAISE NOTICE 'User deleted from auth.users despite errors in other tables';
END $$; 
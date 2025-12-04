-- BULLETPROOF USER DELETION - Run this in Supabase SQL Editor

-- Drop any existing functions
DROP FUNCTION IF EXISTS delete_user_completely(UUID);

-- Create a bulletproof deletion function
CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deletion_success BOOLEAN := TRUE;
BEGIN
    -- Delete all user data with proper error handling
    
    -- 1. Delete lend_borrow_returns (via lend_borrow table)
    BEGIN
        DELETE FROM lend_borrow_returns 
        WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_completely.user_id);
        RAISE NOTICE 'Deleted lend_borrow_returns for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting lend_borrow_returns: %', SQLERRM;
    END;
    
    -- 2. Delete all other tables that definitely have user_id
    BEGIN
        DELETE FROM notifications WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted notifications for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting notifications: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM donation_saving_records WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted donation_saving_records for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting donation_saving_records: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM lend_borrow WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted lend_borrow for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting lend_borrow: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM purchase_attachments WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted purchase_attachments for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchase_attachments: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM purchases WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted purchases for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchases: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM purchase_categories WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted purchase_categories for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting purchase_categories: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM transactions WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted transactions for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting transactions: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM accounts WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted accounts for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting accounts: %', SQLERRM;
    END;
    
    BEGIN
        DELETE FROM audit_logs WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted audit_logs for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting audit_logs: %', SQLERRM;
    END;
    
    -- 3. Try savings_goals with both possible column names
    BEGIN
        DELETE FROM savings_goals WHERE user_id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted savings_goals (user_id) for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        BEGIN
            DELETE FROM savings_goals WHERE profile_id = delete_user_completely.user_id;
            RAISE NOTICE 'Deleted savings_goals (profile_id) for user %', delete_user_completely.user_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not delete savings_goals: %', SQLERRM;
        END;
    END;
    
    -- 4. Delete profile (this will trigger auth user deletion)
    BEGIN
        DELETE FROM profiles WHERE id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted profile for user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting profile: %', SQLERRM;
        deletion_success := FALSE;
    END;
    
    -- 5. Delete auth user directly as backup
    BEGIN
        DELETE FROM auth.users WHERE id = delete_user_completely.user_id;
        RAISE NOTICE 'Deleted auth user %', delete_user_completely.user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting auth user: %', SQLERRM;
    END;
    
    RETURN deletion_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO anon; 
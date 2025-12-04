-- SIMPLE USER DELETION FIX
-- Run this in your Supabase SQL Editor - ONE TIME ONLY

-- Drop any existing functions
DROP FUNCTION IF EXISTS delete_user_completely(UUID);

-- Create a simple, working deletion function
CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete in the correct order to avoid foreign key issues
    
    -- 1. Delete lend_borrow_returns first (they reference lend_borrow)
    DELETE FROM lend_borrow_returns 
    WHERE lend_borrow_id IN (SELECT id FROM lend_borrow WHERE user_id = delete_user_completely.user_id);
    
    -- 2. Delete all other user data
    DELETE FROM notifications WHERE user_id = delete_user_completely.user_id;
    DELETE FROM donation_saving_records WHERE user_id = delete_user_completely.user_id;
    DELETE FROM lend_borrow WHERE user_id = delete_user_completely.user_id;
    DELETE FROM purchase_attachments WHERE user_id = delete_user_completely.user_id;
    DELETE FROM purchases WHERE user_id = delete_user_completely.user_id;
    DELETE FROM purchase_categories WHERE user_id = delete_user_completely.user_id;
    DELETE FROM transactions WHERE user_id = delete_user_completely.user_id;
    DELETE FROM accounts WHERE user_id = delete_user_completely.user_id;
    DELETE FROM savings_goals WHERE user_id = delete_user_completely.user_id;
    DELETE FROM audit_logs WHERE user_id = delete_user_completely.user_id;
    
    -- 3. Delete profile (this will trigger auth user deletion)
    DELETE FROM profiles WHERE id = delete_user_completely.user_id;
    
    -- 4. Delete auth user directly (backup)
    DELETE FROM auth.users WHERE id = delete_user_completely.user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO anon; 
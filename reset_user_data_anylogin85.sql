-- =====================================================
-- USER DATA RESET SCRIPT
-- Target User: anylogin85@gmail.com
-- User ID: 0d497c5c-3242-425e-aa73-1081385f46e5
-- WARNING: This will permanently delete ALL user data
-- =====================================================

-- First, let's verify the user exists and get their ID
DO $$
DECLARE
    target_user_id UUID := '0d497c5c-3242-425e-aa73-1081385f46e5';
    user_email TEXT := 'anylogin85@gmail.com';
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    -- Verify the user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id AND email = user_email) THEN
        RAISE NOTICE 'User with ID % and email % not found', target_user_id, user_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Starting data reset for user: % (ID: %)', user_email, target_user_id;
    RAISE NOTICE '==========================================';
    
    -- Delete user data in the correct order (respecting foreign key constraints)
    
    -- 1. Delete DPS transfers
    DELETE FROM dps_transfers WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % DPS transfers', deleted_count;
    
    -- 2. Delete lend/borrow records
    DELETE FROM lend_borrow WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % lend/borrow records', deleted_count;
    
    -- 3. Delete donation saving records
    DELETE FROM donation_saving_records WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % donation saving records', deleted_count;
    
    -- 4. Delete savings goals
    DELETE FROM savings_goals WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % savings goals', deleted_count;
    
    -- 5. Delete purchase attachments
    DELETE FROM purchase_attachments WHERE purchase_id IN (
        SELECT id FROM purchases WHERE user_id = target_user_id
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % purchase attachments', deleted_count;
    
    -- 6. Delete purchases
    DELETE FROM purchases WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % purchases', deleted_count;
    
    -- 7. Delete transactions
    DELETE FROM transactions WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % transactions', deleted_count;
    
    -- 8. Delete accounts
    DELETE FROM accounts WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % accounts', deleted_count;
    
    -- 9. Delete activity history
    DELETE FROM activity_history WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % activity history records', deleted_count;
    
    -- 10. Delete notifications
    DELETE FROM notifications WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % notifications', deleted_count;
    
    -- 11. Delete notification preferences
    DELETE FROM notification_preferences WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % notification preferences', deleted_count;
    
    -- 12. Delete last wish settings
    DELETE FROM last_wish_settings WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % last wish settings', deleted_count;
    
    -- 13. Delete last wish deliveries
    DELETE FROM last_wish_deliveries WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % last wish deliveries', deleted_count;
    
    -- 14. Delete subscription history
    DELETE FROM subscription_history WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % subscription history records', deleted_count;
    
    -- 15. Delete notes
    DELETE FROM notes WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % notes', deleted_count;
    
    -- 16. Delete tasks
    DELETE FROM tasks WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % tasks', deleted_count;
    
    -- 17. Delete URL shortener records
    DELETE FROM url_shortener WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % URL shortener records', deleted_count;
    
    -- 18. Delete user preferences
    DELETE FROM user_preferences WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % user preferences', deleted_count;
    
    -- 19. Delete favorite quotes
    DELETE FROM favorite_quotes WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % favorite quotes', deleted_count;
    
    -- 20. Reset profile to default (don't delete, just reset)
    UPDATE profiles SET 
        full_name = NULL,
        profile_picture = NULL,
        local_currency = 'USD',
        selected_currencies = NULL,
        subscription = '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
        updated_at = NOW()
    WHERE id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Reset % profile records', deleted_count;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Data reset completed for user: %', user_email;
    RAISE NOTICE 'Total records deleted: %', total_deleted;
    RAISE NOTICE 'User account remains active and can login normally';
    RAISE NOTICE 'User will see onboarding flow on next login';
    
END $$;

-- =====================================================
-- CHECK USER DATA BEFORE DELETION
-- =====================================================

-- Replace 'user_email@example.com' with the actual email
DO $$
DECLARE
    user_id_to_check UUID;
    user_email TEXT := 'user_email@example.com'; -- CHANGE THIS
    accounts_count INTEGER;
    transactions_count INTEGER;
    purchases_count INTEGER;
    lend_borrow_count INTEGER;
    savings_count INTEGER;
    notifications_count INTEGER;
BEGIN
    -- Get the user ID from email
    SELECT id INTO user_id_to_check 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id_to_check IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    RAISE NOTICE 'Checking data for user ID: % (email: %)', user_id_to_check, user_email;
    
    -- Count data in each table
    SELECT COUNT(*) INTO accounts_count FROM public.accounts WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO transactions_count FROM public.transactions WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO purchases_count FROM public.purchases WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO lend_borrow_count FROM public.lend_borrow WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO savings_count FROM public.savings_goals WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO notifications_count FROM public.notifications WHERE user_id = user_id_to_check;
    
    -- Display summary
    RAISE NOTICE 'Data summary for user %:', user_email;
    RAISE NOTICE '  - Accounts: %', accounts_count;
    RAISE NOTICE '  - Transactions: %', transactions_count;
    RAISE NOTICE '  - Purchases: %', purchases_count;
    RAISE NOTICE '  - Lend/Borrow records: %', lend_borrow_count;
    RAISE NOTICE '  - Savings goals: %', savings_count;
    RAISE NOTICE '  - Notifications: %', notifications_count;
    
    -- Show profile info
    RAISE NOTICE 'Profile info:';
    SELECT full_name, local_currency INTO STRICT user_name, user_currency 
    FROM public.profiles WHERE id = user_id_to_check;
    RAISE NOTICE '  - Name: %', user_name;
    RAISE NOTICE '  - Currency: %', user_currency;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE NOTICE 'No profile found for this user';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error checking user data: %', SQLERRM;
END $$; 
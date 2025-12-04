-- Manual achievement migration for specific user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the debug results

-- Get your user ID first
SELECT 'Your user ID:' as info, id as user_id FROM auth.users LIMIT 1;

-- Then run this with your actual user ID (replace YOUR_USER_ID_HERE)
-- Award badges based on existing data
DO $$
DECLARE
    user_id_to_check UUID := 'YOUR_USER_ID_HERE'; -- Replace with your actual user ID
    account_count INTEGER;
    transaction_count INTEGER;
    category_count INTEGER;
    savings_goal_count INTEGER;
    lend_count INTEGER;
    borrow_count INTEGER;
    purchase_count INTEGER;
    investment_count INTEGER;
    donation_count INTEGER;
    last_wish_count INTEGER;
BEGIN
    -- Count user's existing data
    SELECT COUNT(*) INTO account_count FROM accounts WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO transaction_count FROM transactions WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO category_count FROM categories WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO savings_goal_count FROM savings_goals WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO lend_count FROM lend_borrow WHERE user_id = user_id_to_check AND type = 'lend';
    SELECT COUNT(*) INTO borrow_count FROM lend_borrow WHERE user_id = user_id_to_check AND type = 'borrow';
    SELECT COUNT(*) INTO purchase_count FROM purchases WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO investment_count FROM investment_assets WHERE user_id = user_id_to_check;
    SELECT COUNT(*) INTO donation_count FROM donation_saving_records WHERE user_id = user_id_to_check AND type = 'donation';
    SELECT COUNT(*) INTO last_wish_count FROM last_wish_settings WHERE user_id = user_id_to_check;
    
    -- Show what we found
    RAISE NOTICE 'User data counts: accounts=%, transactions=%, categories=%, savings_goals=%, lend=%, borrow=%, purchases=%, investments=%, donations=%, last_wish=%', 
        account_count, transaction_count, category_count, savings_goal_count, lend_count, borrow_count, purchase_count, investment_count, donation_count, last_wish_count;
    
    -- Award badges based on data
    IF account_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'First Steps' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded First Steps badge';
    END IF;
    
    IF transaction_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Transaction Tracker' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Transaction Tracker badge';
    END IF;
    
    IF category_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Category Creator' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Category Creator badge';
    END IF;
    
    IF savings_goal_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Goal Setter' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Goal Setter badge';
    END IF;
    
    IF lend_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Lending Helper' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Lending Helper badge';
    END IF;
    
    IF borrow_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Borrowing Boss' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Borrowing Boss badge';
    END IF;
    
    IF purchase_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Purchase Tracker' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Purchase Tracker badge';
    END IF;
    
    IF investment_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Investment Newbie' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Investment Newbie badge';
    END IF;
    
    IF donation_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Giving Heart' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Giving Heart badge';
    END IF;
    
    IF last_wish_count > 0 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Last Wish Creator' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Last Wish Creator badge';
    END IF;
    
    -- Award higher-level badges
    IF transaction_count >= 100 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Transaction Titan' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Transaction Titan badge';
    END IF;
    
    IF account_count >= 3 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT user_id_to_check, id FROM achievements 
        WHERE name = 'Multi-Account Manager' AND is_active = true
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
        RAISE NOTICE 'Awarded Multi-Account Manager badge';
    END IF;
    
    RAISE NOTICE 'Migration completed for user %', user_id_to_check;
END $$;

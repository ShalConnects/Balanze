-- Award achievements to ALL existing users based on their data
-- This script will find all users and award appropriate badges

-- First, let's see what users we have and what data they have
SELECT 'Debug: User data summary' as info;
SELECT 
    'Total users with accounts' as metric, COUNT(DISTINCT user_id) as count FROM accounts
UNION ALL
SELECT 
    'Total users with transactions' as metric, COUNT(DISTINCT user_id) as count FROM transactions
UNION ALL
SELECT 
    'Total users with categories' as metric, COUNT(DISTINCT user_id) as count FROM categories
UNION ALL
SELECT 
    'Total users with savings goals' as metric, COUNT(DISTINCT user_id) as count FROM savings_goals
UNION ALL
SELECT 
    'Total users with lend/borrow' as metric, COUNT(DISTINCT user_id) as count FROM lend_borrow
UNION ALL
SELECT 
    'Total users with purchases' as metric, COUNT(DISTINCT user_id) as count FROM purchases
UNION ALL
SELECT 
    'Total users with investments' as metric, COUNT(DISTINCT user_id) as count FROM investment_assets
UNION ALL
SELECT 
    'Total users with donations' as metric, COUNT(DISTINCT user_id) as count FROM donation_saving_records WHERE type = 'donation'
UNION ALL
SELECT 
    'Total users with last wish' as metric, COUNT(DISTINCT user_id) as count FROM last_wish_settings;

-- Now award achievements to ALL users
DO $$
DECLARE
    user_record RECORD;
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
    total_users_processed INTEGER := 0;
    total_achievements_awarded INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting achievement migration for all users...';
    
    -- Loop through ALL users who have any data
    FOR user_record IN 
        SELECT DISTINCT user_id FROM (
            SELECT user_id FROM accounts
            UNION
            SELECT user_id FROM transactions
            UNION
            SELECT user_id FROM categories
            UNION
            SELECT user_id FROM savings_goals
            UNION
            SELECT user_id FROM lend_borrow
            UNION
            SELECT user_id FROM purchases
            UNION
            SELECT user_id FROM investment_assets
            UNION
            SELECT user_id FROM donation_saving_records
            UNION
            SELECT user_id FROM last_wish_settings
        ) AS all_users
    LOOP
        total_users_processed := total_users_processed + 1;
        
        -- Count user's existing data
        SELECT COUNT(*) INTO account_count FROM accounts WHERE user_id = user_record.user_id;
        SELECT COUNT(*) INTO transaction_count FROM transactions WHERE user_id = user_record.user_id;
        SELECT COUNT(*) INTO category_count FROM categories WHERE user_id = user_record.user_id;
        SELECT COUNT(*) INTO savings_goal_count FROM savings_goals WHERE user_id = user_record.user_id;
        SELECT COUNT(*) INTO lend_count FROM lend_borrow WHERE user_id = user_record.user_id AND type = 'lend';
        SELECT COUNT(*) INTO borrow_count FROM lend_borrow WHERE user_id = user_record.user_id AND type = 'borrow';
        SELECT COUNT(*) INTO purchase_count FROM purchases WHERE user_id = user_record.user_id;
        SELECT COUNT(*) INTO investment_count FROM investment_assets WHERE user_id = user_record.user_id;
        SELECT COUNT(*) INTO donation_count FROM donation_saving_records WHERE user_id = user_record.user_id AND type = 'donation';
        SELECT COUNT(*) INTO last_wish_count FROM last_wish_settings WHERE user_id = user_record.user_id;
        
        -- Award "First Steps" if user has accounts
        IF account_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'First Steps' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Transaction Tracker" if user has transactions
        IF transaction_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Transaction Tracker' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Category Creator" if user has categories
        IF category_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Category Creator' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Goal Setter" if user has savings goals
        IF savings_goal_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Goal Setter' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Lending Helper" if user has lent money
        IF lend_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Lending Helper' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Borrowing Boss" if user has borrowed money
        IF borrow_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Borrowing Boss' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Purchase Tracker" if user has purchases
        IF purchase_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Purchase Tracker' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Investment Newbie" if user has investments
        IF investment_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Investment Newbie' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Giving Heart" if user has donations
        IF donation_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Giving Heart' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Last Wish Creator" if user has Last Wish
        IF last_wish_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Last Wish Creator' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award higher-level badges based on counts
        IF transaction_count >= 100 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Transaction Titan' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        IF account_count >= 3 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Multi-Account Manager' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Transaction Titan" for 100+ transactions
        IF transaction_count >= 100 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Transaction Titan' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Data Entry Expert" for 500+ transactions
        IF transaction_count >= 500 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Data Entry Expert' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Portfolio Builder" for 5+ investments
        IF investment_count >= 5 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Portfolio Builder' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Award "Charity Champion" for $500+ donations
        IF EXISTS (
            SELECT 1 FROM donation_saving_records 
            WHERE user_id = user_record.user_id 
            AND type = 'donation' 
            AND amount >= 500
        ) THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Charity Champion' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            total_achievements_awarded := total_achievements_awarded + 1;
        END IF;
        
        -- Log progress every 10 users
        IF total_users_processed % 10 = 0 THEN
            RAISE NOTICE 'Processed % users, awarded % achievements so far', total_users_processed, total_achievements_awarded;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Migration completed! Processed % users and awarded % achievements', total_users_processed, total_achievements_awarded;
END $$;

-- Show final results
SELECT 'Final Results:' as info;
SELECT 
    'Total users with achievements' as metric, COUNT(DISTINCT user_id) as count FROM user_achievements
UNION ALL
SELECT 
    'Total achievements awarded' as metric, COUNT(*) as count FROM user_achievements
UNION ALL
SELECT 
    'Most common achievement' as metric, COUNT(*) as count FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE a.name = 'First Steps';

-- Show achievement distribution
SELECT 
    a.name as achievement_name,
    a.icon,
    a.rarity,
    COUNT(ua.id) as users_earned
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY a.id, a.name, a.icon, a.rarity
ORDER BY users_earned DESC;

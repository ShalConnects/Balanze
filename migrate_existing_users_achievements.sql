-- Migrate existing users to have achievement progress
-- This script will check existing user actions and award appropriate badges

-- Function to check and award achievements for existing users
CREATE OR REPLACE FUNCTION migrate_existing_user_achievements()
RETURNS void AS $$
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
BEGIN
    -- Loop through all users
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
        END IF;
        
        -- Award "Transaction Tracker" if user has transactions
        IF transaction_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Transaction Tracker' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award "Category Creator" if user has categories
        IF category_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Category Creator' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award "Goal Setter" if user has savings goals
        IF savings_goal_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Goal Setter' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award "Lending Helper" if user has lent money
        IF lend_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Lending Helper' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award "Borrowing Boss" if user has borrowed money
        IF borrow_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Borrowing Boss' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award "Purchase Tracker" if user has purchases
        IF purchase_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Purchase Tracker' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award "Investment Newbie" if user has investments
        IF investment_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Investment Newbie' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award "Giving Heart" if user has donations
        IF donation_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Giving Heart' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award "Last Wish Creator" if user has Last Wish
        IF last_wish_count > 0 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Last Wish Creator' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        -- Award higher-level badges based on counts
        IF transaction_count >= 100 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Transaction Titan' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
        IF account_count >= 3 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.user_id, id FROM achievements 
            WHERE name = 'Multi-Account Manager' AND is_active = true
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_existing_user_achievements();

-- Drop the function after use
DROP FUNCTION migrate_existing_user_achievements();

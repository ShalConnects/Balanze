-- Award Achievements to Existing Users Based on Their Real Data
-- This script awards badges based on what users have already done in the system

DO $$
DECLARE
    user_record RECORD;
    account_count INTEGER;
    transaction_count INTEGER;
    category_count INTEGER;
    savings_goal_count INTEGER;
    lend_count INTEGER;
    borrow_count INTEGER;
    donation_count INTEGER;
    investment_count INTEGER;
    purchase_count INTEGER;
    last_wish_count INTEGER;
    total_savings DECIMAL;
    total_donations DECIMAL;
    currency_count INTEGER;
    analytics_view_count INTEGER;
    premium_feature_count INTEGER;
    login_streak INTEGER;
    daily_tracking_streak INTEGER;
BEGIN
    RAISE NOTICE 'Starting achievement awarding for existing users...';
    
    -- Loop through all existing users
    FOR user_record IN 
        SELECT id, email, created_at 
        FROM auth.users 
        ORDER BY created_at
    LOOP
        RAISE NOTICE 'Processing user: % (%)', user_record.email, user_record.id;
        
        -- Count user's existing data
        SELECT COUNT(*) INTO account_count FROM accounts WHERE user_id = user_record.id;
        SELECT COUNT(*) INTO transaction_count FROM transactions WHERE user_id = user_record.id;
        SELECT COUNT(*) INTO category_count FROM categories WHERE user_id = user_record.id;
        SELECT COUNT(*) INTO savings_goal_count FROM savings_goals WHERE user_id = user_record.id;
        SELECT COUNT(*) INTO lend_count FROM lend_borrow WHERE user_id = user_record.id AND type = 'lend';
        SELECT COUNT(*) INTO borrow_count FROM lend_borrow WHERE user_id = user_record.id AND type = 'borrow';
        SELECT COUNT(*) INTO donation_count FROM donation_saving_records WHERE user_id = user_record.id AND type = 'donation';
        SELECT COUNT(*) INTO investment_count FROM investment_assets WHERE user_id = user_record.id;
        SELECT COUNT(*) INTO purchase_count FROM purchases WHERE user_id = user_record.id;
        SELECT COUNT(*) INTO last_wish_count FROM last_wish_settings WHERE user_id = user_record.id;
        
        -- Calculate totals
        SELECT COALESCE(SUM(target_amount), 0) INTO total_savings FROM savings_goals WHERE user_id = user_record.id;
        SELECT COALESCE(SUM(amount), 0) INTO total_donations FROM donation_saving_records WHERE user_id = user_record.id AND type = 'donation';
        SELECT COUNT(DISTINCT currency) INTO currency_count FROM accounts WHERE user_id = user_record.id;
        
        -- Count user activities (if user_activity table exists)
        SELECT COUNT(*) INTO analytics_view_count FROM user_activity WHERE user_id = user_record.id AND activity_type = 'analytics_view';
        SELECT COUNT(*) INTO premium_feature_count FROM user_activity WHERE user_id = user_record.id AND activity_type = 'premium_feature';
        
        -- Calculate streaks (simplified - based on account creation date)
        SELECT EXTRACT(DAYS FROM (NOW() - created_at))::INTEGER INTO login_streak FROM auth.users WHERE id = user_record.id;
        SELECT EXTRACT(DAYS FROM (NOW() - created_at))::INTEGER INTO daily_tracking_streak FROM auth.users WHERE id = user_record.id;
        
        RAISE NOTICE 'User % data: % accounts, % transactions, % categories, % savings goals, % lend, % borrow, % donations, % investments, % purchases, % last wish', 
            user_record.email, account_count, transaction_count, category_count, savings_goal_count, lend_count, borrow_count, donation_count, investment_count, purchase_count, last_wish_count;
        
        -- Award achievements based on existing data
        
        -- Getting Started Achievements
        IF account_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'First Account'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF transaction_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'First Transaction'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF category_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Organizer'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF savings_goal_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Goal Setter'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Financial Tracking Achievements
        IF transaction_count >= 10 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Transaction Master'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF transaction_count >= 100 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Data Enthusiast'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Account Management Achievements
        IF account_count >= 2 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Multi-Account'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF account_count >= 3 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Account Master'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF currency_count >= 2 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Multi-Currency'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Savings & Goals Achievements
        IF total_savings >= 100 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Savings Starter'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF total_savings >= 1000 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Savings Champion'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Lend & Borrow Achievements
        IF lend_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Lender'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF borrow_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Borrower'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Donation Achievements
        IF donation_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Philanthropist'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF total_donations >= 500 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Generous Heart'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Investment Achievements
        IF investment_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Investor'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF investment_count >= 3 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Portfolio Manager'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Purchase Achievements
        IF purchase_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Purchase Tracker'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Analytics Achievements
        IF analytics_view_count >= 5 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Data Explorer'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF analytics_view_count >= 15 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Insight Seeker'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Premium Features Achievements
        IF premium_feature_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Premium Explorer'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        IF premium_feature_count >= 3 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Premium Power User'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Special Achievements
        IF last_wish_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Planner'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        RAISE NOTICE 'Awarded achievements for user: %', user_record.email;
        
    END LOOP;
    
    RAISE NOTICE 'Achievement awarding complete!';
    
    -- Show summary
    SELECT COUNT(*) INTO account_count FROM user_achievements;
    RAISE NOTICE 'Total achievements awarded: %', account_count;
    
END $$;

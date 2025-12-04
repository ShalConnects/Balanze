-- Award Achievements to Existing Users V2
-- This script awards achievements to all existing users based on their current data

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
    attachment_count INTEGER;
    last_wish_count INTEGER;
    analytics_view_count INTEGER;
    premium_feature_count INTEGER;
    login_count INTEGER;
    total_donated NUMERIC;
    total_saved NUMERIC;
    unique_currencies INTEGER;
    completed_goals INTEGER;
    settled_loans INTEGER;
    newly_awarded INTEGER := 0;
    total_users INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting achievement awarding process...';
    
    -- Loop through all users
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        ORDER BY created_at
    LOOP
        total_users := total_users + 1;
        RAISE NOTICE 'Processing user %: %', total_users, user_record.email;
        
        -- Count user's accounts
        SELECT COUNT(*) INTO account_count FROM accounts WHERE user_id = user_record.id;
        
        -- Count user's transactions
        SELECT COUNT(*) INTO transaction_count FROM transactions WHERE user_id = user_record.id;
        
        -- Count user's categories
        SELECT COUNT(*) INTO category_count FROM categories WHERE user_id = user_record.id;
        
        -- Count user's savings goals
        SELECT COUNT(*) INTO savings_goal_count FROM savings_goals WHERE user_id = user_record.id;
        
        -- Count lend records
        SELECT COUNT(*) INTO lend_count FROM lend_borrow WHERE user_id = user_record.id AND type = 'lend';
        
        -- Count borrow records
        SELECT COUNT(*) INTO borrow_count FROM lend_borrow WHERE user_id = user_record.id AND type = 'borrow';
        
        -- Count donations
        SELECT COUNT(*) INTO donation_count FROM donation_saving_records WHERE user_id = user_record.id AND type = 'donation';
        
        -- Count investments
        SELECT COUNT(*) INTO investment_count FROM investment_assets WHERE user_id = user_record.id;
        
        -- Count purchases
        SELECT COUNT(*) INTO purchase_count FROM purchases WHERE user_id = user_record.id;
        
        -- Count attachments
        SELECT COUNT(*) INTO attachment_count FROM purchase_attachments WHERE user_id = user_record.id;
        
        -- Count last wish settings
        SELECT COUNT(*) INTO last_wish_count FROM last_wish_settings WHERE user_id = user_record.id;
        
        -- Count analytics views
        SELECT COUNT(*) INTO analytics_view_count FROM user_activity WHERE user_id = user_record.id AND activity_type = 'analytics_view';
        
        -- Count premium feature usage
        SELECT COUNT(*) INTO premium_feature_count FROM user_activity WHERE user_id = user_record.id AND activity_type = 'premium_feature';
        
        -- Count logins
        SELECT COUNT(*) INTO login_count FROM user_activity WHERE user_id = user_record.id AND activity_type = 'login';
        
        -- Calculate total donated
        SELECT COALESCE(SUM(amount), 0) INTO total_donated FROM donation_saving_records WHERE user_id = user_record.id AND type = 'donation';
        
        -- Calculate total saved (from savings goals)
        SELECT COALESCE(SUM(amount), 0) INTO total_saved FROM savings_goals WHERE user_id = user_record.id;
        
        -- Count unique currencies
        SELECT COUNT(DISTINCT currency) INTO unique_currencies FROM accounts WHERE user_id = user_record.id;
        
        -- Count completed goals
        SELECT COUNT(*) INTO completed_goals FROM savings_goals WHERE user_id = user_record.id AND amount >= target_amount;
        
        -- Count settled loans
        SELECT COUNT(*) INTO settled_loans FROM lend_borrow WHERE user_id = user_record.id AND status = 'settled';
        
        -- Award achievements based on data
        
        -- First Account (1 account)
        IF account_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'First Account'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- First Transaction (1 transaction)
        IF transaction_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'First Transaction'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Organizer (1 category)
        IF category_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Organizer'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Goal Setter (1 savings goal)
        IF savings_goal_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Goal Setter'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Account Master (3 accounts - adjusted for free plan limit)
        IF account_count >= 3 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Account Master'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Multi-Account (2 accounts - adjusted for free plan)
        IF account_count >= 2 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Multi-Account'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Multi-Currency (2 currencies)
        IF unique_currencies >= 2 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Multi-Currency'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Transaction Master (10 transactions)
        IF transaction_count >= 10 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Transaction Master'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Data Enthusiast (100 transactions)
        IF transaction_count >= 100 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Data Enthusiast'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Lender (1 lend record)
        IF lend_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Lender'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Borrower (1 borrow record)
        IF borrow_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Borrower'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Settlement Master (1 settled loan)
        IF settled_loans >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Settlement Master'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Philanthropist (1 donation)
        IF donation_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Philanthropist'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Generous Heart ($500+ donated)
        IF total_donated >= 500 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Generous Heart'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Savings Starter ($100+ saved)
        IF total_saved >= 100 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Savings Starter'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Savings Champion ($1000+ saved)
        IF total_saved >= 1000 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Savings Champion'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Goal Crusher (1 completed goal)
        IF completed_goals >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Goal Crusher'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Investor (1 investment)
        IF investment_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Investor'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Portfolio Manager (3 investments)
        IF investment_count >= 3 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Portfolio Manager'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Purchase Tracker (1 purchase)
        IF purchase_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Purchase Tracker'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Document Keeper (1 attachment)
        IF attachment_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Document Keeper'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Data Explorer (1 analytics view)
        IF analytics_view_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Data Explorer'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Insight Seeker (10 analytics views)
        IF analytics_view_count >= 10 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Insight Seeker'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Premium Explorer (1 premium feature)
        IF premium_feature_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Premium Explorer'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Premium Power User (3 premium features)
        IF premium_feature_count >= 3 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Premium Power User'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Planner (1 last wish)
        IF last_wish_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            SELECT user_record.id, a.id FROM achievements a WHERE a.name = 'Planner'
            AND NOT EXISTS (SELECT 1 FROM user_achievements ua WHERE ua.user_id = user_record.id AND ua.achievement_id = a.id);
        END IF;
        
        -- Count newly awarded achievements for this user
        SELECT COUNT(*) INTO newly_awarded FROM user_achievements WHERE user_id = user_record.id;
        
        RAISE NOTICE 'User % has % achievements', user_record.email, newly_awarded;
        
    END LOOP;
    
    RAISE NOTICE 'Achievement awarding process completed!';
    RAISE NOTICE 'Total users processed: %', total_users;
    
    -- Show summary
    SELECT COUNT(DISTINCT user_id) INTO total_users FROM user_achievements;
    RAISE NOTICE 'Users with achievements: %', total_users;
    
    SELECT COUNT(*) INTO newly_awarded FROM user_achievements;
    RAISE NOTICE 'Total achievements awarded: %', newly_awarded;
    
END $$;

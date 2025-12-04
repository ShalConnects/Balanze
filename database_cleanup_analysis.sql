-- =====================================================
-- DATABASE CLEANUP ANALYSIS SCRIPT
-- =====================================================
-- This script will help identify which tables are in use
-- and which ones can be safely removed
-- 
-- RUN THIS FIRST to analyze your database before cleanup
-- =====================================================

-- =====================================================
-- STEP 1: List all tables in the public schema
-- =====================================================
SELECT '=== ALL TABLES IN PUBLIC SCHEMA ===' as info;
SELECT 
    schemaname,
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- STEP 2: List all views in the public schema
-- =====================================================
SELECT '=== ALL VIEWS IN PUBLIC SCHEMA ===' as info;
SELECT 
    schemaname,
    viewname as view_name
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- =====================================================
-- STEP 3: Check row counts for all tables
-- =====================================================
SELECT '=== ROW COUNTS FOR ALL TABLES ===' as info;

-- Core financial tables (SHOULD HAVE DATA)
SELECT 'accounts' as table_name, COUNT(*) as row_count FROM accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL
SELECT 'purchase_categories', COUNT(*) FROM purchase_categories
UNION ALL
SELECT 'purchase_attachments', COUNT(*) FROM purchase_attachments
UNION ALL
SELECT 'savings_goals', COUNT(*) FROM savings_goals
UNION ALL
SELECT 'donation_saving_records', COUNT(*) FROM donation_saving_records
UNION ALL
SELECT 'lend_borrow', COUNT(*) FROM lend_borrow
UNION ALL
SELECT 'dps_transfers', COUNT(*) FROM dps_transfers
UNION ALL

-- User and authentication tables (SHOULD HAVE DATA)
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL

-- Activity and audit tables (MAY HAVE DATA)
SELECT 'activity_history', COUNT(*) FROM activity_history
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL

-- Feature-specific tables (MAY OR MAY NOT HAVE DATA)
SELECT 'last_wish_settings', COUNT(*) FROM last_wish_settings
UNION ALL
SELECT 'last_wish_deliveries', COUNT(*) FROM last_wish_deliveries
UNION ALL
SELECT 'subscription_history', COUNT(*) FROM subscription_history
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'url_shortener', COUNT(*) FROM url_shortener
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'favorite_quotes', COUNT(*) FROM favorite_quotes

ORDER BY row_count DESC;

-- =====================================================
-- STEP 4: List all tables that exist but are NOT used
-- =====================================================
-- This query will show tables that might be candidates for deletion
-- Review carefully before deleting!

SELECT '=== POTENTIALLY UNUSED TABLES (VERIFY BEFORE DELETING) ===' as info;

SELECT 
    t.tablename as table_name,
    pg_size_pretty(pg_total_relation_size('public.'||t.tablename)) AS size,
    'Check if this table is needed' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.tablename NOT IN (
    -- CORE TABLES ACTIVELY USED IN APPLICATION
    'accounts',
    'transactions', 
    'categories',
    'purchases',
    'purchase_categories',
    'purchase_attachments',
    'savings_goals',
    'donation_saving_records',
    'lend_borrow',
    'dps_transfers',
    'profiles',
    'activity_history',
    'last_wish_settings',
    'last_wish_deliveries',
    'subscription_history',
    'notifications',
    'notification_preferences',
    'notes',
    'tasks',
    'url_shortener',
    'user_preferences',
    'favorite_quotes',
    -- POTENTIALLY LEGACY OR DEPRECATED TABLES (need verification)
    'audit_logs',  -- might be replaced by activity_history
    'lend_borrow_returns',  -- might be deprecated
    'lend_borrow_installments',  -- might be deprecated
    'transaction_update_history',  -- might be replaced by activity_history
    'purchase_updates',  -- might be replaced by activity_history
    'article_reading_history',  -- might be unused
    'payment_methods'  -- might be unused if using external payment providers
)
ORDER BY pg_total_relation_size('public.'||t.tablename) DESC;

-- =====================================================
-- STEP 5: Check for orphaned data relationships
-- =====================================================
SELECT '=== CHECKING FOR ORPHANED RELATIONSHIPS ===' as info;

-- Check for transactions without valid accounts
SELECT 'Transactions with invalid account_id' as check_name, COUNT(*) as count
FROM transactions t
WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = t.account_id);

-- Check for purchases without valid transactions (if applicable)
SELECT 'Purchases with invalid transaction_id' as check_name, COUNT(*) as count
FROM purchases p
WHERE p.transaction_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.transaction_id::text = p.transaction_id::text);

-- Check for purchase_attachments without valid purchases
SELECT 'Purchase attachments with invalid purchase_id' as check_name, COUNT(*) as count
FROM purchase_attachments pa
WHERE NOT EXISTS (SELECT 1 FROM purchases p WHERE p.id = pa.purchase_id);

-- =====================================================
-- STEP 6: List all foreign key relationships
-- =====================================================
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as info;

SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- ANALYSIS COMPLETE
-- =====================================================
SELECT '
==========================================
ANALYSIS COMPLETE!
==========================================

NEXT STEPS:
1. Review the "POTENTIALLY UNUSED TABLES" section above
2. For each table listed, verify if it should be kept or removed
3. If you want to remove a table, use the cleanup script
4. ALWAYS backup your database before running cleanup!

TABLES ACTIVELY USED IN YOUR APPLICATION:
- accounts (main account records)
- transactions (financial transactions)
- categories (expense/income categories)
- purchases (purchase tracking)
- purchase_categories (purchase categorization)
- purchase_attachments (file attachments)
- savings_goals (savings goals)
- donation_saving_records (donations/savings)
- lend_borrow (lend/borrow records)
- dps_transfers (DPS transfers)
- profiles (user profiles)
- activity_history (audit logs)
- last_wish_settings (Last Wish feature)
- last_wish_deliveries (Last Wish deliveries)
- subscription_history (payment history)
- notifications (app notifications)
- notification_preferences (user notification settings)
- notes (user notes)
- tasks (user tasks/todos)
- url_shortener (shortened URLs)
- user_preferences (user preferences)
- favorite_quotes (favorite quotes)

VIEWS USED:
- account_balances (account balance calculations)

==========================================
' as instructions;


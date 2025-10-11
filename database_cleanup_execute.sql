-- =====================================================
-- DATABASE CLEANUP EXECUTION SCRIPT
-- =====================================================
-- ⚠️ WARNING: THIS SCRIPT WILL DELETE TABLES! ⚠️
-- 
-- BEFORE RUNNING THIS SCRIPT:
-- 1. Run 'database_cleanup_analysis.sql' first
-- 2. Review the analysis results carefully
-- 3. BACKUP YOUR DATABASE (pg_dump or Supabase Dashboard)
-- 4. Verify each table below is truly unused
-- 5. Test in a development environment first
-- 
-- ONLY RUN THIS AFTER CONFIRMING IT'S SAFE!
-- =====================================================

-- =====================================================
-- BACKUP REMINDER
-- =====================================================
DO $$ 
BEGIN 
    RAISE NOTICE '
    ======================================
    ⚠️  BACKUP REMINDER  ⚠️
    ======================================
    
    Have you backed up your database?
    
    □ Yes, I have a recent backup
    □ No, I need to create a backup first
    
    If you have not backed up, STOP NOW and:
    1. Go to Supabase Dashboard
    2. Go to Database → Backups
    3. Create a manual backup
    4. Download the backup file
    
    Then come back and run this script.
    ======================================
    ';
END $$;

-- =====================================================
-- COMMON UNUSED TABLES TO REMOVE
-- =====================================================
-- Based on analysis, these tables are commonly found 
-- but not actively used in the current codebase.
-- Review each one before uncommenting the DROP statement.
-- =====================================================

-- =====================================================
-- LEGACY/DEPRECATED TABLES
-- =====================================================

-- Audit Logs (replaced by activity_history)
-- UNCOMMENT ONLY IF you confirmed audit_logs is not used
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- SELECT 'Dropped audit_logs table' as status;

-- Transaction Update History (replaced by activity_history)
-- UNCOMMENT ONLY IF you confirmed this is not used
-- DROP TABLE IF EXISTS transaction_update_history CASCADE;
-- SELECT 'Dropped transaction_update_history table' as status;

-- Purchase Updates (replaced by activity_history)
-- UNCOMMENT ONLY IF you confirmed this is not used
-- DROP TABLE IF EXISTS purchase_updates CASCADE;
-- SELECT 'Dropped purchase_updates table' as status;

-- Lend Borrow Returns (deprecated feature)
-- UNCOMMENT ONLY IF you confirmed this is not used
-- DROP TABLE IF EXISTS lend_borrow_returns CASCADE;
-- SELECT 'Dropped lend_borrow_returns table' as status;

-- Lend Borrow Installments (deprecated feature)
-- UNCOMMENT ONLY IF you confirmed this is not used
-- DROP TABLE IF EXISTS lend_borrow_installments CASCADE;
-- SELECT 'Dropped lend_borrow_installments table' as status;

-- Article Reading History (unused feature)
-- UNCOMMENT ONLY IF you confirmed this is not used
-- DROP TABLE IF EXISTS article_reading_history CASCADE;
-- SELECT 'Dropped article_reading_history table' as status;

-- Payment Methods (if using external payment providers)
-- UNCOMMENT ONLY IF you confirmed this is not used
-- DROP TABLE IF EXISTS payment_methods CASCADE;
-- SELECT 'Dropped payment_methods table' as status;

-- =====================================================
-- VERIFY CLEANUP
-- =====================================================
-- After dropping tables, verify the cleanup
SELECT '=== VERIFYING CLEANUP ===' as info;

SELECT 
    'Remaining tables: ' || COUNT(*) as summary
FROM pg_tables 
WHERE schemaname = 'public';

SELECT 
    tablename as remaining_tables,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- =====================================================
-- VACUUM AND ANALYZE
-- =====================================================
-- After cleanup, optimize the database
VACUUM ANALYZE;

SELECT '
==========================================
CLEANUP COMPLETE!
==========================================

What was done:
- Removed unused/deprecated tables
- Freed up database storage space
- Ran VACUUM ANALYZE to optimize database

Next steps:
1. Test your application thoroughly
2. Verify all features work correctly
3. If any issues arise, restore from backup
4. Monitor database performance

Database is now cleaner and optimized!
==========================================
' as completion_message;


-- =====================================================
-- DATABASE CLEANUP - SAFE MODE
-- =====================================================
-- This script will RENAME tables instead of dropping them
-- So you can safely test without losing data
-- 
-- If everything works fine after renaming, you can then
-- run the actual cleanup script to permanently delete
-- =====================================================

-- =====================================================
-- STEP 1: Create a backup schema for renamed tables
-- =====================================================
CREATE SCHEMA IF NOT EXISTS archived_tables;

SELECT '=== Created archived_tables schema ===' as info;

-- =====================================================
-- STEP 2: Move potentially unused tables to archive
-- =====================================================
-- These will be moved to the archived_tables schema
-- Review and uncomment only the tables you want to archive
-- =====================================================

-- Audit Logs (possibly replaced by activity_history)
-- UNCOMMENT if analysis confirmed this can be archived
-- ALTER TABLE IF EXISTS public.audit_logs SET SCHEMA archived_tables;
-- SELECT 'Moved audit_logs to archive' as status;

-- Transaction Update History
-- UNCOMMENT if analysis confirmed this can be archived  
-- ALTER TABLE IF EXISTS public.transaction_update_history SET SCHEMA archived_tables;
-- SELECT 'Moved transaction_update_history to archive' as status;

-- Purchase Updates
-- UNCOMMENT if analysis confirmed this can be archived
-- ALTER TABLE IF EXISTS public.purchase_updates SET SCHEMA archived_tables;
-- SELECT 'Moved purchase_updates to archive' as status;

-- Lend Borrow Returns
-- UNCOMMENT if analysis confirmed this can be archived
-- ALTER TABLE IF EXISTS public.lend_borrow_returns SET SCHEMA archived_tables;
-- SELECT 'Moved lend_borrow_returns to archive' as status;

-- Lend Borrow Installments
-- UNCOMMENT if analysis confirmed this can be archived
-- ALTER TABLE IF EXISTS public.lend_borrow_installments SET SCHEMA archived_tables;
-- SELECT 'Moved lend_borrow_installments to archive' as status;

-- Article Reading History
-- UNCOMMENT if analysis confirmed this can be archived
-- ALTER TABLE IF EXISTS public.article_reading_history SET SCHEMA archived_tables;
-- SELECT 'Moved article_reading_history to archive' as status;

-- Payment Methods
-- UNCOMMENT if analysis confirmed this can be archived
-- ALTER TABLE IF EXISTS public.payment_methods SET SCHEMA archived_tables;
-- SELECT 'Moved payment_methods to archive' as status;

-- =====================================================
-- STEP 3: Verify tables are archived
-- =====================================================
SELECT '=== ARCHIVED TABLES ===' as info;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'archived_tables'
ORDER BY tablename;

-- =====================================================
-- STEP 4: Verify public tables
-- =====================================================
SELECT '=== REMAINING PUBLIC TABLES ===' as info;

SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- =====================================================
-- INSTRUCTIONS FOR NEXT STEPS
-- =====================================================
SELECT '
==========================================
SAFE MODE CLEANUP COMPLETE!
==========================================

What was done:
- Moved selected tables to "archived_tables" schema
- Tables are still in the database but not actively used
- Your application should now only access "public" schema tables

Next steps:
1. Test your application thoroughly (at least 1-2 weeks)
2. Verify all features work correctly
3. Check that no errors reference the archived tables
4. If everything works fine, you can permanently delete with:
   
   DROP SCHEMA archived_tables CASCADE;

5. If you need to restore a table:
   
   ALTER TABLE archived_tables.table_name SET SCHEMA public;

Benefits of Safe Mode:
✓ No data loss
✓ Easy to restore
✓ Test safely before permanent deletion
✓ Quick rollback if needed

==========================================
' as instructions;

-- =====================================================
-- RESTORE SCRIPT (Use this if you need to undo)
-- =====================================================
-- If you need to restore tables back to public schema:
-- 
-- ALTER TABLE archived_tables.audit_logs SET SCHEMA public;
-- ALTER TABLE archived_tables.transaction_update_history SET SCHEMA public;
-- ALTER TABLE archived_tables.purchase_updates SET SCHEMA public;
-- ALTER TABLE archived_tables.lend_borrow_returns SET SCHEMA public;
-- ALTER TABLE archived_tables.lend_borrow_installments SET SCHEMA public;
-- ALTER TABLE archived_tables.article_reading_history SET SCHEMA public;
-- ALTER TABLE archived_tables.payment_methods SET SCHEMA public;


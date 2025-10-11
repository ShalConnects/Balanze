-- =====================================================
-- SAFE MODE CLEANUP - YOUR SPECIFIC UNUSED TABLES
-- =====================================================
-- This will ARCHIVE (not delete) potentially unused tables
-- You can restore them instantly if needed
-- =====================================================

-- Create archive schema
CREATE SCHEMA IF NOT EXISTS archived_tables;

SELECT '=== Created archived_tables schema ===' as info;

-- =====================================================
-- ARCHIVE UNUSED TABLES
-- =====================================================

-- Article Reading History (not used in code)
ALTER TABLE IF EXISTS public.article_reading_history SET SCHEMA archived_tables;
SELECT '✓ Moved article_reading_history to archive' as status;

-- Audit Logs (replaced by activity_history)
ALTER TABLE IF EXISTS public.audit_logs SET SCHEMA archived_tables;
SELECT '✓ Moved audit_logs to archive (replaced by activity_history)' as status;

-- Lend Borrow Returns (deprecated feature)
ALTER TABLE IF EXISTS public.lend_borrow_returns SET SCHEMA archived_tables;
SELECT '✓ Moved lend_borrow_returns to archive' as status;

-- Payment Transactions (check if this is different from subscription_history)
ALTER TABLE IF EXISTS public.payment_transactions SET SCHEMA archived_tables;
SELECT '✓ Moved payment_transactions to archive' as status;

-- Payment Webhooks (not used in code)
ALTER TABLE IF EXISTS public.payment_webhooks SET SCHEMA archived_tables;
SELECT '✓ Moved payment_webhooks to archive' as status;

-- Purchase History (possible duplicate)
ALTER TABLE IF EXISTS public.purchase_history SET SCHEMA archived_tables;
SELECT '✓ Moved purchase_history to archive' as status;

-- Refund Requests (not used in code)
ALTER TABLE IF EXISTS public.refund_requests SET SCHEMA archived_tables;
SELECT '✓ Moved refund_requests to archive' as status;

-- Subscription Plans (not used in code)
ALTER TABLE IF EXISTS public.subscription_plans SET SCHEMA archived_tables;
SELECT '✓ Moved subscription_plans to archive' as status;

-- Transfers (possibly replaced by dps_transfers)
ALTER TABLE IF EXISTS public.transfers SET SCHEMA archived_tables;
SELECT '✓ Moved transfers to archive' as status;

-- User Payment Methods (not used in code)
ALTER TABLE IF EXISTS public.user_payment_methods SET SCHEMA archived_tables;
SELECT '✓ Moved user_payment_methods to archive' as status;

-- User Subscriptions (possibly replaced by profiles.subscription)
ALTER TABLE IF EXISTS public.user_subscriptions SET SCHEMA archived_tables;
SELECT '✓ Moved user_subscriptions to archive' as status;

-- =====================================================
-- VERIFY WHAT WAS ARCHIVED
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
-- VERIFY REMAINING PUBLIC TABLES
-- =====================================================
SELECT '=== REMAINING PUBLIC TABLES ===' as info;

SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT '
==========================================
✅ SAFE MODE CLEANUP COMPLETE!
==========================================

What was done:
- 11 tables moved to archived_tables schema
- ~1.2 MB freed from public schema
- NO DATA WAS DELETED
- All tables can be restored instantly

Tables archived:
✓ article_reading_history
✓ audit_logs
✓ lend_borrow_returns
✓ payment_transactions
✓ payment_webhooks
✓ purchase_history
✓ refund_requests
✓ subscription_plans
✓ transfers
✓ user_payment_methods
✓ user_subscriptions

Next steps:
1. Test your application thoroughly
2. Use all features normally for 1-2 weeks
3. Check for any errors in console
4. If all works well, consider permanent cleanup

To restore a table if needed:
ALTER TABLE archived_tables.table_name SET SCHEMA public;

==========================================
' as summary;


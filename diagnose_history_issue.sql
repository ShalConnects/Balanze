-- Diagnose History Tracking Issue
-- This script will check what's missing in the history tracking system

-- 1. Check if the old history tracking tables exist
SELECT 
    'OLD SYSTEM CHECK:' as section,
    'transaction_updates' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_updates') as exists
UNION ALL
SELECT 
    'OLD SYSTEM CHECK:' as section,
    'purchase_updates' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_updates') as exists;

-- 2. Check if the new history tracking tables exist
SELECT 
    'NEW SYSTEM CHECK:' as section,
    'transaction_edit_sessions' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_edit_sessions') as exists
UNION ALL
SELECT 
    'NEW SYSTEM CHECK:' as section,
    'purchase_edit_sessions' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_edit_sessions') as exists
UNION ALL
SELECT 
    'NEW SYSTEM CHECK:' as section,
    'transaction_field_changes' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_field_changes') as exists
UNION ALL
SELECT 
    'NEW SYSTEM CHECK:' as section,
    'purchase_field_changes' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_field_changes') as exists;

-- 3. Check if the logging functions exist
SELECT 
    'FUNCTIONS CHECK:' as section,
    'log_transaction_update' as function_name,
    EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_transaction_update') as exists
UNION ALL
SELECT 
    'FUNCTIONS CHECK:' as section,
    'log_purchase_update' as function_name,
    EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_purchase_update') as exists;

-- 4. Check if the triggers exist
SELECT 
    'TRIGGERS CHECK:' as section,
    'trigger_log_transaction_update' as trigger_name,
    EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_log_transaction_update') as exists
UNION ALL
SELECT 
    'TRIGGERS CHECK:' as section,
    'trigger_log_purchase_update' as trigger_name,
    EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_log_purchase_update') as exists;

-- 5. Check if there are any existing history records
SELECT 
    'EXISTING RECORDS:' as section,
    'transaction_updates' as table_name,
    COALESCE((SELECT COUNT(*) FROM transaction_updates), 0) as record_count
UNION ALL
SELECT 
    'EXISTING RECORDS:' as section,
    'purchase_updates' as table_name,
    COALESCE((SELECT COUNT(*) FROM purchase_updates), 0) as record_count
UNION ALL
SELECT 
    'EXISTING RECORDS:' as section,
    'transaction_edit_sessions' as table_name,
    COALESCE((SELECT COUNT(*) FROM transaction_edit_sessions), 0) as record_count
UNION ALL
SELECT 
    'EXISTING RECORDS:' as section,
    'purchase_edit_sessions' as table_name,
    COALESCE((SELECT COUNT(*) FROM purchase_edit_sessions), 0) as record_count;

-- 6. Check if we have test data to work with
SELECT 
    'TEST DATA:' as section,
    'transactions' as table_name,
    COUNT(*) as record_count
FROM transactions
UNION ALL
SELECT 
    'TEST DATA:' as section,
    'purchases' as table_name,
    COUNT(*) as record_count
FROM purchases;

-- 7. Show the diagnosis
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_edit_sessions') 
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_edit_sessions')
        THEN 'NEW SYSTEM EXISTS - Check triggers and functions'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_updates') 
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_updates')
        THEN 'OLD SYSTEM EXISTS - Need to upgrade to new system'
        ELSE 'NO SYSTEM EXISTS - Need to run improve_history_tracking_system.sql'
    END as diagnosis;

-- 8. Show what needs to be done
SELECT 
    'NEXT STEPS:' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_edit_sessions') 
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_edit_sessions')
        THEN 'Run improve_history_tracking_system.sql to recreate functions and triggers'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_updates') 
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_updates')
        THEN 'Run improve_history_tracking_system.sql to upgrade to new system'
        ELSE 'Run improve_history_tracking_system.sql to create complete system'
    END as action_needed; 
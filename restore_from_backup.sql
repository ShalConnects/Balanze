-- =====================================================
-- RESTORE FROM BACKUP - Emergency Recovery
-- =====================================================
-- Use this if something goes wrong after cleanup
-- This will help you restore from your JSON/CSV backups
-- =====================================================

-- =====================================================
-- OPTION 1: Restore from Safe Mode Archive (EASIEST!)
-- =====================================================
-- If you used Safe Mode, restoring is instant:

-- Step 1: Check what's in the archive
SELECT 'Tables in archive:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'archived_tables'
ORDER BY tablename;

-- Step 2: Restore a specific table
-- UNCOMMENT and modify the table name you want to restore:

-- ALTER TABLE archived_tables.audit_logs SET SCHEMA public;
-- ALTER TABLE archived_tables.transaction_update_history SET SCHEMA public;
-- ALTER TABLE archived_tables.purchase_updates SET SCHEMA public;
-- ALTER TABLE archived_tables.lend_borrow_returns SET SCHEMA public;
-- ALTER TABLE archived_tables.article_reading_history SET SCHEMA public;
-- ALTER TABLE archived_tables.payment_methods SET SCHEMA public;

-- Step 3: Verify restoration
SELECT 'Restored tables in public schema:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT 'Restoration from Safe Mode complete!' as status;

-- =====================================================
-- OPTION 2: Restore Individual Records from JSON
-- =====================================================
-- If you have JSON backups, you can restore specific records

-- Example: Restore a single account record
-- Replace the values with data from your JSON backup

/*
INSERT INTO accounts (
    id, 
    user_id, 
    name, 
    type, 
    initial_balance, 
    calculated_balance,
    currency, 
    description, 
    is_active,
    created_at
) VALUES (
    'your-uuid-here'::uuid,
    'user-uuid-here'::uuid,
    'Account Name',
    'checking',
    1000.00,
    1000.00,
    'USD',
    'Account description',
    true,
    NOW()
);
*/

-- Example: Restore a transaction record
-- Replace with data from your JSON backup

/*
INSERT INTO transactions (
    id,
    user_id,
    account_id,
    type,
    amount,
    description,
    category,
    date,
    created_at
) VALUES (
    'transaction-uuid'::uuid,
    'user-uuid'::uuid,
    'account-uuid'::uuid,
    'expense',
    50.00,
    'Transaction description',
    'Food & Dining',
    '2025-01-15',
    NOW()
);
*/

-- =====================================================
-- OPTION 3: Bulk Restore from JSON
-- =====================================================
-- If you need to restore many records at once

-- Step 1: Prepare your JSON data
-- Take the JSON from your backup file and format it

-- Step 2: Use COPY or INSERT statements
-- Example structure:

/*
WITH json_data AS (
    SELECT '[
        {"id": "uuid1", "name": "Account 1", ...},
        {"id": "uuid2", "name": "Account 2", ...}
    ]'::json AS data
)
INSERT INTO accounts (id, name, type, ...)
SELECT 
    (value->>'id')::uuid,
    value->>'name',
    value->>'type',
    ...
FROM json_data, json_array_elements(json_data.data);
*/

-- =====================================================
-- OPTION 4: Verify Your Data After Restore
-- =====================================================

-- Check row counts match your backup
SELECT 'Row count verification:' as info;

SELECT 'accounts' as table_name, COUNT(*) as current_count, 
       'Compare with your backup count' as note
FROM accounts
UNION ALL
SELECT 'transactions', COUNT(*), 'Compare with your backup count'
FROM transactions
UNION ALL
SELECT 'purchases', COUNT(*), 'Compare with your backup count'
FROM purchases
UNION ALL
SELECT 'categories', COUNT(*), 'Compare with your backup count'
FROM categories
ORDER BY table_name;

-- =====================================================
-- EMERGENCY: Restore Everything from Scratch
-- =====================================================
-- If you need to rebuild completely, follow these steps:

-- Step 1: Verify tables exist
SELECT 'Verifying table structure...' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Step 2: If tables are missing, you'll need to recreate them
-- Use your original schema files or run:
-- (This would be from your setup_database_tables.sql file)

-- Step 3: Once tables exist, insert your backup data
-- Use the JSON data from your backups

-- =====================================================
-- POST-RESTORE CHECKLIST
-- =====================================================

SELECT '
==========================================
POST-RESTORE CHECKLIST
==========================================

After restoring, verify:

□ All tables are present
□ Row counts match your backup
□ Critical data is accessible
□ Relationships are intact
□ Your app loads without errors
□ You can log in
□ You can see your accounts
□ You can see your transactions

Test these features:
1. View dashboard
2. View accounts
3. View transactions
4. Add a test transaction
5. Check purchase history
6. Verify all data displays correctly

If everything looks good:
✓ Restoration successful!
✓ Document what happened
✓ Keep backups for 30 more days
✓ Consider more frequent backups

==========================================
' as checklist;

-- =====================================================
-- CONTACT INFO FOR HELP
-- =====================================================

SELECT '
Need more help?

If restoration is not working:
1. Check your JSON backup files are complete
2. Verify table structures exist
3. Check for foreign key issues
4. Review error messages carefully

Common issues:
- UUID format errors: Ensure ::uuid cast
- Foreign key violations: Restore in correct order
  (profiles → accounts → transactions → purchases)
- Duplicate key errors: Data may already exist

Restore order (important!):
1. profiles
2. accounts
3. categories
4. transactions
5. purchase_categories
6. purchases
7. everything else

' as help_info;


-- =====================================================
-- MANUAL BACKUP - COPY OUTPUT TO SAVE
-- =====================================================
-- Since you're on the free tier, use this manual backup method
-- 
-- INSTRUCTIONS:
-- 1. Run each section below ONE AT A TIME
-- 2. Copy the output from Supabase SQL Editor
-- 3. Paste into a text file: backup_[date].sql
-- 4. Save this file somewhere safe (Dropbox, Google Drive, etc.)
-- 5. This will be your restore point
-- =====================================================

-- =====================================================
-- SECTION 1: Count all data (QUICK CHECK)
-- =====================================================
SELECT '=== DATA COUNTS (Save this first!) ===' as info;

SELECT 'profiles: ' || COUNT(*) FROM profiles
UNION ALL
SELECT 'accounts: ' || COUNT(*) FROM accounts
UNION ALL
SELECT 'transactions: ' || COUNT(*) FROM transactions
UNION ALL
SELECT 'categories: ' || COUNT(*) FROM categories
UNION ALL
SELECT 'purchases: ' || COUNT(*) FROM purchases
UNION ALL
SELECT 'purchase_categories: ' || COUNT(*) FROM purchase_categories
UNION ALL
SELECT 'purchase_attachments: ' || COUNT(*) FROM purchase_attachments
UNION ALL
SELECT 'savings_goals: ' || COUNT(*) FROM savings_goals
UNION ALL
SELECT 'donation_saving_records: ' || COUNT(*) FROM donation_saving_records
UNION ALL
SELECT 'lend_borrow: ' || COUNT(*) FROM lend_borrow
UNION ALL
SELECT 'dps_transfers: ' || COUNT(*) FROM dps_transfers
UNION ALL
SELECT 'activity_history: ' || COUNT(*) FROM activity_history
UNION ALL
SELECT 'subscription_history: ' || COUNT(*) FROM subscription_history
UNION ALL
SELECT 'last_wish_settings: ' || COUNT(*) FROM last_wish_settings
UNION ALL
SELECT 'last_wish_deliveries: ' || COUNT(*) FROM last_wish_deliveries
UNION ALL
SELECT 'notifications: ' || COUNT(*) FROM notifications
UNION ALL
SELECT 'notification_preferences: ' || COUNT(*) FROM notification_preferences
UNION ALL
SELECT 'notes: ' || COUNT(*) FROM notes
UNION ALL
SELECT 'tasks: ' || COUNT(*) FROM tasks
UNION ALL
SELECT 'url_shortener: ' || COUNT(*) FROM url_shortener
UNION ALL
SELECT 'user_preferences: ' || COUNT(*) FROM user_preferences
UNION ALL
SELECT 'favorite_quotes: ' || COUNT(*) FROM favorite_quotes
ORDER BY 1;

-- Copy the output above and save it!

-- =====================================================
-- SECTION 2: Export PROFILES (Copy all output)
-- =====================================================
SELECT '=== PROFILES BACKUP ===' as info;
SELECT * FROM profiles;
-- Copy the entire results grid and save it as CSV or JSON

-- =====================================================
-- SECTION 3: Export ACCOUNTS (Copy all output)
-- =====================================================
SELECT '=== ACCOUNTS BACKUP ===' as info;
SELECT * FROM accounts;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 4: Export TRANSACTIONS (Copy all output)
-- =====================================================
SELECT '=== TRANSACTIONS BACKUP ===' as info;
SELECT * FROM transactions;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 5: Export CATEGORIES (Copy all output)
-- =====================================================
SELECT '=== CATEGORIES BACKUP ===' as info;
SELECT * FROM categories;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 6: Export PURCHASES (Copy all output)
-- =====================================================
SELECT '=== PURCHASES BACKUP ===' as info;
SELECT * FROM purchases;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 7: Export PURCHASE_CATEGORIES (Copy all output)
-- =====================================================
SELECT '=== PURCHASE CATEGORIES BACKUP ===' as info;
SELECT * FROM purchase_categories;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 8: Export PURCHASE_ATTACHMENTS (Copy all output)
-- =====================================================
SELECT '=== PURCHASE ATTACHMENTS BACKUP ===' as info;
SELECT * FROM purchase_attachments;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 9: Export SAVINGS_GOALS (Copy all output)
-- =====================================================
SELECT '=== SAVINGS GOALS BACKUP ===' as info;
SELECT * FROM savings_goals;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 10: Export DONATION_SAVING_RECORDS (Copy all output)
-- =====================================================
SELECT '=== DONATION SAVING RECORDS BACKUP ===' as info;
SELECT * FROM donation_saving_records;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 11: Export LEND_BORROW (Copy all output)
-- =====================================================
SELECT '=== LEND BORROW BACKUP ===' as info;
SELECT * FROM lend_borrow;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 12: Export DPS_TRANSFERS (Copy all output)
-- =====================================================
SELECT '=== DPS TRANSFERS BACKUP ===' as info;
SELECT * FROM dps_transfers;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 13: Export ACTIVITY_HISTORY (Copy all output)
-- =====================================================
SELECT '=== ACTIVITY HISTORY BACKUP ===' as info;
SELECT * FROM activity_history;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 14: Export SUBSCRIPTION_HISTORY (Copy all output)
-- =====================================================
SELECT '=== SUBSCRIPTION HISTORY BACKUP ===' as info;
SELECT * FROM subscription_history;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 15: Export LAST_WISH_SETTINGS (Copy all output)
-- =====================================================
SELECT '=== LAST WISH SETTINGS BACKUP ===' as info;
SELECT * FROM last_wish_settings;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 16: Export NOTIFICATIONS (Copy all output)
-- =====================================================
SELECT '=== NOTIFICATIONS BACKUP ===' as info;
SELECT * FROM notifications;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 17: Export NOTIFICATION_PREFERENCES (Copy all output)
-- =====================================================
SELECT '=== NOTIFICATION PREFERENCES BACKUP ===' as info;
SELECT * FROM notification_preferences;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 18: Export NOTES (Copy all output)
-- =====================================================
SELECT '=== NOTES BACKUP ===' as info;
SELECT * FROM notes;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 19: Export TASKS (Copy all output)
-- =====================================================
SELECT '=== TASKS BACKUP ===' as info;
SELECT * FROM tasks;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 20: Export URL_SHORTENER (Copy all output)
-- =====================================================
SELECT '=== URL SHORTENER BACKUP ===' as info;
SELECT * FROM url_shortener;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 21: Export USER_PREFERENCES (Copy all output)
-- =====================================================
SELECT '=== USER PREFERENCES BACKUP ===' as info;
SELECT * FROM user_preferences;
-- Copy the entire results grid and save it

-- =====================================================
-- SECTION 22: Export FAVORITE_QUOTES (Copy all output)
-- =====================================================
SELECT '=== FAVORITE QUOTES BACKUP ===' as info;
SELECT * FROM favorite_quotes;
-- Copy the entire results grid and save it

-- =====================================================
-- ALL DONE!
-- =====================================================
SELECT '
==========================================
BACKUP COMPLETE!
==========================================

You should now have:
1. Row counts for all tables
2. Full data exports from all tables

Save all this data in a safe place:
- Save to multiple locations
- Use cloud storage (Google Drive, Dropbox)
- Name it: backup_[your_name]_[date].sql
- Keep it until cleanup is successful

To restore (if needed):
- You will manually re-insert the data
- Or use the automated restore script provided

==========================================
' as completion;


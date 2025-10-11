# Database Cleanup Guide

## ⚠️ CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE PROCEEDING ⚠️

This guide will help you safely clean up unused tables in your Supabase database.

---

## 📊 Current Database Status

### Tables ACTIVELY USED in Your Application

Based on comprehensive code analysis, these tables are **currently in use** and **MUST NOT be deleted**:

#### Core Financial Tables
- ✅ `accounts` - User account records (checking, savings, credit, etc.)
- ✅ `transactions` - All financial transactions
- ✅ `categories` - Expense and income categories
- ✅ `purchases` - Purchase tracking and management
- ✅ `purchase_categories` - Purchase categorization
- ✅ `purchase_attachments` - File attachments for purchases
- ✅ `savings_goals` - User savings goals
- ✅ `donation_saving_records` - Donation and saving records
- ✅ `lend_borrow` - Lend and borrow tracking
- ✅ `dps_transfers` - DPS (Deposit Payment System) transfers

#### User & Authentication Tables
- ✅ `profiles` - User profile information
- ✅ `user_preferences` - User preferences and settings
- ✅ `favorite_quotes` - User's favorite quotes

#### Activity & Audit Tables
- ✅ `activity_history` - Audit logs and activity tracking
- ✅ `notifications` - Application notifications
- ✅ `notification_preferences` - User notification settings

#### Feature-Specific Tables
- ✅ `last_wish_settings` - Last Wish feature configuration
- ✅ `last_wish_deliveries` - Last Wish delivery tracking
- ✅ `subscription_history` - Payment and subscription history
- ✅ `notes` - User notes
- ✅ `tasks` - User tasks and todos
- ✅ `url_shortener` - Short URL mappings

#### Database Views
- ✅ `account_balances` - View for calculated account balances

---

### Tables POTENTIALLY UNUSED (Need Verification)

These tables MAY be legacy/deprecated but need verification before deletion:

#### Possibly Deprecated
- ❓ `audit_logs` - May have been replaced by `activity_history`
- ❓ `transaction_update_history` - May have been replaced by `activity_history`
- ❓ `purchase_updates` - May have been replaced by `activity_history`
- ❓ `lend_borrow_returns` - Possible deprecated feature
- ❓ `lend_borrow_installments` - Possible deprecated feature
- ❓ `article_reading_history` - Possible unused feature
- ❓ `payment_methods` - May be unused if using external providers

---

## 🚀 Cleanup Process (3 Steps)

### Step 1: Analysis (REQUIRED)

Run the analysis script to see what's in your database:

```sql
-- Run this in Supabase SQL Editor
-- File: database_cleanup_analysis.sql
```

**What this does:**
- Lists all tables in your database
- Shows table sizes and row counts
- Identifies potentially unused tables
- Checks for orphaned data
- Shows foreign key relationships

**Action:** Review the output carefully and identify which tables to remove.

---

### Step 2: Safe Mode Cleanup (RECOMMENDED)

Instead of deleting tables, move them to an archive schema first:

```sql
-- Run this in Supabase SQL Editor
-- File: database_cleanup_safe_mode.sql
```

**What this does:**
- Creates an `archived_tables` schema
- Moves unused tables there (not deleted!)
- Keeps data safe for restoration
- Allows you to test without risk

**Benefits:**
- ✅ No data loss
- ✅ Easy to restore if needed
- ✅ Test safely for 1-2 weeks
- ✅ Quick rollback

**How to use:**
1. Open `database_cleanup_safe_mode.sql`
2. Uncomment only the tables you verified as unused
3. Run the script
4. Test your application thoroughly
5. If all works well, proceed to Step 3

**To restore a table:**
```sql
ALTER TABLE archived_tables.table_name SET SCHEMA public;
```

---

### Step 3: Permanent Cleanup (ONLY AFTER TESTING)

After testing in Safe Mode for 1-2 weeks with no issues:

```sql
-- Run this in Supabase SQL Editor
-- File: database_cleanup_execute.sql
```

**What this does:**
- Permanently drops unused tables
- Frees up database storage
- Runs VACUUM ANALYZE for optimization

**⚠️ WARNING:**
- This permanently deletes data
- Cannot be undone without a backup
- Only run after successful Safe Mode testing

---

## 📋 Pre-Cleanup Checklist

Before running any cleanup scripts:

### Required Steps:
- [ ] Run `database_cleanup_analysis.sql` first
- [ ] Review all identified unused tables
- [ ] Create a database backup (see below)
- [ ] Test in development environment first
- [ ] Have a rollback plan ready
- [ ] Inform your team about the cleanup
- [ ] Schedule during low-traffic period

### Backup Your Database:

**Option 1: Supabase Dashboard**
1. Go to Supabase Dashboard
2. Navigate to Database → Backups
3. Click "Create Backup"
4. Download the backup file
5. Store it securely

**Option 2: Command Line (pg_dump)**
```bash
pg_dump -h your-db-host -U postgres -d your-database > backup_$(date +%Y%m%d).sql
```

---

## 🔍 How We Identified Used Tables

We performed a comprehensive analysis of your codebase:

1. **Scanned all TypeScript/JavaScript files** for `.from()` calls
2. **Analyzed store files** (`useFinanceStore.ts`, `authStore.ts`)
3. **Checked components** for direct database queries
4. **Reviewed SQL migration files**
5. **Identified views and foreign key relationships**
6. **Cross-referenced with feature usage**

### Tables Found in Code:

```typescript
// From src/store/useFinanceStore.ts
.from('accounts')
.from('transactions')
.from('categories')
.from('purchases')
.from('purchase_categories')
.from('purchase_attachments')
.from('savings_goals')
.from('donation_saving_records')
.from('lend_borrow')
.from('dps_transfers')
.from('activity_history')
.from('subscription_history')
.from('account_balances')  // view

// From src/store/authStore.ts
.from('profiles')

// From src/components/*
.from('notifications')
.from('notification_preferences')
.from('notes')
.from('tasks')
.from('url_shortener')
.from('last_wish_settings')
.from('last_wish_deliveries')
.from('user_preferences')
.from('favorite_quotes')
```

---

## 🛡️ Safety Measures

### Built-in Safeguards:

1. **Three-step process** - Analysis → Safe Mode → Permanent
2. **Safe Mode** - Archive instead of delete
3. **Backup reminders** - Multiple warnings to backup
4. **Manual confirmation** - You must uncomment tables to remove them
5. **Clear documentation** - Know exactly what you're doing

### Rollback Plan:

**If something goes wrong:**

1. **During Safe Mode:**
   ```sql
   ALTER TABLE archived_tables.table_name SET SCHEMA public;
   ```

2. **After Permanent Deletion:**
   ```sql
   -- Restore from backup
   psql -h your-db-host -U postgres -d your-database < backup_file.sql
   ```

---

## 🎯 Expected Outcomes

### Before Cleanup:
- Multiple unused/deprecated tables
- Larger database size
- Slower backup/restore operations
- Confusion about which tables are active

### After Cleanup:
- ✅ Only active tables remain
- ✅ Reduced database size
- ✅ Faster operations
- ✅ Clear database structure
- ✅ Easier maintenance

---

## 📞 Troubleshooting

### "Table doesn't exist" error
**Cause:** Table was already removed or never existed  
**Solution:** Skip that table in the cleanup script

### "Cannot drop table due to foreign key constraint"
**Cause:** Other tables reference this table  
**Solution:** Add `CASCADE` to the DROP statement (use carefully!)

### "Permission denied" error
**Cause:** Insufficient database permissions  
**Solution:** Use admin/postgres user or request elevated permissions

### Application errors after cleanup
**Cause:** Table was still in use  
**Solution:** Restore from Safe Mode archive or backup

---

## ✅ Post-Cleanup Verification

After cleanup, verify everything works:

1. **Test all features:**
   - [ ] Account creation/editing
   - [ ] Transaction management
   - [ ] Purchase tracking
   - [ ] Lend/Borrow features
   - [ ] User profile updates
   - [ ] Notifications
   - [ ] Last Wish feature
   - [ ] DPS transfers

2. **Check database:**
   ```sql
   -- Verify table count
   SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
   
   -- Check database size
   SELECT pg_size_pretty(pg_database_size(current_database()));
   ```

3. **Monitor logs:**
   - Check for any database-related errors
   - Monitor application performance
   - Review user reports

---

## 📚 Additional Resources

### Supabase Documentation:
- [Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [Database Management](https://supabase.com/docs/guides/database)
- [SQL Editor](https://supabase.com/docs/guides/database/sql-editor)

### PostgreSQL Documentation:
- [DROP TABLE](https://www.postgresql.org/docs/current/sql-droptable.html)
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [VACUUM](https://www.postgresql.org/docs/current/sql-vacuum.html)

---

## 🎉 Summary

**What You Have:**
- ✅ Comprehensive analysis script
- ✅ Safe mode cleanup script (archive tables)
- ✅ Permanent cleanup script
- ✅ This detailed guide
- ✅ Complete list of active vs unused tables
- ✅ Rollback procedures

**Next Steps:**
1. Run analysis script
2. Review results
3. Backup database
4. Run safe mode cleanup
5. Test thoroughly (1-2 weeks)
6. Run permanent cleanup (if all is well)
7. Verify and celebrate! 🎊

---

**Remember:** When in doubt, don't delete. Better to keep an unused table than to lose important data!

Good luck! 🚀


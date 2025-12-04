# ✅ FAILSAFE CHECKLIST - Your Safety Net

## 🎯 Before You Touch ANYTHING

Print this checklist or keep it open. Check off each item **BEFORE** running cleanup.

---

## 📋 Pre-Flight Checklist (DO THIS FIRST!)

### Phase 1: Backup Everything (15 minutes)

- [ ] **Open Supabase SQL Editor**
- [ ] **Open file:** `backup_json_export.sql`
- [ ] **Run the Quick Snapshot** (first query)
  - Copy the output
  - Save as: `snapshot_before_cleanup.json`
  - **This is your "before" picture!**

- [ ] **Export each table as JSON:**
  - [ ] Run profiles export → Save as `backup_profiles.json`
  - [ ] Run accounts export → Save as `backup_accounts.json`
  - [ ] Run transactions export → Save as `backup_transactions.json`
  - [ ] Run categories export → Save as `backup_categories.json`
  - [ ] Run purchases export → Save as `backup_purchases.json`
  - [ ] Run purchase_categories export → Save as `backup_purchase_categories.json`
  - [ ] Run savings_goals export → Save as `backup_savings_goals.json`
  - [ ] Run lend_borrow export → Save as `backup_lend_borrow.json`

- [ ] **Store backups in MULTIPLE places:**
  - [ ] Upload to Google Drive (create folder: "FinTrack_Backups_2025")
  - [ ] Upload to Dropbox OR OneDrive (second location)
  - [ ] Email to yourself (third backup)
  - [ ] Save to USB drive (if available)

- [ ] **Verify backups:**
  - [ ] Open each JSON file to make sure it's not empty
  - [ ] Check file sizes are reasonable (not 0 bytes)
  - [ ] Confirm you can access cloud storage

---

## 🔍 Phase 2: Analysis (5 minutes)

- [ ] **Run:** `database_cleanup_analysis.sql`
- [ ] **Review output carefully:**
  - [ ] Note how many tables you have
  - [ ] Check row counts for each table
  - [ ] Identify potentially unused tables
  - [ ] Make note of tables with 0 rows

- [ ] **Write down which tables you want to remove:**
  ```
  Tables I verified are unused:
  - _____________________
  - _____________________
  - _____________________
  ```

---

## 🛡️ Phase 3: Safe Mode Cleanup (5 minutes)

**THIS IS THE KEY! Safe Mode doesn't delete anything!**

- [ ] **Open:** `database_cleanup_safe_mode.sql`
- [ ] **Read the entire script first**
- [ ] **For each table you want to remove:**
  - [ ] Find it in the script
  - [ ] Uncomment ONLY that line
  - [ ] Double-check it's the right table
- [ ] **Run the script**
- [ ] **Verify tables moved to archive:**
  ```sql
  SELECT tablename FROM pg_tables WHERE schemaname = 'archived_tables';
  ```
- [ ] **Take screenshot of archived tables** (extra safety)

---

## 🧪 Phase 4: Testing Period (1-2 weeks)

**Your app is still running normally. Tables are archived, not deleted.**

### Day 1 Testing:
- [ ] Log into your app
- [ ] Check dashboard loads
- [ ] View accounts
- [ ] View transactions
- [ ] View purchases
- [ ] Add a test transaction
- [ ] Edit a transaction
- [ ] Delete test transaction
- [ ] Check all navigation works

### Day 3 Testing:
- [ ] Repeat all Day 1 tests
- [ ] Use lend/borrow feature (if you use it)
- [ ] Check donation/savings (if you use it)
- [ ] Try all features you normally use

### Week 1 Testing:
- [ ] No errors in console?
- [ ] No missing data?
- [ ] All features working?
- [ ] Users reporting no issues?

### Week 2 Testing:
- [ ] Final comprehensive test
- [ ] Check ALL features one more time
- [ ] Review any error logs
- [ ] Confirm everything is stable

**If ANYTHING is wrong during testing:**
```sql
-- Restore from archive immediately:
ALTER TABLE archived_tables.table_name SET SCHEMA public;
```

---

## 🗑️ Phase 5: Permanent Cleanup (OPTIONAL - Only after successful testing)

**You can skip this phase and leave tables archived forever! That's fine!**

Only proceed if:
- [ ] You tested for at least 2 weeks
- [ ] Zero errors occurred
- [ ] All features work perfectly
- [ ] You're 100% confident

If proceeding:
- [ ] **Open:** `database_cleanup_execute.sql`
- [ ] **Uncomment ONLY the same tables** you archived
- [ ] **Double-check each line**
- [ ] **Run the script**
- [ ] **Verify cleanup successful**

---

## 🆘 Emergency Procedures

### If Something Breaks During Testing:

**STOP! Restore immediately:**

```sql
-- In Supabase SQL Editor, run:
ALTER TABLE archived_tables.your_table_name SET SCHEMA public;
```

**Then:**
1. Test again to confirm it's fixed
2. Document what broke
3. Keep that table (don't delete it)

---

### If Something Breaks After Permanent Deletion:

**Option 1: Restore from JSON backup**
1. Open `restore_from_backup.sql`
2. Follow instructions to restore from JSON
3. Use your backup files

**Option 2: Restore individual records**
1. Open your JSON backup file
2. Copy the data for the missing records
3. Insert manually into the table

---

## 🎯 Quick Decision Tree

```
Do you have JSON backups? 
├─ NO → STOP! Go back to Phase 1
└─ YES → Continue
    │
    Did you use Safe Mode?
    ├─ NO → STOP! Use Safe Mode first
    └─ YES → Continue
        │
        Did you test for 1-2 weeks?
        ├─ NO → Keep testing
        └─ YES → Continue
            │
            Any errors during testing?
            ├─ YES → Restore and investigate
            └─ NO → Safe to proceed (or keep archived forever!)
```

---

## 💾 Backup Schedule (Going Forward)

After cleanup, backup regularly:

**Weekly:**
- [ ] Export critical tables (accounts, transactions)
- [ ] Save to cloud storage

**Monthly:**
- [ ] Full database export (all tables)
- [ ] Verify backups are accessible

**Before major changes:**
- [ ] Always export everything first
- [ ] Test in Safe Mode
- [ ] Keep backups for 30 days

---

## 🎉 Success Criteria

You're done and safe when:

- [✓] All backups stored in multiple locations
- [✓] Safe Mode cleanup completed
- [✓] Tested for 1-2 weeks with no issues
- [✓] App is working perfectly
- [✓] You have restore procedures ready
- [✓] You know how to restore if needed

---

## 📝 Document Your Actions

**Keep a log:**

```
Date: __________
Action: Ran Safe Mode cleanup
Tables archived: ____________, ____________, ____________
Backups stored in: Google Drive, Dropbox
Testing started: __________
Testing completed: __________
Issues found: None / [Describe any issues]
Final status: Success / Restored / Kept archived
```

---

## 🔐 The Golden Rules

1. **ALWAYS backup first** (JSON export)
2. **ALWAYS use Safe Mode before permanent deletion**
3. **ALWAYS test for 1-2 weeks**
4. **NEVER delete without testing in Safe Mode**
5. **NEVER skip backups** (even if you think you don't need them)
6. **WHEN IN DOUBT, DON'T DELETE!**

---

## ✨ You're Protected!

With this checklist:
- ✅ **Zero risk** of permanent data loss
- ✅ **Multiple safety nets** (JSON backups + Safe Mode)
- ✅ **Clear restore procedures**
- ✅ **Step-by-step guidance**
- ✅ **Emergency procedures ready**

**You literally cannot lose data if you follow this checklist!**

---

## 🚀 Ready to Start?

**Start here:**
1. Print or bookmark this checklist
2. Open `backup_json_export.sql`
3. Begin Phase 1 (Backup Everything)
4. Check off each item as you go
5. Don't rush - this is important!

**Remember:** Safe Mode means you can undo anything instantly. You're in complete control!

Good luck! 🎊

---

**Last reminder:** The entire cleanup process is SAFE because:
1. You have JSON backups (can restore anything)
2. Safe Mode doesn't delete (just archives)
3. You test for 1-2 weeks before permanent changes
4. You can restore instantly if needed

**You've got this!** 💪


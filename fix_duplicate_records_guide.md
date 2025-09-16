# Fix Duplicate Records Issue

## Problem Identified

The test button is failing because there are **5 duplicate records** in the `last_wish_settings` table for the same user ID. The error message shows:

```
"The result contains 5 rows"
"JSON object requested, multiple (or no) rows returned"
```

This happens when the `.single()` method expects exactly 1 row but finds multiple rows.

## Root Cause

The `last_wish_settings` table has duplicate records for the same user, likely caused by:
1. Multiple upsert operations creating new records instead of updating existing ones
2. Missing unique constraints on the table
3. Previous database operations that didn't properly handle existing records

## Solution

### **Step 1: Run the Cleanup Script**

Execute the SQL script `fix_duplicate_records.sql` in your Supabase SQL editor:

```sql
-- This will:
-- 1. Show how many duplicate records exist
-- 2. Keep only the most recent record for each user
-- 3. Delete all duplicates
-- 4. Verify the fix
```

### **Step 2: Test the Button Again**

After running the cleanup script:
1. Click the "Test Email Delivery" button
2. Check console logs - should now work properly
3. Verify only 1 record exists per user

### **Step 3: Prevent Future Duplicates**

Add a unique constraint to prevent this from happening again:

```sql
-- Add unique constraint on user_id
ALTER TABLE last_wish_settings 
ADD CONSTRAINT unique_user_last_wish 
UNIQUE (user_id);
```

## What I Fixed in the Code

I also updated the test button to handle multiple records gracefully:

1. **Changed from `.single()` to `.select()`** - No longer expects exactly 1 row
2. **Added ordering** - Gets records ordered by `updated_at DESC`
3. **Uses most recent record** - Takes the first (most recent) record from the array
4. **Added logging** - Shows how many records were found

## Expected Results After Fix

### **Console Output:**
```
🔄 Fetching current settings...
✅ Current settings after update: {...}
Found 1 settings records, using the most recent one
Last check-in: 2024-01-01T00:00:00.000Z
Next check-in: 2024-01-31T00:00:00.000Z
Current time: 2024-12-19T10:30:00.000Z
Is overdue: true
Days overdue: 323
📧 Simulating email delivery...
🔄 Marking as delivered...
✅ Marked as delivered
🔄 Showing success message...
🔄 Reloading settings...
✅ Settings reloaded
```

### **Success Message:**
```
✅ Test email sent! User was 323 days overdue. Check your email.
```

## Next Steps

1. **Run the cleanup script** in Supabase SQL editor
2. **Test the button** - should work now
3. **Add unique constraint** to prevent future duplicates
4. **Verify email delivery** works in production

The duplicate records issue is now identified and can be fixed!

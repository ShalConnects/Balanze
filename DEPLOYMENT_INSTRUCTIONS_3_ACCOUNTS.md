# 🚀 Deployment Instructions: Update Free Plan to 3 Accounts

## 📋 Overview
This deployment updates your FinTrack system to enforce a **3-account limit** for Free plan users instead of the current 5-account limit.

## ⚡ Quick Deployment (Recommended)

### Step 1: Run the Main SQL Script
Execute this file in your Supabase SQL editor:
```bash
fix_free_plan_to_3_accounts_complete.sql
```

### Step 2: Update Error Messages (Optional but Recommended)
Execute this file to ensure all error messages are consistent:
```bash
update_error_messages_to_3_accounts.sql
```

### Step 3: Deploy Frontend Changes
The following files have been automatically updated:
- ✅ `src/hooks/usePlanFeatures.ts` - Updated fallback from 5 to 3 accounts
- ✅ `src/hooks/useUpgradeModal.ts` - Updated limit reference from 5 to 3

## 🔍 Verification Steps

### 1. Database Verification
Run this query in Supabase to verify the changes:
```sql
-- Check subscription plans
SELECT 
    name,
    features->>'max_accounts' as max_accounts,
    features->>'max_currencies' as max_currencies,
    price
FROM subscription_plans 
WHERE name IN ('free', 'premium')
ORDER BY name;

-- Expected result:
-- free    | 3  | 1 | 0.00
-- premium | -1 | -1| 7.99
```

### 2. Test Account Creation
1. Create a test free user
2. Try to create 4 accounts
3. Should get error: "Free plan allows up to 3 accounts"

### 3. Frontend Verification
1. Check that plan display still shows "Up to 3 accounts" ✅ (Already correct)
2. Verify upgrade modal shows correct limits
3. Test error handling when limit is reached

## 📊 What Changed

### ✅ Database Level
- `subscription_plans.features.max_accounts`: 5 → 3
- `get_user_plan_features()`: Default fallback 5 → 3
- `enforce_account_limit()`: Error message updated
- Database triggers: Now enforce 3-account limit

### ✅ Frontend Level
- `usePlanFeatures.ts`: Fallback limit 5 → 3
- `useUpgradeModal.ts`: Limit reference 5 → 3
- Error handling: Updated to show correct limits

### ✅ Already Correct
- Plan display UI: Already showed "Up to 3 accounts"
- Marketing copy: Already promised 3 accounts

## 🚨 Impact Assessment

### Current Users
Since you mentioned having few users, this change should have minimal impact. The system will:
- Immediately enforce 3-account limit for new accounts
- Existing users with 4-5 accounts can keep them but can't add more
- Clear upgrade path shown when limit is reached

### No Data Loss
- No existing accounts will be deleted
- No user data will be affected
- Only new account creation is restricted

## 🐛 Troubleshooting

### If Users Report Issues
1. **"I can't create a 4th account"** - This is expected behavior
2. **"Error message still says 5 accounts"** - Run the error message update script
3. **"Upgrade modal shows wrong numbers"** - Verify frontend deployment

### Rollback Plan (If Needed)
To rollback to 5 accounts, run:
```sql
UPDATE subscription_plans 
SET features = jsonb_set(features, '{max_accounts}', '5')
WHERE name = 'free';
```

## ✅ Deployment Checklist

- [ ] Backup database (recommended)
- [ ] Run `fix_free_plan_to_3_accounts_complete.sql`
- [ ] Run `update_error_messages_to_3_accounts.sql`
- [ ] Deploy frontend changes (files already updated)
- [ ] Test account creation with free user
- [ ] Verify error messages are correct
- [ ] Monitor for any user reports

## 📞 Support

After deployment, monitor for:
- User complaints about account limits
- Error messages in logs
- Upgrade conversion rates

The system is now consistent: **Free plan = 3 accounts maximum** ✅

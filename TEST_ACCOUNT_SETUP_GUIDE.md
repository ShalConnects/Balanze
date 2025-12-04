# Test Account Setup Guide for megmukt@gmail.com

This guide will help you create a test account for `megmukt@gmail.com` to simulate the new user experience in your FinTrack application.

## Overview

The test account will be set up as a completely new user with:
- ✅ Fresh user account in Supabase Auth
- ✅ New profile with free plan subscription
- ✅ No existing accounts or transactions
- ✅ Clean slate for testing the new user onboarding flow

## Method 1: Using SQL Scripts (Recommended)

### Step 1: Run the SQL Script

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Run one of these scripts:

**Option A: Complete Setup (Recommended)**
```sql
-- Copy and paste the contents of create_test_account_megmukt.sql
```

**Option B: Simple Setup**
```sql
-- Copy and paste the contents of create_test_account_simple.sql
```

### Step 2: Verify the Setup

After running the SQL script, you should see output confirming:
- User created in `auth.users`
- Profile created in `public.profiles`
- No existing accounts or transactions

## Method 2: Using JavaScript Test Script

### Step 1: Configure the Test Script

1. Open `test_megmukt_account.js`
2. Replace the placeholder values:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

### Step 2: Run the Test Script

```bash
node test_megmukt_account.js
```

This script will:
- Create the account if it doesn't exist
- Test login functionality
- Verify profile creation
- Confirm new user experience (no existing data)

## Method 3: Manual Account Creation

If the automated methods don't work, you can create the account manually:

### Step 1: Create User in Supabase Auth

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Fill in:
   - Email: `megmukt@gmail.com`
   - Password: `New12###`
   - Auto Confirm User: ✅ (checked)

### Step 2: Create Profile

1. Go to Supabase Dashboard → Table Editor → profiles
2. Insert a new row:
   ```json
   {
     "id": "[USER_ID_FROM_STEP_1]",
     "full_name": "Test User",
     "local_currency": "USD",
     "role": "user",
     "subscription": {"plan": "free", "status": "active", "validUntil": null}
   }
   ```

## Login Credentials

Once the account is set up, you can log in with:

- **Email:** `megmukt@gmail.com`
- **Password:** `New12###`

## What to Expect

When you log in with this account, you should see:

1. **Welcome Modal**: The app should detect this is a new user and show the welcome/onboarding modal
2. **Empty Dashboard**: No accounts, transactions, or other data
3. **Free Plan**: User should have the free plan with 3 account limit
4. **Clean State**: Perfect for testing the new user experience

## Troubleshooting

### Account Already Exists Error

If you get an "account already exists" error:

1. **Option 1**: Use the SQL scripts which automatically clean up existing data
2. **Option 2**: Manually delete the user from Supabase Dashboard → Authentication → Users
3. **Option 3**: Change the email to a different test email

### Profile Not Created

If the profile isn't created automatically:

1. Check if the database trigger is working
2. Manually create the profile using the SQL from the scripts
3. Verify RLS policies allow profile creation

### Can't Log In

If login fails:

1. Verify the password is exactly `New12###`
2. Check if the user is confirmed in Supabase Auth
3. Ensure the user exists in both `auth.users` and `public.profiles`

## Testing the New User Experience

Once logged in, you can test:

1. **Onboarding Flow**: Does the welcome modal appear?
2. **Account Creation**: Can you create your first account?
3. **Transaction Entry**: Can you add your first transaction?
4. **Plan Limits**: Does the free plan limit of 3 accounts work correctly?
5. **Dashboard State**: Is the dashboard empty and ready for new data?

## Clean Up

To reset the test account:

1. Run the SQL cleanup script
2. Or manually delete the user from Supabase Dashboard
3. Or use the JavaScript test script which can clean up and recreate

## Files Created

- `create_test_account_megmukt.sql` - Complete SQL setup script
- `create_test_account_simple.sql` - Simplified SQL setup script  
- `test_megmukt_account.js` - JavaScript test and verification script
- `TEST_ACCOUNT_SETUP_GUIDE.md` - This guide

## Next Steps

After setting up the test account:

1. Log in with the credentials
2. Test the new user onboarding flow
3. Verify all features work for a fresh user
4. Document any issues or improvements needed
5. Use this account for ongoing testing of new user features

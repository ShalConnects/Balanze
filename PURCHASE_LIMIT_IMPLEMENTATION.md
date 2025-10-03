# Purchase Limit Implementation - Option 1

## Overview
Implemented purchase limits for the Free plan (50 purchases) and unlimited purchases for Premium plans. This prevents users from bypassing transaction limits by creating unlimited "excluded from calculation" purchases.

## Changes Made

### 1. Database Changes (SQL File)
**File**: `add_purchase_limit_enforcement.sql`

- ✅ Updated subscription plans to include `max_purchases` field (50 for free, -1 for premium)
- ✅ Updated `get_user_plan_features()` function to include purchase limit in default features
- ✅ Created `check_purchase_limit()` function to validate purchase creation
- ✅ Created `enforce_purchase_limit()` trigger function with error code `PURCHASE_LIMIT_EXCEEDED`
- ✅ Added trigger on `purchases` table to enforce limits
- ✅ Updated `get_user_usage_stats()` function to include purchase statistics

**To Deploy**: Run the SQL file against your Supabase database:
```sql
-- Execute add_purchase_limit_enforcement.sql in your Supabase SQL editor
```

### 2. Frontend Pricing Pages

#### Landing Page (`src/pages/LandingPage.tsx`)
- ✅ **Free Plan**: Changed "Basic purchase tracking" → "50 purchases limit"
- ✅ **Premium Plan**: Added "Unlimited purchases" feature

#### Settings Plans Page (`src/components/Dashboard/Plans.tsx`)
- ✅ **Free Plan**: Changed "Basic purchase tracking" → "50 purchases limit"
- ✅ **Premium Plan**: Added "Unlimited purchases" feature

### 3. TypeScript Type Definitions

#### Plan Features Hook (`src/hooks/usePlanFeatures.ts`)
- ✅ Added `max_purchases: number` to `PlanFeatures` interface
- ✅ Added `purchases` object to `UsageStats` interface
- ✅ Updated default free plan features to include `max_purchases: 50`
- ✅ Created `canCreatePurchase()` helper function
- ✅ Updated `isNearLimit()` and `isAtLimit()` to support 'purchases' type
- ✅ Added upgrade message for `unlimited_purchases`
- ✅ Exported `canCreatePurchase` function

#### Upgrade Modal Hook (`src/hooks/useUpgradeModal.ts`)
- ✅ Added `PURCHASE_LIMIT_EXCEEDED` error handling in `handleDatabaseError()`
- ✅ Created `showPurchaseLimitModal()` convenience function
- ✅ Exported `showPurchaseLimitModal` in return object

## Plan Limits Summary

### Free Plan
- 3 accounts
- 1 currency
- 100 transactions
- **50 purchases** ← NEW
- Basic features only

### Premium Plan
- Unlimited accounts
- Unlimited currencies
- Unlimited transactions
- **Unlimited purchases** ← NEW
- All premium features

## How It Works

1. **Database Enforcement**: When a user tries to create a purchase, the `enforce_purchase_limit_trigger` checks their current purchase count against their plan limit.

2. **Error Handling**: If limit is exceeded, the database throws `PURCHASE_LIMIT_EXCEEDED` error, which is caught by `useUpgradeModal.handleDatabaseError()`.

3. **User Experience**: User sees an upgrade modal showing their current usage (e.g., "You have 50/50 purchases") and is prompted to upgrade to Premium.

4. **Count Logic**: The limit applies to ALL purchases (both transaction-linked and excluded purchases) to prevent any loopholes.

## Testing Checklist

- [ ] Deploy SQL file to database
- [ ] Verify free plan features include `max_purchases: 50`
- [ ] Verify premium plan features include `max_purchases: -1`
- [ ] Test creating 51st purchase as free user - should show upgrade modal
- [ ] Test creating purchases as premium user - should work without limits
- [ ] Verify pricing pages show correct purchase limits
- [ ] Test upgrade flow from purchase limit modal

## Files Modified

1. ✅ `add_purchase_limit_enforcement.sql` (NEW)
2. ✅ `src/pages/LandingPage.tsx`
3. ✅ `src/components/Dashboard/Plans.tsx`
4. ✅ `src/hooks/usePlanFeatures.ts`
5. ✅ `src/hooks/useUpgradeModal.ts`

## Next Steps

1. **Deploy the SQL file** to your Supabase database
2. Test the purchase limit enforcement with a free account
3. Verify the upgrade modal appears correctly when limit is reached
4. Update any documentation or help center articles about plan limits

## Notes

- The 50 purchase limit is a reasonable starting point and can be adjusted in the database by updating the `max_purchases` value in the `subscription_plans` table.
- The limit applies to the total purchase count, regardless of whether they're linked to transactions or excluded from calculations.
- Premium users get unlimited purchases, making the value proposition clear.


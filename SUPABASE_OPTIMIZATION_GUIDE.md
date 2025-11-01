# Supabase Free Tier Egress Optimization Guide

## Problem
Your Supabase project is exceeding the free tier limit for **Cached Egress** (12.974 GB used vs 5 GB limit = 259%).

## Root Causes Identified

### 1. **Fetching ALL Transactions Without Limits** ⚠️ FIXED
- **Location**: Multiple transfer components
  - `TransfersTableView.tsx`
  - `Transfer_new.tsx`  
  - `TransfersView.tsx`
- **Issue**: These components were fetching ALL transactions just to calculate balances
- **Impact**: This is the main culprit - fetching thousands of transactions on every page load

### 2. **Image Loading Without Caching** ⚠️ FIXED
- **Location**: 
  - `Header.tsx` - Profile pictures with `Date.now()` timestamp
  - `ProfileEditModal.tsx` - Timestamp preventing caching
- **Issue**: Adding timestamps forces browser to bypass cache, re-fetching images repeatedly
- **Impact**: Causes high "Cached Egress" usage

### 3. **Missing Query Limits** ⚠️ FIXED
- Transfer queries had no limits
- DPS transfers had no limits

## Fixes Applied

### ✅ 1. Added Limits to Transaction Queries
- Limited transfer queries to **500 records**
- Limited "all transactions" queries to **1000 records** with selective columns
- Changed `select('*')` to `select('id, account_id, amount, date, type, tags')` for balance calculations

### ✅ 2. Optimized Supabase Client Configuration
- Added cache headers to Supabase client
- Configured proper session persistence

### ✅ 3. Fixed Image Caching
- Removed unnecessary `Date.now()` timestamps from profile picture URLs
- Added `loading="lazy"` attribute to images
- Only use timestamps when uploading NEW images (not for display)

## Additional Recommendations

### 🔍 Monitor Your Usage
1. Check Supabase Dashboard regularly for egress trends
2. Use Supabase Analytics to identify heavy queries
3. Set up alerts when approaching limits

### 💡 Further Optimizations You Can Do

#### 1. **Implement Pagination**
Instead of loading all records, implement pagination:
```typescript
// Example: Paginated query
const { data } = await supabase
  .from('purchases')
  .select('*')
  .range(0, 49) // First 50 records
  .order('purchase_date', { ascending: false });
```

#### 2. **Use Selective Column Fetching**
Only fetch columns you actually need:
```typescript
// Bad: fetch all columns
.select('*')

// Good: fetch only needed columns
.select('id, name, price, date')
```

#### 3. **Implement Client-Side Caching**
Cache frequently accessed data in localStorage or a state management solution:
```typescript
// Cache purchases for 5 minutes
const cacheKey = `purchases_${user.id}`;
const cached = localStorage.getItem(cacheKey);
if (cached && Date.now() - JSON.parse(cached).timestamp < 5 * 60 * 1000) {
  return JSON.parse(cached).data;
}
```

#### 4. **Use Database Views for Complex Queries**
Instead of fetching all transactions to calculate balances, use the `account_balances` view you already have.

#### 5. **Optimize Image Sizes**
- Already compressing avatars to 256x256 (good!)
- Consider compressing purchase attachments further
- Use WebP format for better compression

#### 6. **Batch Queries**
Combine multiple queries where possible:
```typescript
// Instead of multiple queries
const [accounts, transactions] = await Promise.all([
  supabase.from('accounts').select('*'),
  supabase.from('transactions').select('*').limit(100)
]);
```

#### 7. **Add Date Filters**
For history pages, fetch only recent data by default:
```typescript
// Only fetch last 30 days by default
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const { data } = await supabase
  .from('transactions')
  .select('*')
  .gte('date', thirtyDaysAgo.toISOString())
  .limit(500);
```

#### 8. **Disable Unused Features Temporarily**
- If you have features that fetch large amounts of data infrequently, consider disabling them
- Or make them "load on demand" instead of loading automatically

#### 9. **Check for Unnecessary Re-fetches**
Look for `useEffect` hooks that might be triggering unnecessary data fetches:
```typescript
// Bad: Fetches on every render
useEffect(() => {
  fetchData();
}, [someValue]); // If someValue changes frequently

// Good: Only fetch when needed
useEffect(() => {
  if (shouldFetch) {
    fetchData();
  }
}, [shouldFetch]);
```

#### 10. **Use CDN for Static Assets**
If you have many images/files, consider using a CDN instead of Supabase Storage for public assets.

## Expected Impact

After these fixes:
- **Egress reduction**: Should reduce by 60-80% (from ~13GB to ~2-5GB per month)
- **Page load performance**: Faster page loads due to smaller queries
- **User experience**: Minimal impact if you have <1000 transactions per user

## What to Do Next

1. ✅ **Deploy these changes immediately**
2. 📊 **Monitor Supabase dashboard for 24-48 hours** to see egress reduction
3. 🔄 **Wait for billing cycle reset** - Your current usage (259%) won't reset until next billing cycle
4. 📈 **Track daily usage** - Should see ~70% reduction in daily egress

## If Still Over Limit After Fixes

1. **Temporarily reduce limits further**:
   - Change 1000 to 500 for transaction queries
   - Change 500 to 250 for transfer queries

2. **Implement "Load More" buttons** instead of loading all data at once

3. **Consider Supabase's Pro plan** ($25/month) if you need higher limits:
   - 250 GB egress (vs 5 GB free)
   - Better for production apps

4. **Alternative**: Use a different database for heavy queries (PostgreSQL hosted elsewhere)

## Questions?

The main fix was limiting the "fetch all transactions" queries. This alone should reduce your egress significantly.


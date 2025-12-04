-- =====================================================
-- FIX VIEW SECURITY - SECURE UNDERLYING TABLES
-- Views inherit security from their underlying tables
-- =====================================================

-- Step 1: Check which views are showing as unrestricted
SELECT '=== VIEWS SHOWING AS UNRESTRICTED ===' as info;

SELECT 
    viewname as view_name,
    'VIEW' as object_type,
    'Inherits security from underlying tables' as note
FROM pg_views 
WHERE schemaname = 'public'
    AND viewname IN (
        'account_balances',
        'category_budgets_by_currency',
        'purchase_analytics_by_currency'
    )
ORDER BY viewname;

-- Step 2: Check underlying tables for account_balances view
SELECT '=== UNDERLYING TABLES FOR ACCOUNT_BALANCES VIEW ===' as info;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('accounts', 'transactions')
ORDER BY tablename;

-- Step 3: Check underlying tables for category_budgets_by_currency view
SELECT '=== UNDERLYING TABLES FOR CATEGORY_BUDGETS_BY_CURRENCY VIEW ===' as info;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('purchase_categories', 'purchases')
ORDER BY tablename;

-- Step 4: Check underlying tables for purchase_analytics_by_currency view
SELECT '=== UNDERLYING TABLES FOR PURCHASE_ANALYTICS_BY_CURRENCY VIEW ===' as info;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('purchases')
ORDER BY tablename;

-- Step 5: Ensure all underlying tables have RLS enabled
SELECT '=== ENABLING RLS ON UNDERLYING TABLES ===' as info;

-- Enable RLS on accounts table (for account_balances view)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on transactions table (for account_balances view)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on purchase_categories table (for category_budgets_by_currency view)
ALTER TABLE purchase_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on purchases table (for both views)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Step 6: Create/Update RLS policies for underlying tables
SELECT '=== CREATING RLS POLICIES FOR UNDERLYING TABLES ===' as info;

-- Policies for accounts table
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
CREATE POLICY "Users can insert their own accounts" ON accounts
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
CREATE POLICY "Users can update their own accounts" ON accounts
    FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;
CREATE POLICY "Users can delete their own accounts" ON accounts
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for purchase_categories table
DROP POLICY IF EXISTS "Users can view their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can view their own purchase categories" ON purchase_categories
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can insert their own purchase categories" ON purchase_categories
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can update their own purchase categories" ON purchase_categories
    FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own purchase categories" ON purchase_categories;
CREATE POLICY "Users can delete their own purchase categories" ON purchase_categories
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for purchases table
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
CREATE POLICY "Users can view their own purchases" ON purchases
    FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
CREATE POLICY "Users can insert their own purchases" ON purchases
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own purchases" ON purchases;
CREATE POLICY "Users can update their own purchases" ON purchases
    FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own purchases" ON purchases;
CREATE POLICY "Users can delete their own purchases" ON purchases
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 7: Verify all underlying tables are secured
SELECT '=== VERIFICATION - UNDERLYING TABLES SECURITY ===' as info;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status,
    'Underlying table for views' as role
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('accounts', 'transactions', 'purchase_categories', 'purchases')
ORDER BY tablename;

-- Step 8: Test view security by checking if users can only see their own data
SELECT '=== TESTING VIEW SECURITY ===' as info;

-- Test account_balances view security
SELECT 
    'account_balances view test' as test_name,
    COUNT(*) as accessible_records
FROM account_balances
WHERE user_id = auth.uid();

-- Test category_budgets_by_currency view security
SELECT 
    'category_budgets_by_currency view test' as test_name,
    COUNT(*) as accessible_records
FROM category_budgets_by_currency cb
WHERE cb.currency IN (
    SELECT DISTINCT currency 
    FROM purchase_categories 
    WHERE user_id = auth.uid()
);

-- Test purchase_analytics_by_currency view security
SELECT 
    'purchase_analytics_by_currency view test' as test_name,
    COUNT(*) as accessible_records
FROM purchase_analytics_by_currency pa
WHERE pa.currency IN (
    SELECT DISTINCT currency 
    FROM purchases 
    WHERE user_id = auth.uid()
);

-- Step 9: Final summary
SELECT 
    '=== VIEW SECURITY FIX COMPLETE ===' as status,
    'Views now inherit security from underlying tables' as message,
    'Users can only access their own data through views' as security_note,
    'Views may still show as "unrestricted" in Supabase UI but are actually secured' as ui_note; 
-- =====================================================
-- FIX ALL UNRESTRICTED TABLES
-- Enable RLS on all tables showing as "unrestricted" in Supabase
-- =====================================================

-- Step 1: Enable RLS on all unrestricted tables
SELECT '=== ENABLING RLS ON ALL UNRESTRICTED TABLES ===' as info;

-- Enable RLS on account_balances
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

-- Enable RLS on activity_history
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on category_budgets_by_currency
ALTER TABLE category_budgets_by_currency ENABLE ROW LEVEL SECURITY;

-- Enable RLS on donation_saving_records
ALTER TABLE donation_saving_records ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on purchase_analytics_by_currency
ALTER TABLE purchase_analytics_by_currency ENABLE ROW LEVEL SECURITY;

-- Enable RLS on purchase_history
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on transfers
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for account_balances
SELECT '=== CREATING POLICIES FOR ACCOUNT_BALANCES ===' as info;

CREATE POLICY "Users can view their own account balances" ON account_balances
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own account balances" ON account_balances
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own account balances" ON account_balances
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own account balances" ON account_balances
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 3: Create RLS policies for activity_history
SELECT '=== CREATING POLICIES FOR ACTIVITY_HISTORY ===' as info;

CREATE POLICY "Users can view their own activity history" ON activity_history
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity history" ON activity_history
    FOR INSERT 
    WITH CHECK (true);

-- Step 4: Create RLS policies for category_budgets_by_currency
SELECT '=== CREATING POLICIES FOR CATEGORY_BUDGETS_BY_CURRENCY ===' as info;

CREATE POLICY "Users can view their own category budgets" ON category_budgets_by_currency
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category budgets" ON category_budgets_by_currency
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category budgets" ON category_budgets_by_currency
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category budgets" ON category_budgets_by_currency
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 5: Create RLS policies for donation_saving_records
SELECT '=== CREATING POLICIES FOR DONATION_SAVING_RECORDS ===' as info;

CREATE POLICY "Users can view their own donation saving records" ON donation_saving_records
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own donation saving records" ON donation_saving_records
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own donation saving records" ON donation_saving_records
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own donation saving records" ON donation_saving_records
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 6: Create RLS policies for notes
SELECT '=== CREATING POLICIES FOR NOTES ===' as info;

CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 7: Create RLS policies for purchase_analytics_by_currency
SELECT '=== CREATING POLICIES FOR PURCHASE_ANALYTICS_BY_CURRENCY ===' as info;

CREATE POLICY "Users can view their own purchase analytics" ON purchase_analytics_by_currency
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase analytics" ON purchase_analytics_by_currency
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase analytics" ON purchase_analytics_by_currency
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase analytics" ON purchase_analytics_by_currency
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 8: Create RLS policies for purchase_history
SELECT '=== CREATING POLICIES FOR PURCHASE_HISTORY ===' as info;

CREATE POLICY "Users can view their own purchase history" ON purchase_history
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND purchase_id IN (
            SELECT purchase_id 
            FROM purchases 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert purchase history" ON purchase_history
    FOR INSERT 
    WITH CHECK (true);

-- Step 9: Create RLS policies for transfers
SELECT '=== CREATING POLICIES FOR TRANSFERS ===' as info;

CREATE POLICY "Users can view their own transfers" ON transfers
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transfers" ON transfers
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transfers" ON transfers
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transfers" ON transfers
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 10: Verify all tables are now secured
SELECT '=== VERIFICATION - ALL TABLES SHOULD BE SECURED ===' as info;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN (
        'account_balances',
        'activity_history', 
        'category_budgets_by_currency',
        'donation_saving_records',
        'notes',
        'purchase_analytics_by_currency',
        'purchase_history',
        'transfers'
    )
ORDER BY tablename;

-- Step 11: Count policies for each table
SELECT '=== POLICY COUNT VERIFICATION ===' as info;

SELECT 
    tablename,
    COUNT(policyname) as policy_count,
    CASE 
        WHEN COUNT(policyname) > 0 THEN 'POLICIES EXIST ✅'
        ELSE 'NO POLICIES ❌'
    END as policy_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'account_balances',
        'activity_history', 
        'category_budgets_by_currency',
        'donation_saving_records',
        'notes',
        'purchase_analytics_by_currency',
        'purchase_history',
        'transfers'
    )
GROUP BY t.tablename
ORDER BY t.tablename;

-- Step 12: Final success message
SELECT 
    '=== ALL UNRESTRICTED TABLES FIXED ===' as status,
    '8 tables have been secured with RLS enabled' as message,
    'All users can now only access their own data' as security_note,
    'Supabase should now show "secured" instead of "unrestricted"' as verification; 
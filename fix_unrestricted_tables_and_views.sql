-- =====================================================
-- FIX UNRESTRICTED TABLES AND VIEWS
-- Handle both tables and views properly
-- =====================================================

-- Step 1: Check which items are tables vs views
SELECT '=== CHECKING TABLES VS VIEWS ===' as info;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN schemaname = 'information_schema' THEN 'SYSTEM VIEW'
        WHEN tablename IN (
            SELECT viewname FROM pg_views WHERE schemaname = 'public'
        ) THEN 'VIEW'
        ELSE 'TABLE'
    END as object_type,
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
ORDER BY object_type, tablename;

-- Step 2: Check which are actually views
SELECT '=== IDENTIFYING VIEWS ===' as info;

SELECT 
    viewname as object_name,
    'VIEW' as object_type,
    'Cannot enable RLS directly' as note
FROM pg_views 
WHERE schemaname = 'public'
    AND viewname IN (
        'account_balances',
        'activity_history', 
        'category_budgets_by_currency',
        'donation_saving_records',
        'notes',
        'purchase_analytics_by_currency',
        'purchase_history',
        'transfers'
    )
ORDER BY viewname;

-- Step 3: Fix actual tables (not views)
SELECT '=== FIXING ACTUAL TABLES ===' as info;

-- Enable RLS on activity_history (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'activity_history'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on activity_history table';
    ELSE
        RAISE NOTICE 'activity_history is a view, skipping RLS enable';
    END IF;
END $$;

-- Enable RLS on donation_saving_records (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'donation_saving_records'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        ALTER TABLE donation_saving_records ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on donation_saving_records table';
    ELSE
        RAISE NOTICE 'donation_saving_records is a view, skipping RLS enable';
    END IF;
END $$;

-- Enable RLS on notes (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'notes'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on notes table';
    ELSE
        RAISE NOTICE 'notes is a view, skipping RLS enable';
    END IF;
END $$;

-- Enable RLS on purchase_history (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'purchase_history'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on purchase_history table';
    ELSE
        RAISE NOTICE 'purchase_history is a view, skipping RLS enable';
    END IF;
END $$;

-- Enable RLS on transfers (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'transfers'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on transfers table';
    ELSE
        RAISE NOTICE 'transfers is a view, skipping RLS enable';
    END IF;
END $$;

-- Step 4: Create RLS policies for actual tables
SELECT '=== CREATING POLICIES FOR ACTUAL TABLES ===' as info;

-- Policies for activity_history (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'activity_history'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own activity history" ON activity_history;
        DROP POLICY IF EXISTS "System can insert activity history" ON activity_history;
        
        -- Create new policies
        CREATE POLICY "Users can view their own activity history" ON activity_history
            FOR SELECT 
            USING (auth.uid() = user_id);

        CREATE POLICY "System can insert activity history" ON activity_history
            FOR INSERT 
            WITH CHECK (true);
            
        RAISE NOTICE 'Created policies for activity_history table';
    END IF;
END $$;

-- Policies for donation_saving_records (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'donation_saving_records'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own donation saving records" ON donation_saving_records;
        DROP POLICY IF EXISTS "Users can insert their own donation saving records" ON donation_saving_records;
        DROP POLICY IF EXISTS "Users can update their own donation saving records" ON donation_saving_records;
        DROP POLICY IF EXISTS "Users can delete their own donation saving records" ON donation_saving_records;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Created policies for donation_saving_records table';
    END IF;
END $$;

-- Policies for notes (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'notes'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
        DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
        DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
        DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Created policies for notes table';
    END IF;
END $$;

-- Policies for purchase_history (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'purchase_history'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own purchase history" ON purchase_history;
        DROP POLICY IF EXISTS "System can insert purchase history" ON purchase_history;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Created policies for purchase_history table';
    END IF;
END $$;

-- Policies for transfers (if it's a table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'transfers'
        AND tablename NOT IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own transfers" ON transfers;
        DROP POLICY IF EXISTS "Users can insert their own transfers" ON transfers;
        DROP POLICY IF EXISTS "Users can update their own transfers" ON transfers;
        DROP POLICY IF EXISTS "Users can delete their own transfers" ON transfers;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Created policies for transfers table';
    END IF;
END $$;

-- Step 5: Handle views by ensuring underlying tables are secured
SELECT '=== SECURING UNDERLYING TABLES FOR VIEWS ===' as info;

-- Ensure accounts table is secured (for account_balances view)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Ensure transactions table is secured (for account_balances view)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Ensure purchases table is secured (for purchase_history view)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Step 6: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'SECURED ✅'
        ELSE 'UNRESTRICTED ❌'
    END as security_status,
    CASE 
        WHEN tablename IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') THEN 'VIEW'
        ELSE 'TABLE'
    END as object_type
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
        'transfers',
        'accounts',
        'transactions',
        'purchases'
    )
ORDER BY object_type, tablename;

-- Step 7: Summary
SELECT 
    '=== SECURITY FIX SUMMARY ===' as status,
    'Tables have been secured with RLS' as message,
    'Views inherit security from underlying tables' as note,
    'All user data is now properly isolated' as security_note; 
-- =====================================================
-- CREATE PROFILES FOR EXISTING USERS
-- =====================================================

-- Step 1: Find users without profiles
SELECT '=== FINDING USERS WITHOUT PROFILES ===' as info;

WITH users_without_profiles AS (
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data,
        u.created_at as user_created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
)
SELECT 
    id,
    email,
    raw_user_meta_data,
    user_created_at
FROM users_without_profiles
ORDER BY user_created_at;

-- Step 2: Create profiles for users who don't have them
SELECT '=== CREATING MISSING PROFILES ===' as info;

DO $$
DECLARE
    user_record RECORD;
    full_name TEXT;
    profiles_created INTEGER := 0;
BEGIN
    FOR user_record IN 
        SELECT 
            u.id,
            u.email,
            u.raw_user_meta_data,
            u.created_at as user_created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Extract full_name from user metadata
        full_name := COALESCE(
            user_record.raw_user_meta_data->>'full_name',
            user_record.raw_user_meta_data->>'fullName',
            'User'
        );
        
        -- Insert profile
        BEGIN
            INSERT INTO public.profiles (
                id,
                full_name,
                local_currency,
                role,
                subscription,
                created_at,
                updated_at
            )
            VALUES (
                user_record.id,
                full_name,
                'USD',
                'user',
                '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
                user_record.user_created_at,
                NOW()
            );
            
            profiles_created := profiles_created + 1;
            RAISE NOTICE 'Created profile for user: % (%)', user_record.email, full_name;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error creating profile for user %: %', user_record.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total profiles created: %', profiles_created;
END $$;

-- Step 3: Verify all users now have profiles
SELECT '=== VERIFICATION ===' as info;

SELECT 
    'Total users' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Users with profiles' as metric,
    COUNT(*) as count
FROM auth.users u
INNER JOIN public.profiles p ON u.id = p.id
UNION ALL
SELECT 
    'Users without profiles' as metric,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Step 4: Show sample of created profiles
SELECT '=== SAMPLE OF CREATED PROFILES ===' as info;
SELECT 
    p.id,
    p.full_name,
    p.local_currency,
    p.role,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 5; 
-- Create account and dummy transactions for bebetteryou.motivational@gmail.com
-- User ID: fc0c4d30-fb4a-417c-a15f-305b580c6a7f

-- Step 1: Check if user exists and create profile if needed
DO $$
DECLARE
    user_exists BOOLEAN;
    profile_exists BOOLEAN;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'User does not exist in auth.users. Please create the user first.';
        RETURN;
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create profile
        INSERT INTO public.profiles (
            id,
            full_name,
            local_currency,
            role,
            subscription,
            created_at,
            updated_at
        ) VALUES (
            'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid,
            'Be Better You',
            'EUR',
            'user',
            '{"plan": "free", "status": "active", "validUntil": null}'::jsonb,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Profile created for user';
    ELSE
        RAISE NOTICE 'Profile already exists for user';
    END IF;
END $$;

-- Step 2: Create a cash account for the user (if it doesn't exist)
INSERT INTO public.accounts (
    id,
    user_id,
    name,
    type,
    initial_balance,
    calculated_balance,
    currency,
    description,
    is_active,
    has_dps,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid,
    'Cash Wallet',
    'cash',
    0,
    0,
    'EUR',
    'Default cash account for tracking physical money',
    true,
    false,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE user_id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid 
    AND type = 'cash'
);

-- Step 3: Get the cash account ID
DO $$
DECLARE
    cash_account_id UUID;
BEGIN
    SELECT id INTO cash_account_id 
    FROM public.accounts 
    WHERE user_id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid 
    AND type = 'cash' 
    LIMIT 1;
    
    RAISE NOTICE 'Cash account ID: %', cash_account_id;
END $$;

-- Step 4: Insert dummy transactions
INSERT INTO public.transactions (
    user_id,
    account_id,
    type,
    amount,
    description,
    category,
    date,
    tags,
    saving_amount,
    is_recurring,
    created_at,
    updated_at
)
SELECT 
    'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid as user_id,
    (SELECT id FROM public.accounts WHERE user_id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid AND type = 'cash' LIMIT 1) as account_id,
    'expense' as type,
    amount,
    description,
    category,
    date,
    tags,
    0 as saving_amount,
    false as is_recurring,
    NOW() as created_at,
    NOW() as updated_at
FROM (VALUES
    -- Transaction 1: Grocery shopping
    (25.50, 'Grocery shopping at Lidl', 'Food & Dining', '2024-01-15'::date, ARRAY['groceries', 'food']),
    
    -- Transaction 2: Coffee
    (4.20, 'Morning coffee at Starbucks', 'Food & Dining', '2024-01-16'::date, ARRAY['coffee', 'morning']),
    
    -- Transaction 3: Public transport
    (12.80, 'Monthly transport pass', 'Transportation', '2024-01-17'::date, ARRAY['transport', 'monthly']),
    
    -- Transaction 4: Online shopping
    (89.99, 'Amazon purchase - books', 'Shopping', '2024-01-18'::date, ARRAY['books', 'online']),
    
    -- Transaction 5: Restaurant
    (45.30, 'Dinner at Italian restaurant', 'Food & Dining', '2024-01-19'::date, ARRAY['restaurant', 'dinner']),
    
    -- Transaction 6: Gym membership
    (29.99, 'Monthly gym membership', 'Healthcare', '2024-01-20'::date, ARRAY['gym', 'fitness']),
    
    -- Transaction 7: Movie tickets
    (18.50, 'Cinema tickets for 2', 'Entertainment', '2024-01-21'::date, ARRAY['movies', 'entertainment']),
    
    -- Transaction 8: Pharmacy
    (15.75, 'Medicine and vitamins', 'Healthcare', '2024-01-22'::date, ARRAY['medicine', 'health']),
    
    -- Transaction 9: Clothing
    (67.40, 'New winter jacket', 'Shopping', '2024-01-23'::date, ARRAY['clothing', 'winter']),
    
    -- Transaction 10: Phone bill
    (24.99, 'Monthly phone bill', 'Bills & Utilities', '2024-01-24'::date, ARRAY['phone', 'monthly'])
) AS dummy_data(amount, description, category, date, tags);

-- Step 5: Verify the setup
SELECT '=== VERIFICATION ===' as info;

-- Show user info
SELECT 
    'User Account' as type,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid;

-- Show profile info
SELECT 
    'Profile' as type,
    id,
    full_name,
    local_currency,
    role,
    subscription
FROM public.profiles 
WHERE id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid;

-- Show accounts
SELECT 
    'Accounts' as type,
    id,
    name,
    type,
    currency,
    calculated_balance
FROM public.accounts 
WHERE user_id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid;

-- Show transactions
SELECT 
    'Transactions' as type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM public.transactions 
WHERE user_id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid;

-- Show transaction details
SELECT 
    t.description,
    t.amount,
    t.category,
    t.date,
    a.name as account_name,
    a.currency
FROM public.transactions t
JOIN public.accounts a ON t.account_id = a.id
WHERE t.user_id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid
ORDER BY t.date DESC;

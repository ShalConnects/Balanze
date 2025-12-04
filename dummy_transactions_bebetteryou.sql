-- Dummy Transactions for bebetteryou.motivational@gmail.com
-- User ID: fc0c4d30-fb4a-417c-a15f-305b580c6a7f
-- Currency: EUR (as requested)
-- Using default cash account and default categories

-- First, let's find the user's cash account ID
-- We'll use a subquery to get the cash account ID for this user

-- Insert dummy transactions (5-10 transactions as requested)
INSERT INTO transactions (
    user_id,
    account_id,
    type,
    amount,
    description,
    category,
    date,
    tags,
    saving_amount,
    note,
    is_recurring,
    recurring_frequency,
    created_at,
    updated_at
)
SELECT 
    'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid as user_id,
    (SELECT id FROM accounts WHERE user_id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid AND type = 'cash' LIMIT 1) as account_id,
    'expense' as type,
    amount,
    description,
    category,
    date,
    tags,
    0 as saving_amount,
    note,
    false as is_recurring,
    null as recurring_frequency,
    NOW() as created_at,
    NOW() as updated_at
FROM (VALUES
    -- Transaction 1: Grocery shopping
    (25.50, 'Grocery shopping at Lidl', 'Food & Dining', '2024-01-15'::date, ARRAY['groceries', 'food'], 'Weekly grocery shopping'),
    
    -- Transaction 2: Coffee
    (4.20, 'Morning coffee at Starbucks', 'Food & Dining', '2024-01-16'::date, ARRAY['coffee', 'morning'], 'Daily coffee habit'),
    
    -- Transaction 3: Public transport
    (12.80, 'Monthly transport pass', 'Transportation', '2024-01-17'::date, ARRAY['transport', 'monthly'], 'Monthly public transport subscription'),
    
    -- Transaction 4: Online shopping
    (89.99, 'Amazon purchase - books', 'Shopping', '2024-01-18'::date, ARRAY['books', 'online'], 'Educational books purchase'),
    
    -- Transaction 5: Restaurant
    (45.30, 'Dinner at Italian restaurant', 'Food & Dining', '2024-01-19'::date, ARRAY['restaurant', 'dinner'], 'Weekend dinner out'),
    
    -- Transaction 6: Gym membership
    (29.99, 'Monthly gym membership', 'Healthcare', '2024-01-20'::date, ARRAY['gym', 'fitness'], 'Monthly fitness subscription'),
    
    -- Transaction 7: Movie tickets
    (18.50, 'Cinema tickets for 2', 'Entertainment', '2024-01-21'::date, ARRAY['movies', 'entertainment'], 'Weekend movie night'),
    
    -- Transaction 8: Pharmacy
    (15.75, 'Medicine and vitamins', 'Healthcare', '2024-01-22'::date, ARRAY['medicine', 'health'], 'Essential health items'),
    
    -- Transaction 9: Clothing
    (67.40, 'New winter jacket', 'Shopping', '2024-01-23'::date, ARRAY['clothing', 'winter'], 'Seasonal clothing purchase'),
    
    -- Transaction 10: Phone bill
    (24.99, 'Monthly phone bill', 'Bills & Utilities', '2024-01-24'::date, ARRAY['phone', 'monthly'], 'Monthly mobile phone subscription')
) AS dummy_data(amount, description, category, date, tags, note);

-- Verify the transactions were inserted
SELECT 
    t.id,
    t.description,
    t.amount,
    t.category,
    t.date,
    a.name as account_name,
    a.currency
FROM transactions t
JOIN accounts a ON t.account_id = a.id
WHERE t.user_id = 'fc0c4d30-fb4a-417c-a15f-305b580c6a7f'::uuid
ORDER BY t.date DESC;

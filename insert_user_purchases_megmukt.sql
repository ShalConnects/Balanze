-- =====================================================
-- INSERT USER PURCHASES FOR megmukt@gmail.com
-- Convert USD to BDT using ~110 BDT = 1 USD
-- =====================================================

DO $$
DECLARE
    user_id_found UUID;
    user_email TEXT := 'megmukt@gmail.com';
BEGIN
    -- Get the user ID from email
    SELECT id INTO user_id_found 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id_found IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: % for email: %', user_id_found, user_email;
    
    -- Insert user purchases
    INSERT INTO purchases (
        user_id,
        item_name,
        category,
        price,
        purchase_date,
        status,
        priority,
        notes,
        currency
    ) VALUES 
    -- User's actual purchases
    (user_id_found, 'adfad', 'adfa', 1200.00, '2025-10-14 00:00:00+00', 'purchased', 'medium', 'User purchase', 'BDT'),
    (user_id_found, 'dfad', 'Food & Dining', 1320.00, '2025-09-27 00:00:00+00', 'purchased', 'medium', 'User purchase', 'BDT'),
    (user_id_found, 'adfasd', 'Subscriptions', 3630.00, '2025-09-27 00:00:00+00', 'purchased', 'medium', 'User purchase', 'BDT'),
    (user_id_found, 'Bro', 'Subscriptions', 2420.00, '2025-09-27 00:00:00+00', 'purchased', 'medium', 'User purchase', 'BDT'),
    (user_id_found, 'Ghana', 'Shopping', 54999.00, '2025-09-24 00:00:00+00', 'purchased', 'medium', 'User purchase', 'BDT'),
    
    -- Planned purchases (already in BDT)
    (user_id_found, 'Home Renovation', 'Home', 550000.00, '2024-08-01 00:00:00+00', 'planned', 'high', 'Kitchen renovation', 'BDT'),
    (user_id_found, 'New Laptop', 'Electronics', 175999.00, '2024-07-01 00:00:00+00', 'planned', 'high', 'Gaming laptop upgrade', 'BDT'),
    (user_id_found, 'Summer Vacation', 'Travel', 275000.00, '2024-06-15 00:00:00+00', 'planned', 'high', 'Family vacation to Europe', 'BDT'),
    (user_id_found, 'Wedding Gift', 'Gifts', 22000.00, '2024-05-20 00:00:00+00', 'planned', 'medium', 'Friend''s wedding gift', 'BDT'),
    (user_id_found, 'Car Maintenance', 'Transportation', 33000.00, '2024-04-15 00:00:00+00', 'planned', 'medium', 'Regular car service', 'BDT');
    
    RAISE NOTICE 'Successfully created 10 user purchases for: %', user_email;
    
END $$;

-- Verification: Check the created purchases
SELECT 
    'VERIFICATION' as status,
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN status = 'purchased' THEN 1 END) as purchased_count,
    COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
    SUM(price) as total_value,
    MIN(purchase_date) as earliest_purchase,
    MAX(purchase_date) as latest_purchase
FROM purchases p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com';

-- Show sample of created purchases
SELECT 
    item_name,
    category,
    price,
    currency,
    status,
    priority,
    purchase_date
FROM purchases p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com'
ORDER BY purchase_date DESC
LIMIT 10;

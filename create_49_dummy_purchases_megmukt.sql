-- =====================================================
-- CREATE 49 DUMMY PURCHASES FOR megmukt@gmail.com
-- =====================================================

-- Step 1: Find user ID by email
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
    
    -- Insert 30 dummy purchases (prices converted to BDT - using ~110 BDT = 1 USD)
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
    -- Electronics & Technology
    (user_id_found, 'iPhone 15 Pro', 'Electronics', 109999.00, '2024-01-15 10:30:00+00', 'purchased', 'high', 'Latest iPhone model', 'BDT'),
    (user_id_found, 'MacBook Air M3', 'Electronics', 142890.00, '2024-01-20 14:15:00+00', 'purchased', 'high', 'For work and personal use', 'BDT'),
    (user_id_found, 'Sony WH-1000XM5 Headphones', 'Electronics', 43999.00, '2024-02-03 09:45:00+00', 'purchased', 'medium', 'Noise-cancelling headphones', 'BDT'),
    
    -- Clothing & Fashion
    (user_id_found, 'Nike Air Max 270', 'Clothing', 16500.00, '2024-01-25 13:45:00+00', 'purchased', 'medium', 'Running shoes', 'BDT'),
    (user_id_found, 'Levi''s 501 Jeans', 'Clothing', 9899.00, '2024-02-05 15:20:00+00', 'purchased', 'low', 'Classic blue jeans', 'BDT'),
    
    -- Food & Groceries
    (user_id_found, 'Whole Foods Grocery Shopping', 'Food', 17246.00, '2024-01-16 18:45:00+00', 'purchased', 'high', 'Weekly grocery shopping', 'BDT'),
    (user_id_found, 'Starbucks Coffee', 'Food', 600.00, '2024-01-17 08:30:00+00', 'purchased', 'low', 'Morning coffee', 'BDT'),
    (user_id_found, 'Sushi Restaurant Dinner', 'Food', 9845.00, '2024-02-01 20:15:00+00', 'purchased', 'medium', 'Date night dinner', 'BDT'),
    
    -- Home & Garden
    (user_id_found, 'IKEA Bookshelf', 'Home', 8799.00, '2024-01-18 16:30:00+00', 'purchased', 'medium', 'Storage solution', 'BDT'),
    (user_id_found, 'Kitchen Knife Set', 'Home', 14299.00, '2024-02-14 15:45:00+00', 'purchased', 'medium', 'Professional knife set', 'BDT'),
    
    -- Transportation
    (user_id_found, 'Uber Ride to Airport', 'Transportation', 5016.00, '2024-01-19 06:30:00+00', 'purchased', 'high', 'Airport transfer', 'BDT'),
    (user_id_found, 'Metro Monthly Pass', 'Transportation', 10450.00, '2024-02-01 09:00:00+00', 'purchased', 'high', 'Public transportation', 'BDT'),
    
    -- Entertainment
    (user_id_found, 'Netflix Subscription', 'Entertainment', 1759.00, '2024-01-15 00:00:00+00', 'purchased', 'low', 'Monthly subscription', 'BDT'),
    (user_id_found, 'Concert Tickets', 'Entertainment', 13750.00, '2024-02-11 20:00:00+00', 'purchased', 'high', 'Favorite band concert', 'BDT'),
    
    -- Health & Fitness
    (user_id_found, 'Gym Membership', 'Health', 5499.00, '2024-01-15 00:00:00+00', 'purchased', 'high', 'Monthly gym membership', 'BDT'),
    (user_id_found, 'Massage Therapy', 'Health', 9350.00, '2024-02-21 15:00:00+00', 'purchased', 'high', 'Stress relief massage', 'BDT'),
    
    -- Books & Education
    (user_id_found, 'Online Course', 'Education', 21999.00, '2024-02-02 09:30:00+00', 'purchased', 'high', 'Professional development', 'BDT'),
    (user_id_found, 'Programming Book', 'Education', 5499.00, '2024-01-22 12:20:00+00', 'purchased', 'medium', 'Learning new technology', 'BDT'),
    
    -- Beauty & Personal Care
    (user_id_found, 'Skincare Set', 'Beauty', 9899.00, '2024-01-23 15:30:00+00', 'purchased', 'medium', 'Daily skincare routine', 'BDT'),
    (user_id_found, 'Haircut & Styling', 'Beauty', 7150.00, '2024-02-04 14:00:00+00', 'purchased', 'medium', 'Professional haircut', 'BDT'),
    
    -- Miscellaneous
    (user_id_found, 'Phone Case', 'Accessories', 2199.00, '2024-01-27 11:45:00+00', 'purchased', 'low', 'Protective case', 'BDT'),
    (user_id_found, 'Gift Card', 'Gifts', 5500.00, '2024-02-05 18:30:00+00', 'purchased', 'medium', 'Birthday gift', 'BDT'),
    (user_id_found, 'Office Supplies', 'Work', 7420.00, '2024-02-12 09:15:00+00', 'purchased', 'medium', 'Home office setup', 'BDT'),
    (user_id_found, 'Travel Adapter', 'Travel', 2749.00, '2024-02-18 12:45:00+00', 'purchased', 'high', 'International travel', 'BDT'),
    (user_id_found, 'Emergency Kit', 'Safety', 5059.00, '2024-02-26 14:20:00+00', 'purchased', 'medium', 'Car emergency supplies', 'BDT'),
    
    -- Planned Purchases (Future)
    (user_id_found, 'Summer Vacation', 'Travel', 275000.00, '2024-06-15 00:00:00+00', 'planned', 'high', 'Family vacation to Europe', 'BDT'),
    (user_id_found, 'New Laptop', 'Electronics', 175999.00, '2024-07-01 00:00:00+00', 'planned', 'high', 'Gaming laptop upgrade', 'BDT'),
    (user_id_found, 'Wedding Gift', 'Gifts', 22000.00, '2024-05-20 00:00:00+00', 'planned', 'medium', 'Friend''s wedding gift', 'BDT'),
    (user_id_found, 'Home Renovation', 'Home', 550000.00, '2024-08-01 00:00:00+00', 'planned', 'high', 'Kitchen renovation', 'BDT'),
    (user_id_found, 'Car Maintenance', 'Transportation', 33000.00, '2024-04-15 00:00:00+00', 'planned', 'medium', 'Regular car service', 'BDT');
    
    RAISE NOTICE 'Successfully created 30 dummy purchases for user: %', user_email;
    
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

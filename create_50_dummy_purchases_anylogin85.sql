-- =====================================================
-- CREATE 50 DUMMY PURCHASES FOR anylogin85@gmail.com
-- User ID: 0d497c5c-3242-425e-aa73-1081385f46e5 (validated by email lookup)
-- Currency: JPY
-- Date Range: October 2025
-- =====================================================

DO $$
DECLARE
    user_id_found UUID;
    user_email TEXT := 'anylogin85@gmail.com';
BEGIN
    -- Get the user ID from email
    SELECT id INTO user_id_found 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id_found IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: % for email: %', user_id_found, user_email;

    -- Insert 50 dummy purchases (JPY) across October 2025
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
    -- Week 1
    (user_id_found, 'Uniqlo Jacket', 'Clothing', 8990.00, '2025-10-01 10:15:00+00', 'purchased', 'medium', 'Lightweight fall jacket', 'JPY'),
    (user_id_found, 'Suica Top-up', 'Transportation', 5000.00, '2025-10-01 08:05:00+00', 'purchased', 'high', 'Commute balance refill', 'JPY'),
    (user_id_found, 'Muji Notebook Set', 'Work', 1290.00, '2025-10-02 12:40:00+00', 'purchased', 'low', 'A5 dotted notebooks', 'JPY'),
    (user_id_found, 'Sushi Lunch', 'Food', 1800.00, '2025-10-02 13:10:00+00', 'purchased', 'low', 'Lunch special', 'JPY'),
    (user_id_found, 'Nintendo eShop Card', 'Entertainment', 5000.00, '2025-10-03 20:30:00+00', 'purchased', 'low', 'Weekend gaming', 'JPY'),
    (user_id_found, '7-Eleven Groceries', 'Food', 3200.00, '2025-10-03 18:10:00+00', 'purchased', 'medium', 'Snacks and essentials', 'JPY'),
    (user_id_found, 'AirPods Pro Tips', 'Accessories', 2980.00, '2025-10-04 11:20:00+00', 'purchased', 'low', 'Replacement ear tips', 'JPY'),
    (user_id_found, 'JR Day Pass', 'Transportation', 2200.00, '2025-10-04 09:00:00+00', 'purchased', 'medium', 'Weekend travel', 'JPY'),
    (user_id_found, 'Netflix', 'Subscriptions', 990.00, '2025-10-05 00:00:00+00', 'purchased', 'medium', 'Monthly subscription', 'JPY'),
    (user_id_found, 'Pharmacy Vitamins', 'Health', 2400.00, '2025-10-05 16:45:00+00', 'purchased', 'medium', 'Daily supplements', 'JPY'),

    -- Week 2
    (user_id_found, 'Zojirushi Thermos', 'Home', 3980.00, '2025-10-06 09:35:00+00', 'purchased', 'low', 'Travel mug', 'JPY'),
    (user_id_found, 'Ramen Dinner', 'Food', 1400.00, '2025-10-06 19:20:00+00', 'purchased', 'low', 'Tonkotsu ramen', 'JPY'),
    (user_id_found, 'Kindle eBook', 'Education', 1300.00, '2025-10-07 21:10:00+00', 'purchased', 'low', 'Tech book', 'JPY'),
    (user_id_found, 'Office Chair Cushion', 'Home', 2890.00, '2025-10-07 15:25:00+00', 'purchased', 'medium', 'Ergonomic support', 'JPY'),
    (user_id_found, 'Gym Day Pass', 'Health', 1000.00, '2025-10-08 07:50:00+00', 'purchased', 'low', 'Workout session', 'JPY'),
    (user_id_found, 'Apple Lightning Cable', 'Electronics', 2480.00, '2025-10-08 14:05:00+00', 'purchased', 'low', 'Charging cable', 'JPY'),
    (user_id_found, 'Uniqlo Socks (3 pack)', 'Clothing', 990.00, '2025-10-09 12:05:00+00', 'purchased', 'low', 'Basics', 'JPY'),
    (user_id_found, 'Karaoke Night', 'Entertainment', 2700.00, '2025-10-09 21:40:00+00', 'purchased', 'low', '2 hours with friends', 'JPY'),
    (user_id_found, 'Grocery Run', 'Food', 5600.00, '2025-10-10 17:35:00+00', 'purchased', 'medium', 'Weekly groceries', 'JPY'),
    (user_id_found, 'Taxi Fare', 'Transportation', 1800.00, '2025-10-10 23:10:00+00', 'purchased', 'low', 'Late-night ride', 'JPY'),

    -- Week 3
    (user_id_found, 'Book: Clean Architecture', 'Education', 3600.00, '2025-10-11 11:55:00+00', 'purchased', 'medium', 'Professional reading', 'JPY'),
    (user_id_found, 'Bluetooth Keyboard', 'Electronics', 5980.00, '2025-10-11 13:30:00+00', 'purchased', 'medium', 'Compact keyboard', 'JPY'),
    (user_id_found, 'Gift: Flowers', 'Gifts', 2500.00, '2025-10-12 10:10:00+00', 'purchased', 'low', 'Birthday gift', 'JPY'),
    (user_id_found, 'Curry Lunch', 'Food', 1200.00, '2025-10-12 13:05:00+00', 'purchased', 'low', 'Katsu curry', 'JPY'),
    (user_id_found, 'Desk Lamp', 'Home', 4200.00, '2025-10-13 18:25:00+00', 'purchased', 'medium', 'LED lamp', 'JPY'),
    (user_id_found, 'Phone Case', 'Accessories', 1990.00, '2025-10-13 19:10:00+00', 'purchased', 'low', 'Protective case', 'JPY'),
    (user_id_found, 'Shinkansen Ticket (Planned)', 'Travel', 14000.00, '2025-10-14 00:00:00+00', 'planned', 'high', 'Trip to Kyoto', 'JPY'),
    (user_id_found, 'Noise Cancelling Earplugs', 'Health', 1500.00, '2025-10-14 08:45:00+00', 'purchased', 'low', 'For focus', 'JPY'),
    (user_id_found, 'Tea Ceremony Class', 'Education', 4800.00, '2025-10-15 16:00:00+00', 'purchased', 'medium', 'Cultural learning', 'JPY'),
    (user_id_found, 'Reusable Tote Bag', 'Accessories', 790.00, '2025-10-15 18:35:00+00', 'purchased', 'low', 'Eco-friendly', 'JPY'),

    -- Week 4
    (user_id_found, 'Soba Dinner', 'Food', 1300.00, '2025-10-16 19:20:00+00', 'purchased', 'low', 'Handmade soba', 'JPY'),
    (user_id_found, 'Haircut', 'Beauty', 4200.00, '2025-10-16 11:10:00+00', 'purchased', 'medium', 'Salon cut', 'JPY'),
    (user_id_found, 'Running Shoes', 'Clothing', 10990.00, '2025-10-17 13:40:00+00', 'purchased', 'medium', 'Training shoes', 'JPY'),
    (user_id_found, 'Onsen Day Trip (Planned)', 'Travel', 6500.00, '2025-10-17 00:00:00+00', 'planned', 'medium', 'Weekend relaxation', 'JPY'),
    (user_id_found, 'Stationery Bundle', 'Work', 2100.00, '2025-10-18 10:05:00+00', 'purchased', 'low', 'Pens and markers', 'JPY'),
    (user_id_found, 'Portable SSD', 'Electronics', 11800.00, '2025-10-18 15:00:00+00', 'purchased', 'high', 'Backup drive', 'JPY'),
    (user_id_found, 'Museum Tickets', 'Entertainment', 2200.00, '2025-10-19 14:10:00+00', 'purchased', 'low', 'Art exhibit', 'JPY'),
    (user_id_found, 'Grocery Stock-up', 'Food', 7800.00, '2025-10-19 17:25:00+00', 'purchased', 'medium', 'Weekly stock', 'JPY'),
    (user_id_found, 'Umbrella', 'Accessories', 900.00, '2025-10-20 08:00:00+00', 'purchased', 'low', 'Compact umbrella', 'JPY'),
    (user_id_found, 'Massage Session', 'Health', 5500.00, '2025-10-20 18:50:00+00', 'purchased', 'medium', 'Stress relief', 'JPY'),

    -- Week 5 / Month-end
    (user_id_found, 'Hiking Backpack', 'Travel', 9800.00, '2025-10-21 09:45:00+00', 'purchased', 'medium', 'Daypack', 'JPY'),
    (user_id_found, 'Graphic T-Shirt', 'Clothing', 2990.00, '2025-10-22 12:20:00+00', 'purchased', 'low', 'Casual wear', 'JPY'),
    (user_id_found, 'Cookware Set', 'Home', 12800.00, '2025-10-23 16:10:00+00', 'purchased', 'high', 'Saucepan + skillet', 'JPY'),
    (user_id_found, 'Wireless Mouse', 'Electronics', 3980.00, '2025-10-24 11:35:00+00', 'purchased', 'low', 'Ergonomic mouse', 'JPY'),
    (user_id_found, 'Café Brunch', 'Food', 2200.00, '2025-10-25 10:55:00+00', 'purchased', 'low', 'Pancakes + coffee', 'JPY'),
    (user_id_found, 'Board Game Night', 'Entertainment', 3600.00, '2025-10-26 19:40:00+00', 'purchased', 'low', 'Party game', 'JPY'),
    (user_id_found, 'Wireless Charger', 'Electronics', 3200.00, '2025-10-27 13:15:00+00', 'purchased', 'low', 'Qi charger', 'JPY'),
    (user_id_found, 'Candles Set', 'Home', 1600.00, '2025-10-27 20:10:00+00', 'purchased', 'low', 'Scented candles', 'JPY'),
    (user_id_found, 'Business Book', 'Education', 2800.00, '2025-10-28 09:50:00+00', 'purchased', 'low', 'Leadership book', 'JPY'),
    (user_id_found, 'Winter Coat (Planned)', 'Clothing', 15990.00, '2025-10-29 00:00:00+00', 'planned', 'high', 'Prepare for winter', 'JPY');

    RAISE NOTICE 'Successfully created 50 dummy purchases for user: %', user_email;
END $$;

-- Verification: Check the created purchases
SELECT 
    'VERIFICATION' as status,
    COUNT(*) as total_purchases,
    COUNT(CASE WHEN status = 'purchased' THEN 1 END) as purchased_count,
    COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_count,
    SUM(price) as total_value,
    MIN(purchase_date) as earliest_purchase,
    MAX(purchase_date) as latest_purchase
FROM purchases p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'anylogin85@gmail.com';

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
WHERE u.email = 'anylogin85@gmail.com'
ORDER BY purchase_date DESC
LIMIT 10;



-- =====================================================
-- GET USER ID FOR PAYMENT DATA SETUP
-- Run this SQL to get your user ID for setting up payment data
-- =====================================================

-- Get all users (for admin setup)
SELECT 
    id, 
    email, 
    created_at,
    'Use this ID in setup_payment_data.sql' as instruction
FROM auth.users 
ORDER BY created_at DESC;

-- Get specific user by email (replace with your email)
-- SELECT 
--     id, 
--     email, 
--     created_at
-- FROM auth.users 
-- WHERE email = 'your-email@example.com';

-- =====================================================
-- QUICK SETUP INSTRUCTIONS
-- =====================================================
/*
1. Run this query to get your user ID
2. Copy the user ID from the result
3. Open setup_payment_data.sql
4. Replace all instances of 'your-user-id-here' with your actual user ID
5. Run the setup_payment_data.sql script
6. Your payment history will now show real data!
*/

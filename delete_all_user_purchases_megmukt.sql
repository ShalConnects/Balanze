-- =====================================================
-- DELETE ALL PURCHASES FOR megmukt@gmail.com
-- WARNING: This will permanently delete ALL purchases for this user
-- =====================================================

DO $$
DECLARE
    user_id_found UUID;
    user_email TEXT := 'megmukt@gmail.com';
    deleted_count INTEGER;
BEGIN
    -- Get the user ID from email
    SELECT id INTO user_id_found 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id_found IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    RAISE NOTICE 'Found user ID: % for email: %', user_id_found, user_email;
    
    -- Count purchases before deletion
    SELECT COUNT(*) INTO deleted_count FROM purchases WHERE user_id = user_id_found;
    RAISE NOTICE 'Found % purchases to delete', deleted_count;
    
    -- Delete all purchases for this user
    DELETE FROM purchases WHERE user_id = user_id_found;
    
    -- Get the actual count of deleted records
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Successfully deleted % purchases for user: %', deleted_count, user_email;
    
END $$;

-- Verification: Check if any purchases remain
SELECT 
    'VERIFICATION' as status,
    COUNT(*) as remaining_purchases
FROM purchases p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com';

-- Show all purchases for this user (should be 0)
SELECT 
    p.item_name,
    p.category,
    p.price,
    p.currency,
    p.status,
    p.purchase_date
FROM purchases p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'megmukt@gmail.com'
ORDER BY p.purchase_date DESC;

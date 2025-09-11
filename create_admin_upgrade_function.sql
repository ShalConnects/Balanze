-- =====================================================
-- ADMIN FUNCTION FOR MANUAL PREMIUM UPGRADES
-- Creates a function that admins can use to upgrade users
-- =====================================================

-- Create admin function to upgrade any user to premium
CREATE OR REPLACE FUNCTION admin_upgrade_to_premium(
    target_user_id UUID,
    duration_months INTEGER DEFAULT 12,
    admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    admin_user_id UUID;
    target_user_email TEXT;
    result JSONB;
BEGIN
    -- Get the admin user ID (the one calling this function)
    admin_user_id := auth.uid();
    
    -- Check if the calling user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can upgrade users to premium';
    END IF;
    
    -- Get target user email for logging
    SELECT email INTO target_user_email FROM auth.users WHERE id = target_user_id;
    
    -- Update the user's subscription
    UPDATE profiles 
    SET subscription = jsonb_build_object(
        'plan', 'premium',
        'status', 'active',
        'validUntil', (NOW() + (duration_months || ' months')::interval)::text,
        'features', '{
            "max_accounts": -1,
            "max_transactions": -1,
            "max_currencies": -1,
            "analytics": true,
            "priority_support": true,
            "export_data": true,
            "custom_categories": true,
            "lend_borrow": true,
            "last_wish": true,
            "advanced_charts": true,
            "advanced_reporting": true
        }'::jsonb,
        'admin_upgrade', jsonb_build_object(
            'upgraded_by', admin_user_id,
            'upgraded_at', NOW()::text,
            'duration_months', duration_months,
            'notes', admin_notes
        )
    ),
    updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Record in subscription history
    INSERT INTO subscription_history (
        user_id, 
        plan_name, 
        status, 
        start_date, 
        end_date, 
        amount_paid, 
        currency, 
        payment_method
    ) VALUES (
        target_user_id,
        'premium',
        'active',
        NOW(),
        NOW() + (duration_months || ' months')::interval,
        0.00,
        'USD',
        'admin_upgrade'
    );
    
    -- Return success result
    result := jsonb_build_object(
        'success', true,
        'message', 'User upgraded to premium successfully',
        'user_id', target_user_id,
        'user_email', target_user_email,
        'plan', 'premium',
        'valid_until', (NOW() + (duration_months || ' months')::interval)::text,
        'duration_months', duration_months
    );
    
    -- Log the admin action
    RAISE LOG 'Admin % upgraded user % (%) to premium for % months', 
        admin_user_id, target_user_id, target_user_email, duration_months;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error upgrading user % to premium: %', target_user_id, SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', target_user_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to upgrade by email (easier to use)
CREATE OR REPLACE FUNCTION admin_upgrade_by_email(
    user_email TEXT,
    duration_months INTEGER DEFAULT 12,
    admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get user ID from email
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found with email: ' || user_email
        );
    END IF;
    
    -- Call the main upgrade function
    RETURN admin_upgrade_to_premium(user_id, duration_months, admin_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admins only)
GRANT EXECUTE ON FUNCTION admin_upgrade_to_premium(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_upgrade_by_email(TEXT, INTEGER, TEXT) TO authenticated;

-- Example usage:
-- SELECT admin_upgrade_by_email('your-email@example.com', 12, 'Testing premium features');
-- SELECT admin_upgrade_to_premium('user-uuid-here', 6, 'Short-term testing'); 
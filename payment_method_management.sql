-- =====================================================
-- PAYMENT METHOD MANAGEMENT DATABASE FUNCTIONS
-- Functions for managing user payment methods
-- =====================================================

-- =====================================================
-- 1. PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal')) NOT NULL,
    provider_payment_method_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('card', 'paypal', 'bank')) NOT NULL,
    brand TEXT, -- visa, mastercard, amex, etc.
    last4 TEXT, -- last 4 digits of card
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one default payment method per user
    UNIQUE(user_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_provider ON user_payment_methods(payment_provider);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_active ON user_payment_methods(is_active);

-- =====================================================
-- 3. FUNCTIONS FOR PAYMENT METHOD MANAGEMENT
-- =====================================================

-- Function to add a new payment method
CREATE OR REPLACE FUNCTION add_payment_method(
    p_user_id UUID,
    p_payment_provider TEXT,
    p_provider_payment_method_id TEXT,
    p_type TEXT,
    p_brand TEXT DEFAULT NULL,
    p_last4 TEXT DEFAULT NULL,
    p_expiry_month INTEGER DEFAULT NULL,
    p_expiry_year INTEGER DEFAULT NULL,
    p_is_default BOOLEAN DEFAULT false,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    payment_method_id UUID;
BEGIN
    -- If this is set as default, unset other default methods
    IF p_is_default THEN
        UPDATE user_payment_methods 
        SET is_default = false 
        WHERE user_id = p_user_id AND is_default = true;
    END IF;
    
    -- Insert the new payment method
    INSERT INTO user_payment_methods (
        user_id,
        payment_provider,
        provider_payment_method_id,
        type,
        brand,
        last4,
        expiry_month,
        expiry_year,
        is_default,
        metadata
    ) VALUES (
        p_user_id,
        p_payment_provider,
        p_provider_payment_method_id,
        p_type,
        p_brand,
        p_last4,
        p_expiry_month,
        p_expiry_year,
        p_is_default,
        p_metadata
    ) RETURNING id INTO payment_method_id;
    
    RETURN payment_method_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's payment methods
CREATE OR REPLACE FUNCTION get_user_payment_methods(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    payment_provider TEXT,
    provider_payment_method_id TEXT,
    type TEXT,
    brand TEXT,
    last4 TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN,
    is_active BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.payment_provider,
        pm.provider_payment_method_id,
        pm.type,
        pm.brand,
        pm.last4,
        pm.expiry_month,
        pm.expiry_year,
        pm.is_default,
        pm.is_active,
        pm.metadata,
        pm.created_at
    FROM user_payment_methods pm
    WHERE pm.user_id = p_user_id 
    AND pm.is_active = true
    ORDER BY pm.is_default DESC, pm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set default payment method
CREATE OR REPLACE FUNCTION set_default_payment_method(
    p_user_id UUID,
    p_payment_method_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- First, unset all default methods for this user
    UPDATE user_payment_methods 
    SET is_default = false 
    WHERE user_id = p_user_id;
    
    -- Then set the specified method as default
    UPDATE user_payment_methods 
    SET is_default = true, updated_at = NOW()
    WHERE id = p_payment_method_id 
    AND user_id = p_user_id 
    AND is_active = true;
    
    -- Check if the update was successful
    IF FOUND THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a payment method
CREATE OR REPLACE FUNCTION delete_payment_method(
    p_user_id UUID,
    p_payment_method_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    was_default BOOLEAN;
    remaining_count INTEGER;
BEGIN
    -- Check if this was the default payment method
    SELECT is_default INTO was_default
    FROM user_payment_methods
    WHERE id = p_payment_method_id AND user_id = p_user_id;
    
    -- Soft delete the payment method
    UPDATE user_payment_methods 
    SET is_active = false, updated_at = NOW()
    WHERE id = p_payment_method_id 
    AND user_id = p_user_id;
    
    -- If this was the default method, set another one as default
    IF was_default THEN
        -- Count remaining active payment methods
        SELECT COUNT(*) INTO remaining_count
        FROM user_payment_methods
        WHERE user_id = p_user_id AND is_active = true;
        
        -- If there are other methods, set the most recent one as default
        IF remaining_count > 0 THEN
            UPDATE user_payment_methods 
            SET is_default = true, updated_at = NOW()
            WHERE user_id = p_user_id 
            AND is_active = true
            AND id = (
                SELECT id FROM user_payment_methods
                WHERE user_id = p_user_id AND is_active = true
                ORDER BY created_at DESC
                LIMIT 1
            );
        END IF;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get default payment method
CREATE OR REPLACE FUNCTION get_default_payment_method(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    payment_provider TEXT,
    provider_payment_method_id TEXT,
    type TEXT,
    brand TEXT,
    last4 TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.payment_provider,
        pm.provider_payment_method_id,
        pm.type,
        pm.brand,
        pm.last4,
        pm.expiry_month,
        pm.expiry_year,
        pm.metadata
    FROM user_payment_methods pm
    WHERE pm.user_id = p_user_id 
    AND pm.is_default = true 
    AND pm.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on the payment methods table
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payment methods
CREATE POLICY "Users can view own payment methods" ON user_payment_methods
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own payment methods
CREATE POLICY "Users can insert own payment methods" ON user_payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own payment methods
CREATE POLICY "Users can update own payment methods" ON user_payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own payment methods
CREATE POLICY "Users can delete own payment methods" ON user_payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_method_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_method_updated_at
    BEFORE UPDATE ON user_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_method_updated_at();

-- =====================================================
-- 6. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample payment methods for testing (replace with actual user ID)
-- INSERT INTO user_payment_methods (
--     user_id,
--     payment_provider,
--     provider_payment_method_id,
--     type,
--     brand,
--     last4,
--     expiry_month,
--     expiry_year,
--     is_default,
--     metadata
-- ) VALUES (
--     'your-user-id-here',
--     'stripe',
--     'pm_1234567890',
--     'card',
--     'visa',
--     '4242',
--     12,
--     2025,
--     true,
--     '{"fingerprint": "abc123", "country": "US"}'::jsonb
-- );

-- =====================================================
-- 7. USAGE EXAMPLES
-- =====================================================

-- Add a new payment method:
-- SELECT add_payment_method(
--     'user-uuid-here',
--     'stripe',
--     'pm_1234567890',
--     'card',
--     'visa',
--     '4242',
--     12,
--     2025,
--     true
-- );

-- Get user's payment methods:
-- SELECT * FROM get_user_payment_methods('user-uuid-here');

-- Set default payment method:
-- SELECT set_default_payment_method('user-uuid-here', 'payment-method-uuid-here');

-- Delete a payment method:
-- SELECT delete_payment_method('user-uuid-here', 'payment-method-uuid-here');

-- Get default payment method:
-- SELECT * FROM get_default_payment_method('user-uuid-here');

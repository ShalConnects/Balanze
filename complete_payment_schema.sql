-- =====================================================
-- COMPLETE PAYMENT SYSTEM DATABASE SCHEMA
-- Includes all payment changes: monthly, one-time, refunds
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'one-time')) NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'refunded')) DEFAULT 'active',
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'one-time')) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal')) NOT NULL,
    external_subscription_id TEXT,
    external_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. PAYMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal')) NOT NULL,
    provider_transaction_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
    payment_method TEXT,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'one-time')) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('payment', 'refund', 'chargeback')) DEFAULT 'payment',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. REFUND REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    request_reason TEXT NOT NULL,
    request_message TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'processed')) DEFAULT 'pending',
    refund_amount DECIMAL(10,2),
    refund_currency TEXT DEFAULT 'USD',
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. PAYMENT WEBHOOKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT CHECK (provider IN ('stripe', 'paypal')) NOT NULL,
    event_type TEXT NOT NULL,
    event_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. INSERT DEFAULT PLANS
-- =====================================================

-- Free Plan
INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, features, is_active) 
VALUES (
    'free',
    'Basic plan with limited features',
    0.00,
    'USD',
    'monthly',
    '{
        "max_accounts": 5,
        "max_transactions": 100,
        "max_currencies": 1,
        "analytics": false,
        "priority_support": false,
        "export_data": false,
        "custom_categories": false,
        "lend_borrow": false,
        "last_wish": false,
        "advanced_charts": false,
        "advanced_reporting": false
    }'::jsonb,
    true
) ON CONFLICT (name) DO UPDATE SET
    features = EXCLUDED.features,
    updated_at = NOW();

-- Premium Monthly Plan
INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, features, is_active) 
VALUES (
    'premium',
    'Premium plan with all features',
    7.99,
    'USD',
    'monthly',
    '{
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
    true
) ON CONFLICT (name) DO UPDATE SET
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Premium Lifetime Plan
INSERT INTO subscription_plans (name, description, price, currency, billing_cycle, features, is_active) 
VALUES (
    'premium_lifetime',
    'Premium plan with lifetime access',
    199.99,
    'USD',
    'one-time',
    '{
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
    true
) ON CONFLICT (name) DO UPDATE SET
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    updated_at = NOW();

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_external_id ON user_subscriptions(external_subscription_id);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON payment_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Refund requests indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at);

-- Payment webhooks indexes
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_id ON payment_webhooks(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);

-- =====================================================
-- 8. CREATE FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    plan_price DECIMAL,
    billing_cycle TEXT,
    status TEXT,
    end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        sp.name,
        sp.price,
        us.billing_cycle,
        us.status,
        us.end_date
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_uuid 
    AND us.status = 'active'
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can request refund
CREATE OR REPLACE FUNCTION can_request_refund(user_uuid UUID, subscription_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_date TIMESTAMP WITH TIME ZONE;
    days_since_purchase INTEGER;
BEGIN
    -- Get the purchase date from the subscription
    SELECT us.start_date INTO purchase_date
    FROM user_subscriptions us
    WHERE us.id = subscription_uuid AND us.user_id = user_uuid;
    
    IF purchase_date IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate days since purchase
    days_since_purchase := EXTRACT(DAY FROM (NOW() - purchase_date));
    
    -- Allow refund if within 30 days
    RETURN days_since_purchase <= 30;
END;
$$ LANGUAGE plpgsql;

-- Function to process refund
CREATE OR REPLACE FUNCTION process_refund(
    refund_request_uuid UUID,
    admin_user_uuid UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    refund_record RECORD;
    transaction_record RECORD;
BEGIN
    -- Get refund request details
    SELECT * INTO refund_record
    FROM refund_requests
    WHERE id = refund_request_uuid AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get the original transaction
    SELECT * INTO transaction_record
    FROM payment_transactions
    WHERE id = refund_record.transaction_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update refund request
    UPDATE refund_requests
    SET 
        status = 'approved',
        processed_at = NOW(),
        processed_by = admin_user_uuid,
        admin_notes = COALESCE(admin_notes, 'Refund processed automatically'),
        updated_at = NOW()
    WHERE id = refund_request_uuid;
    
    -- Update transaction status
    UPDATE payment_transactions
    SET 
        status = 'refunded',
        updated_at = NOW()
    WHERE id = transaction_record.id;
    
    -- Update subscription status
    UPDATE user_subscriptions
    SET 
        status = 'refunded',
        updated_at = NOW()
    WHERE id = refund_record.subscription_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables (safe version - drops existing triggers first)
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON refund_requests;
CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON refund_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active subscriptions with plan details
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    us.id as subscription_id,
    us.user_id,
    sp.name as plan_name,
    sp.price,
    sp.billing_cycle,
    us.status,
    us.start_date,
    us.end_date,
    us.next_billing_date,
    us.payment_provider
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active';

-- View for refund statistics
CREATE OR REPLACE VIEW refund_statistics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_refunds,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_refunds,
    SUM(CASE WHEN status = 'approved' THEN refund_amount ELSE 0 END) as total_refunded_amount
FROM refund_requests
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions (safe version - drops existing policy first)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own payment transactions (safe version - drops existing policy first)
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
CREATE POLICY "Users can view own transactions" ON payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own refund requests (safe version - drops existing policy first)
DROP POLICY IF EXISTS "Users can view own refund requests" ON refund_requests;
CREATE POLICY "Users can view own refund requests" ON refund_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own refund requests (safe version - drops existing policy first)
DROP POLICY IF EXISTS "Users can create refund requests" ON refund_requests;
CREATE POLICY "Users can create refund requests" ON refund_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 12. VERIFICATION QUERIES
-- =====================================================

-- Verify all plans are created
SELECT 
    'PLAN SYSTEM DEPLOYMENT COMPLETE' as status,
    COUNT(*) as total_plans,
    COUNT(CASE WHEN name = 'free' THEN 1 END) as free_plan_exists,
    COUNT(CASE WHEN name = 'premium' THEN 1 END) as premium_plan_exists,
    COUNT(CASE WHEN name = 'premium_lifetime' THEN 1 END) as lifetime_plan_exists
FROM subscription_plans 
WHERE is_active = true;

-- Verify pricing is correct
SELECT 
    name,
    price,
    billing_cycle,
    description
FROM subscription_plans 
WHERE is_active = true
ORDER BY price;

-- =====================================================
-- SCHEMA DEPLOYMENT COMPLETE
-- =====================================================

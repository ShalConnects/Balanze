-- =====================================================
-- SETUP PAYMENT DATA FOR TESTING
-- Run this SQL in your Supabase SQL Editor to set up payment tables and sample data
-- =====================================================

-- =====================================================
-- 1. CREATE SUBSCRIPTION PLANS
-- =====================================================
INSERT INTO subscription_plans (id, name, description, price, currency, billing_cycle, features, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Free', 'Basic plan with limited features', 0.00, 'USD', 'monthly', '{"max_accounts": 3, "max_transactions": 100, "analytics": false, "priority_support": false, "export_data": false}'::jsonb, true),
('550e8400-e29b-41d4-a716-446655440002', 'Premium', 'Premium plan with all features', 9.99, 'USD', 'monthly', '{"max_accounts": -1, "max_transactions": -1, "analytics": true, "priority_support": true, "export_data": true, "advanced_charts": true, "custom_categories": true}'::jsonb, true),
('550e8400-e29b-41d4-a716-446655440003', 'Pro', 'Professional plan for businesses', 19.99, 'USD', 'monthly', '{"max_accounts": -1, "max_transactions": -1, "analytics": true, "priority_support": true, "export_data": true, "advanced_charts": true, "custom_categories": true, "team_collaboration": true, "api_access": true}'::jsonb, true),
('550e8400-e29b-41d4-a716-446655440004', 'Lifetime', 'One-time payment for lifetime access', 199.99, 'USD', 'one-time', '{"max_accounts": -1, "max_transactions": -1, "analytics": true, "priority_support": true, "export_data": true, "advanced_charts": true, "custom_categories": true, "team_collaboration": true, "api_access": true}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATE SAMPLE USER SUBSCRIPTIONS
-- =====================================================
-- Using the first user ID from your database: ab00da33-d8b7-477a-b075-368ac493f4d6 (megmukt@gmail.com)
-- You can replace this with any other user ID from your list

-- Example user subscription (using actual user ID)
INSERT INTO user_subscriptions (
    id, 
    user_id, 
    plan_id, 
    status, 
    billing_cycle, 
    start_date, 
    payment_method, 
    payment_provider, 
    external_subscription_id, 
    external_customer_id
) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'ab00da33-d8b7-477a-b075-368ac493f4d6', '550e8400-e29b-41d4-a716-446655440002', 'active', 'monthly', NOW() - INTERVAL '30 days', '****4242', 'stripe', 'sub_stripe_123456', 'cus_stripe_123456'),
('550e8400-e29b-41d4-a716-446655440011', 'ab00da33-d8b7-477a-b075-368ac493f4d6', '550e8400-e29b-41d4-a716-446655440002', 'active', 'monthly', NOW() - INTERVAL '60 days', '****4242', 'stripe', 'sub_stripe_123456', 'cus_stripe_123456')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. CREATE SAMPLE PAYMENT TRANSACTIONS
-- =====================================================
-- Using actual user ID: ab00da33-d8b7-477a-b075-368ac493f4d6 (megmukt@gmail.com)

INSERT INTO payment_transactions (
    id,
    user_id,
    subscription_id,
    plan_id,
    amount,
    currency,
    payment_provider,
    provider_transaction_id,
    status,
    payment_method,
    billing_cycle,
    transaction_type,
    metadata
) VALUES
-- Recent completed payment
('550e8400-e29b-41d4-a716-446655440020', 'ab00da33-d8b7-477a-b075-368ac493f4d6', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 9.99, 'USD', 'stripe', 'pi_1234567890', 'completed', '****4242', 'monthly', 'payment', '{"invoice_id": "inv_123", "receipt_url": "https://pay.stripe.com/receipts/123"}'::jsonb),

-- Previous month payment
('550e8400-e29b-41d4-a716-446655440021', 'ab00da33-d8b7-477a-b075-368ac493f4d6', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 9.99, 'USD', 'stripe', 'pi_0987654321', 'completed', '****4242', 'monthly', 'payment', '{"invoice_id": "inv_122", "receipt_url": "https://pay.stripe.com/receipts/122"}'::jsonb),

-- Pending payment
('550e8400-e29b-41d4-a716-446655440022', 'ab00da33-d8b7-477a-b075-368ac493f4d6', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 9.99, 'USD', 'stripe', 'pi_1122334455', 'pending', '****4242', 'monthly', 'payment', '{"invoice_id": "inv_124", "receipt_url": null}'::jsonb),

-- Failed payment
('550e8400-e29b-41d4-a716-446655440023', 'ab00da33-d8b7-477a-b075-368ac493f4d6', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 9.99, 'USD', 'stripe', 'pi_5566778899', 'failed', '****4242', 'monthly', 'payment', '{"error": "insufficient_funds", "retry_count": 2}'::jsonb),

-- Refunded payment
('550e8400-e29b-41d4-a716-446655440024', 'ab00da33-d8b7-477a-b075-368ac493f4d6', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 9.99, 'USD', 'stripe', 'pi_9988776655', 'refunded', '****4242', 'monthly', 'refund', '{"refund_reason": "customer_request", "refund_amount": 9.99}'::jsonb),

-- PayPal payment
('550e8400-e29b-41d4-a716-446655440025', 'ab00da33-d8b7-477a-b075-368ac493f4d6', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 19.99, 'USD', 'paypal', 'PAYID-123456789', 'completed', 'PayPal Account', 'monthly', 'payment', '{"paypal_order_id": "ORDER-123456789", "payer_email": "user@example.com"}'::jsonb),

-- One-time payment
('550e8400-e29b-41d4-a716-446655440026', 'ab00da33-d8b7-477a-b075-368ac493f4d6', NULL, '550e8400-e29b-41d4-a716-446655440004', 199.99, 'USD', 'stripe', 'pi_lifetime_123', 'completed', '****4242', 'one-time', 'payment', '{"lifetime_purchase": true, "discount_applied": 0}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. CREATE SAMPLE PAYMENT METHODS
-- =====================================================
-- First, delete any existing payment methods for this user to avoid conflicts
DELETE FROM user_payment_methods WHERE user_id = 'ab00da33-d8b7-477a-b075-368ac493f4d6';

-- Insert only one default payment method (Visa card)
INSERT INTO user_payment_methods (
    id,
    user_id,
    payment_provider,
    provider_payment_method_id,
    type,
    brand,
    last4,
    expiry_month,
    expiry_year,
    is_default,
    is_active,
    metadata
) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'ab00da33-d8b7-477a-b075-368ac493f4d6', 'stripe', 'pm_stripe_123456', 'card', 'visa', '4242', 12, 2025, true, true, '{"fingerprint": "fp_123456789"}'::jsonb);

-- Insert additional payment methods without default constraint
-- Note: We'll only insert one additional method to avoid constraint issues
INSERT INTO user_payment_methods (
    id,
    user_id,
    payment_provider,
    provider_payment_method_id,
    type,
    brand,
    last4,
    expiry_month,
    expiry_year,
    is_default,
    is_active,
    metadata
) VALUES
('550e8400-e29b-41d4-a716-446655440031', 'ab00da33-d8b7-477a-b075-368ac493f4d6', 'stripe', 'pm_stripe_789012', 'card', 'mastercard', '5555', 10, 2026, false, true, '{"fingerprint": "fp_987654321"}'::jsonb);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(payment_provider);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;

-- Users can only see their own payment transactions
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Everyone can view subscription plans (they're public)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
    FOR SELECT USING (true);

-- =====================================================
-- 8. CREATE HELPFUL VIEWS
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

-- View for payment history with plan details
CREATE OR REPLACE VIEW payment_history_view AS
SELECT 
    pt.id,
    pt.user_id,
    pt.subscription_id,
    pt.plan_id,
    pt.amount,
    pt.currency,
    pt.payment_provider,
    pt.provider_transaction_id,
    pt.status,
    pt.payment_method,
    pt.billing_cycle,
    pt.transaction_type,
    pt.metadata,
    pt.created_at,
    pt.updated_at,
    sp.name as plan_name,
    sp.description as plan_description
FROM payment_transactions pt
LEFT JOIN subscription_plans sp ON pt.plan_id = sp.id
ORDER BY pt.created_at DESC;

-- =====================================================
-- 9. USAGE INSTRUCTIONS
-- =====================================================
/*
To use this setup:

1. Replace 'your-user-id-here' with actual user IDs from your auth.users table
2. Run this SQL in your Supabase SQL Editor
3. The payment history will now show real data from the database
4. You can add more sample data by inserting additional records

To get your user ID:
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

To add more sample transactions:
INSERT INTO payment_transactions (...) VALUES (...);
*/

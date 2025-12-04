-- =====================================================
-- SUBSCRIPTION MANAGEMENT SYSTEM
-- =====================================================

-- Create subscription plans table
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

-- Create subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    plan_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    amount_paid DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features) VALUES
('free', 'Basic plan with limited features', 0.00, 'monthly', '{"max_accounts": 3, "max_transactions": 100, "analytics": false, "priority_support": false, "export_data": false}'::jsonb),
('premium', 'Premium plan with all features', 9.99, 'monthly', '{"max_accounts": -1, "max_transactions": -1, "analytics": true, "priority_support": true, "export_data": true, "advanced_charts": true, "custom_categories": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create function to upgrade user subscription
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
    user_uuid UUID,
    plan_name TEXT,
    payment_method TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    plan_record RECORD;
    current_subscription JSONB;
BEGIN
    -- Get plan details
    SELECT * INTO plan_record FROM subscription_plans WHERE name = plan_name AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan % not found or inactive', plan_name;
    END IF;
    
    -- Get current subscription
    SELECT subscription INTO current_subscription FROM profiles WHERE id = user_uuid;
    
    -- Update user subscription
    UPDATE profiles 
    SET subscription = jsonb_build_object(
        'plan', plan_name,
        'status', 'active',
        'validUntil', (NOW() + INTERVAL '1 month')::text,
        'features', plan_record.features
    ),
    updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Record in subscription history
    INSERT INTO subscription_history (
        user_id, 
        plan_id, 
        plan_name, 
        status, 
        start_date, 
        end_date, 
        amount_paid, 
        currency, 
        payment_method
    ) VALUES (
        user_uuid,
        plan_record.id,
        plan_name,
        'active',
        NOW(),
        NOW() + INTERVAL '1 month',
        plan_record.price,
        plan_record.currency,
        payment_method
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error upgrading subscription for user %: %', user_uuid, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_status(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_subscription JSONB;
    is_active BOOLEAN;
    days_remaining INTEGER;
BEGIN
    -- Get user subscription
    SELECT subscription INTO user_subscription FROM profiles WHERE id = user_uuid;
    
    IF user_subscription IS NULL THEN
        RETURN jsonb_build_object(
            'plan', 'free',
            'status', 'active',
            'isActive', true,
            'daysRemaining', -1,
            'features', '{"max_accounts": 3, "max_transactions": 100, "analytics": false}'::jsonb
        );
    END IF;
    
    -- Check if subscription is expired
    IF user_subscription->>'validUntil' IS NOT NULL THEN
        days_remaining := EXTRACT(DAY FROM (user_subscription->>'validUntil')::timestamp - NOW());
        is_active := days_remaining > 0;
    ELSE
        days_remaining := -1;
        is_active := true;
    END IF;
    
    RETURN jsonb_build_object(
        'plan', user_subscription->>'plan',
        'status', user_subscription->>'status',
        'isActive', is_active,
        'daysRemaining', days_remaining,
        'features', user_subscription->'features'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for subscription tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view active subscription plans (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscription_plans' 
      AND policyname = 'Users can view active subscription plans'
  ) THEN
    CREATE POLICY "Users can view active subscription plans" ON subscription_plans
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Allow users to view their own subscription history (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscription_history' 
      AND policyname = 'Users can view their own subscription history'
  ) THEN
    CREATE POLICY "Users can view their own subscription history" ON subscription_history
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to insert their own subscription history (for upgrades) (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'subscription_history' 
      AND policyname = 'Users can insert their own subscription history'
  ) THEN
    CREATE POLICY "Users can insert their own subscription history" ON subscription_history
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON subscription_history(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_plan_name ON subscription_history(plan_name); 

-- Downgrade user subscription to Free plan (immediate for lifetime, scheduled for monthly)
CREATE OR REPLACE FUNCTION downgrade_user_subscription(
    user_uuid UUID,
    is_lifetime BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    current_subscription JSONB;
    free_plan RECORD;
    result JSONB;
    current_valid_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Load current subscription
    SELECT subscription INTO current_subscription FROM profiles WHERE id = user_uuid;

    -- Load Free plan details
    SELECT * INTO free_plan FROM subscription_plans WHERE name = 'free' AND is_active = true;

    IF current_subscription IS NULL OR (current_subscription->>'plan') IS NULL THEN
        -- Treat as already free
        UPDATE profiles
        SET subscription = jsonb_build_object(
            'plan', 'free',
            'status', 'active',
            'validUntil', NULL,
            'features', free_plan.features
        ),
        updated_at = NOW()
        WHERE id = user_uuid;

        result := jsonb_build_object('status', 'immediate', 'message', 'Set to free');
        RETURN result;
    END IF;

    -- Parse current validUntil if present
    IF (current_subscription->>'validUntil') IS NOT NULL THEN
        current_valid_until := (current_subscription->>'validUntil')::timestamp;
    ELSE
        current_valid_until := NULL;
    END IF;

    -- Immediate downgrade for all users (both lifetime and monthly)
    IF is_lifetime = TRUE OR lower(coalesce(current_subscription->>'billing_cycle','')) IN ('lifetime','one-time') OR TRUE THEN
        UPDATE profiles 
        SET subscription = jsonb_build_object(
            'plan', 'free',
            'status', 'active',
            'validUntil', NULL,
            'features', free_plan.features
        ),
        updated_at = NOW()
        WHERE id = user_uuid;

        -- Record history
        INSERT INTO subscription_history (
            user_id,
            plan_id,
            plan_name,
            status,
            start_date,
            end_date,
            amount_paid,
            currency,
            payment_method
        ) VALUES (
            user_uuid,
            free_plan.id,
            'free',
            'active',
            NOW(),
            NULL,
            0,
            free_plan.currency,
            'system'
        );

        result := jsonb_build_object('status', 'immediate', 'message', 'Downgraded to free');
        RETURN result;
    END IF;

    -- For monthly/recurring subscriptions: schedule at period end
    UPDATE profiles
    SET subscription = coalesce(current_subscription, '{}'::jsonb) || jsonb_build_object(
        'cancel_at_period_end', TRUE
    ),
    updated_at = NOW()
    WHERE id = user_uuid;

    -- Record cancellation intent in history
    INSERT INTO subscription_history (
        user_id,
        plan_id,
        plan_name,
        status,
        start_date,
        end_date,
        amount_paid,
        currency,
        payment_method
    ) VALUES (
        user_uuid,
        free_plan.id,
        'premium',
        'cancelled',
        NOW(),
        current_valid_until,
        NULL,
        free_plan.currency,
        'system'
    );

    result := jsonb_build_object(
        'status', 'scheduled',
        'cancel_at_period_end', TRUE,
        'effective_date', to_char(coalesce(current_valid_until, NOW()), 'YYYY-MM-DD"T"HH24:MI:SSOF')
    );
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error downgrading subscription for user %: %', user_uuid, SQLERRM;
        RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
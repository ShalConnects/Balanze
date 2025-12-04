-- Create last_wish_settings table
CREATE TABLE IF NOT EXISTS last_wish_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    check_in_frequency INTEGER DEFAULT 30, -- days
    last_check_in TIMESTAMP WITH TIME ZONE,
    recipients JSONB DEFAULT '[]'::jsonb, -- Array of recipient objects
    include_data JSONB DEFAULT '{
        "accounts": true,
        "transactions": true,
        "purchases": true,
        "lendBorrow": true,
        "savings": true,
        "analytics": true
    }'::jsonb,
    message TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_last_wish_settings_user_id ON last_wish_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_last_wish_settings_enabled ON last_wish_settings(is_enabled) WHERE is_enabled = TRUE;

-- Create RLS policies
ALTER TABLE last_wish_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own settings
CREATE POLICY "Users can manage their own last wish settings" ON last_wish_settings
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_last_wish_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_last_wish_settings_updated_at
    BEFORE UPDATE ON last_wish_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_last_wish_settings_updated_at();

-- Create function to check for overdue check-ins
CREATE OR REPLACE FUNCTION check_overdue_last_wish()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lws.user_id,
        au.email,
        EXTRACT(DAY FROM (NOW() - (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency)))::INTEGER as days_overdue
    FROM last_wish_settings lws
    JOIN auth.users au ON lws.user_id = au.id
    WHERE lws.is_enabled = TRUE 
    AND lws.is_active = TRUE
    AND lws.last_check_in IS NOT NULL
    AND NOW() > (lws.last_check_in + INTERVAL '1 day' * lws.check_in_frequency);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table for delivery logs
CREATE TABLE IF NOT EXISTS last_wish_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    delivery_data JSONB NOT NULL,
    delivery_status TEXT DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for delivery logs
CREATE INDEX IF NOT EXISTS idx_last_wish_deliveries_user_id ON last_wish_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_last_wish_deliveries_status ON last_wish_deliveries(delivery_status);

-- RLS policies for delivery logs
ALTER TABLE last_wish_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery logs" ON last_wish_deliveries
    FOR SELECT USING (auth.uid() = user_id);

-- Create function to trigger data delivery
CREATE OR REPLACE FUNCTION trigger_last_wish_delivery(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    settings_record RECORD;
    recipient_record RECORD;
    delivery_data JSONB;
BEGIN
    -- Get user settings
    SELECT * INTO settings_record 
    FROM last_wish_settings 
    WHERE user_id = user_uuid AND is_enabled = TRUE;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Prepare delivery data based on settings
    delivery_data := jsonb_build_object(
        'message', settings_record.message,
        'delivery_date', NOW(),
        'data_included', settings_record.include_data
    );
    
    -- Create delivery records for each recipient
    FOR recipient_record IN 
        SELECT jsonb_array_elements(settings_record.recipients) as recipient
    LOOP
        INSERT INTO last_wish_deliveries (
            user_id, 
            recipient_email, 
            delivery_data, 
            delivery_status
        ) VALUES (
            user_uuid,
            recipient_record.recipient->>'email',
            delivery_data,
            'pending'
        );
    END LOOP;
    
    -- Update settings to mark as delivered
    UPDATE last_wish_settings 
    SET is_active = FALSE 
    WHERE user_id = user_uuid;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON last_wish_settings TO authenticated;
GRANT ALL ON last_wish_deliveries TO authenticated;
GRANT EXECUTE ON FUNCTION check_overdue_last_wish() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_last_wish_delivery(UUID) TO authenticated; 
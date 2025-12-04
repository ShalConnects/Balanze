-- Create table for donation and saving records
CREATE TABLE IF NOT EXISTS donation_saving_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    type VARCHAR(16) NOT NULL CHECK (type IN ('saving', 'donation')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    mode VARCHAR(8) NOT NULL CHECK (mode IN ('fixed', 'percent')),
    custom_transaction_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    note TEXT
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_donation_saving_user_id ON donation_saving_records(user_id);
-- Index for fast lookup by transaction
CREATE INDEX IF NOT EXISTS idx_donation_saving_transaction_id ON donation_saving_records(transaction_id); 
-- Check if DPS fields exist in accounts table
DO $$
BEGIN
    -- Check if has_dps column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'has_dps') THEN
        ALTER TABLE accounts ADD COLUMN has_dps boolean DEFAULT false;
        RAISE NOTICE 'Added has_dps column';
    ELSE
        RAISE NOTICE 'has_dps column already exists';
    END IF;

    -- Check if dps_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'dps_type') THEN
        ALTER TABLE accounts ADD COLUMN dps_type text CHECK (dps_type IN ('monthly', 'flexible') OR dps_type IS NULL);
        RAISE NOTICE 'Added dps_type column';
    ELSE
        RAISE NOTICE 'dps_type column already exists';
    END IF;

    -- Check if dps_amount_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'dps_amount_type') THEN
        ALTER TABLE accounts ADD COLUMN dps_amount_type text CHECK (dps_amount_type IN ('fixed', 'custom') OR dps_amount_type IS NULL);
        RAISE NOTICE 'Added dps_amount_type column';
    ELSE
        RAISE NOTICE 'dps_amount_type column already exists';
    END IF;

    -- Check if dps_fixed_amount column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'dps_fixed_amount') THEN
        ALTER TABLE accounts ADD COLUMN dps_fixed_amount decimal DEFAULT NULL;
        RAISE NOTICE 'Added dps_fixed_amount column';
    ELSE
        RAISE NOTICE 'dps_fixed_amount column already exists';
    END IF;

    -- Check if dps_savings_account_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'dps_savings_account_id') THEN
        ALTER TABLE accounts ADD COLUMN dps_savings_account_id uuid REFERENCES accounts(id);
        RAISE NOTICE 'Added dps_savings_account_id column';
    ELSE
        RAISE NOTICE 'dps_savings_account_id column already exists';
    END IF;
END $$;

-- Check if dps_transfers table exists
CREATE TABLE IF NOT EXISTS dps_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  from_account_id uuid REFERENCES accounts(id),
  to_account_id uuid REFERENCES accounts(id),
  amount decimal NOT NULL,
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for DPS transfers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dps_transfers' AND policyname = 'Users can view their own DPS transfers') THEN
        CREATE POLICY "Users can view their own DPS transfers"
          ON dps_transfers FOR SELECT
          USING (auth.uid() = user_id);
        RAISE NOTICE 'Added DPS transfers view policy';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dps_transfers' AND policyname = 'Users can insert their own DPS transfers') THEN
        CREATE POLICY "Users can insert their own DPS transfers"
          ON dps_transfers FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Added DPS transfers insert policy';
    END IF;
END $$;

-- Enable RLS on dps_transfers if not already enabled
ALTER TABLE dps_transfers ENABLE ROW LEVEL SECURITY;

-- Show current accounts with DPS fields
SELECT id, name, has_dps, dps_type, dps_amount_type, dps_fixed_amount, dps_savings_account_id 
FROM accounts 
WHERE has_dps = true 
LIMIT 5; 
-- Fix clients table - Add all missing columns to match the schema
-- Run this in your Supabase SQL Editor

-- Add phone column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'phone'
    ) THEN
        ALTER TABLE clients ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column';
    END IF;
END $$;

-- Add city column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'city'
    ) THEN
        ALTER TABLE clients ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column';
    END IF;
END $$;

-- Add state column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'state'
    ) THEN
        ALTER TABLE clients ADD COLUMN state TEXT;
        RAISE NOTICE 'Added state column';
    END IF;
END $$;

-- Add postal_code column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE clients ADD COLUMN postal_code TEXT;
        RAISE NOTICE 'Added postal_code column';
    END IF;
END $$;

-- Add country column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'country'
    ) THEN
        ALTER TABLE clients ADD COLUMN country TEXT;
        RAISE NOTICE 'Added country column';
    END IF;
END $$;

-- Add company_name column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'company_name'
    ) THEN
        ALTER TABLE clients ADD COLUMN company_name TEXT;
        RAISE NOTICE 'Added company_name column';
    END IF;
END $$;

-- Add tax_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'tax_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN tax_id TEXT;
        RAISE NOTICE 'Added tax_id column';
    END IF;
END $$;

-- Add website column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'website'
    ) THEN
        ALTER TABLE clients ADD COLUMN website TEXT;
        RAISE NOTICE 'Added website column';
    END IF;
END $$;

-- Add status column with default and check constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'status'
    ) THEN
        ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active';
        ALTER TABLE clients ADD CONSTRAINT clients_status_check 
            CHECK (status IN ('active', 'inactive', 'archived'));
        RAISE NOTICE 'Added status column with constraint';
    END IF;
END $$;

-- Add default_currency column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'default_currency'
    ) THEN
        ALTER TABLE clients ADD COLUMN default_currency TEXT DEFAULT 'USD';
        RAISE NOTICE 'Added default_currency column';
    END IF;
END $$;

-- Add tags column (TEXT array)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'tags'
    ) THEN
        ALTER TABLE clients ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added tags column';
    END IF;
END $$;

-- Add notes column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'notes'
    ) THEN
        ALTER TABLE clients ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;
END $$;

-- Add custom_fields column (JSONB)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'custom_fields'
    ) THEN
        ALTER TABLE clients ADD COLUMN custom_fields JSONB DEFAULT '{}';
        RAISE NOTICE 'Added custom_fields column';
    END IF;
END $$;

-- Verify all columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;


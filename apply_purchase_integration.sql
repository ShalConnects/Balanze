-- =====================================================
-- APPLY PURCHASE INTEGRATION CHANGES
-- =====================================================

-- 1. Add transaction_id column to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- 2. Create purchase_attachments table for file uploads
CREATE TABLE IF NOT EXISTS purchase_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 5242880), -- 5MB max
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security on purchase_attachments
ALTER TABLE purchase_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for purchase_attachments
CREATE POLICY "Users can view their own purchase attachments"
    ON purchase_attachments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase attachments"
    ON purchase_attachments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase attachments"
    ON purchase_attachments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase attachments"
    ON purchase_attachments FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Create indexes for purchase_attachments
CREATE INDEX IF NOT EXISTS idx_purchase_attachments_purchase_id ON purchase_attachments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_attachments_user_id ON purchase_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_attachments_created_at ON purchase_attachments(created_at DESC);

-- 6. Create index for transaction_id in purchases
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON purchases(transaction_id);

-- 7. Create function to validate file types
CREATE OR REPLACE FUNCTION validate_file_type(file_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allowed file types: images, documents, PDFs
    RETURN file_type IN (
        'jpg', 'jpeg', 'png', 'gif',  -- Images
        'pdf', 'docx', 'xlsx', 'txt'  -- Documents
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to validate file type on insert
CREATE OR REPLACE FUNCTION check_file_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_file_type(NEW.file_type) THEN
        RAISE EXCEPTION 'File type % is not allowed. Allowed types: jpg, jpeg, png, gif, pdf, docx, xlsx, txt', NEW.file_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_file_type_trigger ON purchase_attachments;
CREATE TRIGGER validate_file_type_trigger
    BEFORE INSERT ON purchase_attachments
    FOR EACH ROW
    EXECUTE FUNCTION check_file_type();

-- 9. Create function to sync purchase price with transaction amount
CREATE OR REPLACE FUNCTION sync_purchase_price()
RETURNS TRIGGER AS $$
BEGIN
    -- When a purchase is updated, sync the linked transaction amount
    IF NEW.transaction_id IS NOT NULL AND NEW.price != OLD.price THEN
        UPDATE transactions 
        SET amount = NEW.price, updated_at = NOW()
        WHERE id = NEW.transaction_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_purchase_price_trigger ON purchases;
CREATE TRIGGER sync_purchase_price_trigger
    AFTER UPDATE ON purchases
    FOR EACH ROW
    WHEN (OLD.price IS DISTINCT FROM NEW.price)
    EXECUTE FUNCTION sync_purchase_price();

-- 10. Create function to sync transaction amount with purchase price
CREATE OR REPLACE FUNCTION sync_transaction_price()
RETURNS TRIGGER AS $$
BEGIN
    -- When a transaction is updated, sync the linked purchase price
    IF NEW.amount != OLD.amount THEN
        UPDATE purchases 
        SET price = NEW.amount, updated_at = NOW()
        WHERE transaction_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_transaction_price_trigger ON transactions;
CREATE TRIGGER sync_transaction_price_trigger
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
    EXECUTE FUNCTION sync_transaction_price();

-- 11. Create Supabase Storage bucket for purchase attachments
-- Note: This needs to be done through the Supabase dashboard or CLI
-- INSERT INTO storage.buckets (id, name, public) VALUES ('purchase-attachments', 'purchase-attachments', true);

-- 12. Create storage policies for purchase attachments
-- Note: These policies need to be created through the Supabase dashboard or CLI
-- Users can upload files to their own folder: purchase-attachments/{user_id}/*
-- Users can view files in their own folder: purchase-attachments/{user_id}/*

-- 13. Update existing purchases to have 'purchased' status by default
UPDATE purchases 
SET status = 'purchased' 
WHERE status IS NULL OR status = 'planned';

-- 14. Add audit logging for purchase operations
-- This will be handled by the existing audit logging system

-- 15. Verify the changes
SELECT 
    'purchases' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' 
ORDER BY ordinal_position;

SELECT 
    'purchase_attachments' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_attachments' 
ORDER BY ordinal_position;

-- 16. Create function to auto-create a default cash account for every new user
CREATE OR REPLACE FUNCTION public.create_default_cash_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (
    user_id,
    name,
    type,
    initial_balance,
    currency,
    is_active,
    created_at,
    updated_at,
    description,
    has_dps,
    dps_type,
    dps_amount_type,
    dps_fixed_amount
  )
  VALUES (
    NEW.id,
    'Cash Wallet',
    'cash',
    0,
    'USD', -- or use NEW.raw_user_meta_data->>'local_currency' if you want to use user's preferred currency
    TRUE,
    timezone('utc', now()),
    timezone('utc', now()),
    'Default cash account',
    FALSE,
    NULL,
    NULL,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Trigger to call the function after a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_create_cash_account ON auth.users;
CREATE TRIGGER on_auth_user_created_create_cash_account
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_cash_account(); 
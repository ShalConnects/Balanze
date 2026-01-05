-- =====================================================
-- STANDALONE: Create invoices table safely
-- This creates the table without foreign key dependencies first
-- =====================================================

-- Step 1: Drop the table if it exists (safely)
DROP TABLE IF EXISTS invoices CASCADE;

-- Step 2: Create the table WITHOUT foreign keys first (to avoid dependency issues)
CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID,
    order_id UUID,
    transaction_id UUID,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'draft',
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    payment_status TEXT DEFAULT 'unpaid',
    paid_amount DECIMAL(15,2) DEFAULT 0,
    paid_date DATE,
    pdf_path TEXT,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    email_recipient TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add CHECK constraints (after table is created)
ALTER TABLE invoices 
    ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'));

ALTER TABLE invoices 
    ADD CONSTRAINT invoices_payment_status_check 
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded'));

-- Step 4: Add foreign key constraints (if the referenced tables exist)
DO $$
BEGIN
    -- Add foreign key to auth.users if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT fk_invoices_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to clients if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT fk_invoices_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key to orders if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT fk_invoices_order_id 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 5: Add UNIQUE constraint on invoice_number
ALTER TABLE invoices 
    ADD CONSTRAINT invoices_invoice_number_unique 
    UNIQUE (invoice_number);

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Step 7: Verify the table was created
SELECT 
    'invoices table created successfully' AS status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;


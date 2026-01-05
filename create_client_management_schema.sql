-- =====================================================
-- CLIENT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Includes: Clients, Orders, Invoices, Payments
-- =====================================================

-- =====================================================
-- 1. CLIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    company_name TEXT,
    tax_id TEXT,
    website TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    default_currency TEXT DEFAULT 'USD',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')) DEFAULT 'pending',
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    shipping_address TEXT,
    delivery_date DATE,
    tracking_number TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;
CREATE POLICY "Users can delete their own orders" ON orders
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    subtotal DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    product_id TEXT,
    sku TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable Row Level Security
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_items (users can access through orders)
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
CREATE POLICY "Users can insert their own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own order items" ON order_items;
CREATE POLICY "Users can update their own order items" ON order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own order items" ON order_items;
CREATE POLICY "Users can delete their own order items" ON order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- =====================================================
-- 4. INVOICES TABLE
-- =====================================================

-- Drop dependent objects first
DROP FUNCTION IF EXISTS update_invoice_payment_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS trigger_update_invoice_payment_status() CASCADE;
DROP FUNCTION IF EXISTS calculate_invoice_totals(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;
DROP TRIGGER IF EXISTS trigger_update_invoice_on_payment ON payments CASCADE;
DROP TRIGGER IF EXISTS trigger_update_invoices_updated_at ON invoices CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON invoices CASCADE;

-- Drop table if it exists (in case of previous failed creation)
DROP TABLE IF EXISTS invoices CASCADE;

-- Create table first without CHECK constraints (add them separately to avoid issues)
CREATE TABLE invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    -- Note: transaction_id is a UUID without foreign key constraint
    -- This allows the schema to work even if transactions table doesn't exist
    -- You can add the foreign key later: ALTER TABLE invoices ADD CONSTRAINT fk_invoices_transaction_id FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
    transaction_id UUID,
    invoice_number TEXT NOT NULL UNIQUE,
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

-- Add CHECK constraints after table creation (to avoid any potential issues)
ALTER TABLE invoices 
    ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'));

ALTER TABLE invoices 
    ADD CONSTRAINT invoices_payment_status_check 
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded'));


-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
CREATE POLICY "Users can delete their own invoices" ON invoices
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. INVOICE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    subtotal DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    product_id TEXT,
    sku TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Enable Row Level Security
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_items (users can access through invoices)
DROP POLICY IF EXISTS "Users can view their own invoice items" ON invoice_items;
CREATE POLICY "Users can view their own invoice items" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own invoice items" ON invoice_items;
CREATE POLICY "Users can insert their own invoice items" ON invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own invoice items" ON invoice_items;
CREATE POLICY "Users can update their own invoice items" ON invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own invoice items" ON invoice_items;
CREATE POLICY "Users can delete their own invoice items" ON invoice_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

-- =====================================================
-- 6. PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    -- Note: transaction_id is a UUID without foreign key constraint
    -- This allows the schema to work even if transactions table doesn't exist
    -- You can add the foreign key later: ALTER TABLE payments ADD CONSTRAINT fk_payments_transaction_id FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
    transaction_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'stripe', 'other')) DEFAULT 'other',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_path TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payments" ON payments;
CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payments" ON payments;
CREATE POLICY "Users can delete their own payments" ON payments
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. TRIGGERS FOR AUTO-NUMBERING
-- =====================================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    sequence_num INTEGER;
    new_order_number TEXT;
BEGIN
    year_prefix := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_prefix || '-%'
    AND user_id = NEW.user_id;
    
    new_order_number := 'ORD-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
    NEW.order_number := new_order_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order number generation
DROP TRIGGER IF EXISTS trigger_generate_order_number ON orders;
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION generate_order_number();

-- Function to generate invoice number - COMMENTED OUT TEMPORARILY
-- CREATE OR REPLACE FUNCTION generate_invoice_number()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     year_prefix TEXT;
--     sequence_num INTEGER;
--     new_invoice_number TEXT;
-- BEGIN
--     year_prefix := TO_CHAR(NOW(), 'YYYY');
--     SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
--     INTO sequence_num FROM invoices WHERE invoice_number LIKE 'INV-' || year_prefix || '-%' AND user_id = NEW.user_id;
--     new_invoice_number := 'INV-' || year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
--     NEW.invoice_number := new_invoice_number;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Trigger for invoice number generation - COMMENTED OUT TEMPORARILY
-- DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON invoices;
-- CREATE TRIGGER trigger_generate_invoice_number
--     BEFORE INSERT ON invoices
--     FOR EACH ROW
--     WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
--     EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;
CREATE TRIGGER trigger_update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;
CREATE TRIGGER trigger_update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_order_items_updated_at ON order_items;
CREATE TRIGGER trigger_update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger - COMMENTED OUT TEMPORARILY
-- DROP TRIGGER IF EXISTS trigger_update_invoices_updated_at ON invoices;
-- CREATE TRIGGER trigger_update_invoices_updated_at
--     BEFORE UPDATE ON invoices
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER trigger_update_invoice_items_updated_at
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. FUNCTIONS FOR CALCULATIONS
-- =====================================================

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals(order_uuid UUID)
RETURNS TABLE (
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    discount_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(oi.subtotal), 0)::DECIMAL(15,2) as subtotal,
        COALESCE(SUM(oi.tax_amount), 0)::DECIMAL(15,2) as tax_amount,
        COALESCE(SUM(oi.discount_amount), 0)::DECIMAL(15,2) as discount_amount,
        COALESCE(SUM(oi.total), 0)::DECIMAL(15,2) as total_amount
    FROM order_items oi
    WHERE oi.order_id = order_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate invoice totals - COMMENTED OUT TEMPORARILY
-- CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_uuid UUID)
-- RETURNS TABLE (subtotal DECIMAL(15,2), tax_amount DECIMAL(15,2), discount_amount DECIMAL(15,2), total_amount DECIMAL(15,2)) AS $$
-- BEGIN
--     RETURN QUERY SELECT COALESCE(SUM(ii.subtotal), 0)::DECIMAL(15,2), COALESCE(SUM(ii.tax_amount), 0)::DECIMAL(15,2),
--         COALESCE(SUM(ii.discount_amount), 0)::DECIMAL(15,2), COALESCE(SUM(ii.total), 0)::DECIMAL(15,2)
--     FROM invoice_items ii WHERE ii.invoice_id = invoice_uuid;
-- END;
-- $$ LANGUAGE plpgsql;

-- Function to update invoice payment status
-- COMMENTED OUT TEMPORARILY - Create manually after schema is set up
-- CREATE OR REPLACE FUNCTION update_invoice_payment_status(invoice_uuid UUID)
-- RETURNS VOID AS $$
-- DECLARE
--     invoice_total DECIMAL(15,2);
--     paid_total DECIMAL(15,2);
--     new_payment_status TEXT;
-- BEGIN
--     SELECT total_amount INTO invoice_total FROM invoices WHERE id = invoice_uuid;
--     SELECT COALESCE(SUM(amount), 0) INTO paid_total FROM payments WHERE invoice_id = invoice_uuid;
--     IF paid_total = 0 THEN new_payment_status := 'unpaid';
--     ELSIF paid_total >= invoice_total THEN new_payment_status := 'paid';
--     ELSE new_payment_status := 'partial'; END IF;
--     UPDATE invoices SET payment_status = new_payment_status, paid_amount = paid_total,
--         paid_date = CASE WHEN new_payment_status = 'paid' THEN CURRENT_DATE ELSE NULL END
--     WHERE id = invoice_uuid;
-- END;
-- $$ LANGUAGE plpgsql;

-- Trigger function - COMMENTED OUT TEMPORARILY
-- CREATE OR REPLACE FUNCTION trigger_update_invoice_payment_status()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'DELETE' THEN PERFORM update_invoice_payment_status(OLD.invoice_id); RETURN OLD;
--     ELSE PERFORM update_invoice_payment_status(NEW.invoice_id); RETURN NEW; END IF;
-- END;
-- $$ LANGUAGE plpgsql;

-- Trigger - COMMENTED OUT TEMPORARILY  
-- DROP TRIGGER IF EXISTS trigger_update_invoice_on_payment ON payments;
-- CREATE TRIGGER trigger_update_invoice_on_payment AFTER INSERT OR UPDATE OR DELETE ON payments
--     FOR EACH ROW EXECUTE FUNCTION trigger_update_invoice_payment_status();

-- =====================================================
-- 10. FUNCTION TO UPDATE INVOICE OVERDUE STATUS
-- =====================================================

-- NOTE: This function is commented out to avoid creation errors
-- You can create it manually after the schema is set up by running:
-- 
-- CREATE OR REPLACE FUNCTION update_overdue_invoices()
-- RETURNS INTEGER AS $$
-- DECLARE
--     updated_count INTEGER;
-- BEGIN
--     UPDATE invoices
--     SET status = 'overdue'
--     WHERE status IN ('sent', 'draft')
--     AND payment_status != 'paid'
--     AND due_date < CURRENT_DATE;
--     
--     GET DIAGNOSTICS updated_count = ROW_COUNT;
--     RETURN updated_count;
-- END;
-- $$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================


-- Add installment fields to lend_borrow table
ALTER TABLE lend_borrow 
ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installment_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS installment_frequency TEXT DEFAULT 'monthly' CHECK (installment_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
ADD COLUMN IF NOT EXISTS next_installment_date DATE;

-- Create installments table for tracking individual payments
CREATE TABLE IF NOT EXISTS lend_borrow_installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lend_borrow_id UUID NOT NULL REFERENCES lend_borrow(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_installments_lend_borrow_id ON lend_borrow_installments(lend_borrow_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON lend_borrow_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON lend_borrow_installments(status);

-- Create updated_at trigger for installments
CREATE OR REPLACE FUNCTION update_installments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_installments_updated_at
    BEFORE UPDATE ON lend_borrow_installments
    FOR EACH ROW
    EXECUTE FUNCTION update_installments_updated_at();

-- Enable RLS for installments table
ALTER TABLE lend_borrow_installments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for installments
CREATE POLICY "Users can view their own installments" ON lend_borrow_installments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lend_borrow 
            WHERE lend_borrow.id = lend_borrow_installments.lend_borrow_id 
            AND lend_borrow.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own installments" ON lend_borrow_installments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lend_borrow 
            WHERE lend_borrow.id = lend_borrow_installments.lend_borrow_id 
            AND lend_borrow.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own installments" ON lend_borrow_installments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lend_borrow 
            WHERE lend_borrow.id = lend_borrow_installments.lend_borrow_id 
            AND lend_borrow.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own installments" ON lend_borrow_installments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lend_borrow 
            WHERE lend_borrow.id = lend_borrow_installments.lend_borrow_id 
            AND lend_borrow.user_id = auth.uid()
        )
    );

-- Function to create installments for a lend/borrow record
CREATE OR REPLACE FUNCTION create_installments_for_lend_borrow(
    p_lend_borrow_id UUID,
    p_installment_count INTEGER,
    p_installment_amount DECIMAL(15,2),
    p_frequency TEXT,
    p_start_date DATE
)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    current_date DATE;
    interval_value INTERVAL;
BEGIN
    -- Delete existing installments for this record
    DELETE FROM lend_borrow_installments WHERE lend_borrow_id = p_lend_borrow_id;
    
    -- Set interval based on frequency
    CASE p_frequency
        WHEN 'weekly' THEN interval_value := INTERVAL '1 week';
        WHEN 'biweekly' THEN interval_value := INTERVAL '2 weeks';
        WHEN 'monthly' THEN interval_value := INTERVAL '1 month';
        WHEN 'quarterly' THEN interval_value := INTERVAL '3 months';
        WHEN 'yearly' THEN interval_value := INTERVAL '1 year';
        ELSE interval_value := INTERVAL '1 month';
    END CASE;
    
    current_date := p_start_date;
    
    -- Create installments
    FOR i IN 1..p_installment_count LOOP
        INSERT INTO lend_borrow_installments (
            lend_borrow_id,
            installment_number,
            due_date,
            amount,
            status
        ) VALUES (
            p_lend_borrow_id,
            i,
            current_date,
            p_installment_amount,
            'pending'
        );
        
        current_date := current_date + interval_value;
    END LOOP;
    
    -- Update the lend_borrow record
    UPDATE lend_borrow 
    SET 
        is_installment = TRUE,
        installment_count = p_installment_count,
        installment_amount = p_installment_amount,
        installment_frequency = p_frequency,
        next_installment_date = p_start_date
    WHERE id = p_lend_borrow_id;
END;
$$ LANGUAGE plpgsql; 
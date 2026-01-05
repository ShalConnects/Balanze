-- Check which client management tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('clients', 'orders', 'order_items', 'invoices', 'invoice_items', 'payments') 
        THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('clients', 'orders', 'order_items', 'invoices', 'invoice_items', 'payments')
ORDER BY 
    CASE table_name
        WHEN 'clients' THEN 1
        WHEN 'orders' THEN 2
        WHEN 'order_items' THEN 3
        WHEN 'invoices' THEN 4
        WHEN 'invoice_items' THEN 5
        WHEN 'payments' THEN 6
    END;


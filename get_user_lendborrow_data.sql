-- Get lend/borrow data for salauddin.kader406@gmail.com
-- Run this in Supabase SQL Editor

SELECT 
    lb.type,
    lb.person_name,
    lb.amount,
    lb.currency,
    lb.status,
    lb.due_date,
    lb.notes
FROM lend_borrow lb
WHERE lb.user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53'
ORDER BY lb.status, lb.type, lb.created_at DESC;

-- Summary query
SELECT 
    COUNT(*) FILTER (WHERE status = 'active' AND (type = 'lent' OR type = 'lend')) as active_lent_count,
    COUNT(*) FILTER (WHERE status = 'active' AND (type = 'borrowed' OR type = 'borrow')) as active_borrowed_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'active' AND (type = 'lent' OR type = 'lend') AND currency = 'USD'), 0) as total_lent_usd,
    COALESCE(SUM(amount) FILTER (WHERE status = 'active' AND (type = 'lent' OR type = 'lend') AND currency = 'BDT'), 0) as total_lent_bdt,
    COALESCE(SUM(amount) FILTER (WHERE status = 'active' AND (type = 'borrowed' OR type = 'borrow') AND currency = 'USD'), 0) as total_borrowed_usd,
    COALESCE(SUM(amount) FILTER (WHERE status = 'active' AND (type = 'borrowed' OR type = 'borrow') AND currency = 'BDT'), 0) as total_borrowed_bdt
FROM lend_borrow
WHERE user_id = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';


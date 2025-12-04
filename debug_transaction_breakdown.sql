-- Debug the transaction breakdown to see what the 25 other transactions are
-- This will show us the transaction types and tags

SELECT 
    'Transaction Breakdown' as check_type,
    tags,
    COUNT(*) as count,
    'Regular transactions (count toward 25 limit)' as description
FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5'
  AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)::DATE
  AND NOT ('purchase' = ANY(tags))
GROUP BY tags
ORDER BY count DESC;

-- Also check transactions with no tags
SELECT 
    'Transactions with no tags' as check_type,
    COUNT(*) as count,
    'These might be regular transactions' as description
FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5'
  AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)::DATE
  AND tags IS NULL;

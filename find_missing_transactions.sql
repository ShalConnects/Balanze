-- Find the missing 25 transactions
-- This will show us all transaction types and their counts

SELECT 
    'All Transaction Types' as check_type,
    COALESCE(tags::text, 'NULL') as tags_display,
    COUNT(*) as count,
    CASE 
        WHEN tags IS NULL THEN 'NULL tags'
        WHEN array_length(tags, 1) IS NULL OR array_length(tags, 1) = 0 THEN 'Empty array tags'
        WHEN 'purchase' = ANY(tags) THEN 'Purchase transactions'
        ELSE 'Other tagged transactions'
    END as transaction_type
FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5'
  AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)::DATE
GROUP BY tags
ORDER BY count DESC;

-- Also check if there are any transactions with NULL tags
SELECT 
    'NULL Tags Check' as check_type,
    COUNT(*) as null_tag_count
FROM transactions 
WHERE user_id = '0d497c5c-3242-425e-aa73-1081385f46e5'
  AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)::DATE
  AND tags IS NULL;

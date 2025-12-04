-- Check old audit logs to see the timezone issue

-- Get recent audit logs with their raw timestamps
SELECT 
    id,
    action_type,
    entity_type,
    created_at,
    'Raw timestamp: ' || created_at::text as raw_timestamp,
    'Timezone offset: ' || EXTRACT(timezone FROM created_at) as timezone_offset,
    'Is UTC: ' || CASE WHEN EXTRACT(timezone FROM created_at) = 0 THEN 'YES' ELSE 'NO' END as is_utc
FROM audit_logs 
WHERE entity_type = 'transaction' 
ORDER BY created_at DESC 
LIMIT 10;

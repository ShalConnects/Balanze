-- Simple debug - get the key info we need

-- 1. Check database timezone
SELECT current_setting('timezone') as db_timezone, NOW() as current_time;

-- 2. Check recent audit logs
SELECT 
    action_type,
    created_at,
    EXTRACT(timezone FROM created_at) as timezone_offset
FROM audit_logs 
WHERE entity_type = 'transaction' 
ORDER BY created_at DESC 
LIMIT 3;

-- 3. Check the test audit log we just created
SELECT 
    action_type,
    created_at,
    EXTRACT(timezone FROM created_at) as timezone_offset
FROM audit_logs 
WHERE id = 'd4d79727-5023-4014-8189-ec2f9a522f77';

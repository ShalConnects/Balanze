-- Debug timezone issue - let's see what's actually happening

-- 1. Check current database timezone settings
SELECT 
    'Database timezone: ' || current_setting('timezone') as info,
    'Current time: ' || NOW() as current_time,
    'UTC time: ' || TIMEZONE('utc'::text, NOW()) as utc_time;

-- 2. Check the audit_logs table structure
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND column_name = 'created_at';

-- 3. Check recent audit logs and their timestamps
SELECT 
    id,
    action_type,
    entity_type,
    created_at,
    'Raw created_at: ' || created_at::text as raw_timestamp,
    'Created at timezone: ' || EXTRACT(timezone FROM created_at) as timezone_offset
FROM audit_logs 
WHERE entity_type = 'transaction' 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if the log_audit_event function exists and what it does
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'log_audit_event';

-- 5. Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'transactions' 
AND trigger_name LIKE '%audit%';

-- 6. Test creating a new audit log manually
SELECT 'Testing manual audit log creation...' as test;

-- This should create a test audit log with current UTC time
SELECT log_audit_event(
    'test',
    'system',
    gen_random_uuid(),
    NULL,
    '{"test": "timezone_debug"}'::jsonb,
    '{"message": "Testing timezone fix"}'::jsonb,
    'low'
) as test_audit_log_id;

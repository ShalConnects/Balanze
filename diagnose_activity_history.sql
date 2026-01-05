-- =====================================================
-- DIAGNOSTIC: Check activity_history records
-- Run this to see what's actually in the table
-- =====================================================

-- Check recent activity_history records
SELECT 
    id,
    user_id,
    activity_type,
    entity_type,
    entity_id,
    created_at,
    CASE 
        WHEN details IS NOT NULL THEN 'Has details'
        WHEN changes IS NOT NULL THEN 'Has changes'
        ELSE 'No data'
    END as data_column
FROM activity_history
WHERE entity_type IN ('client_tasks', 'task', 'client_task', 'clients', 'invoices', 'client')
ORDER BY created_at DESC
LIMIT 20;

-- Check if records exist for tasks (mapped from client_tasks)
SELECT 
    entity_type,
    COUNT(*) as count
FROM activity_history
WHERE entity_type IN ('client_tasks', 'task', 'client_task')
GROUP BY entity_type;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_history'
ORDER BY ordinal_position;


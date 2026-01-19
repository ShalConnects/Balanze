-- =====================================================
-- CHECK USER ACTIVITY
-- =====================================================
-- This query checks activity for a specific user across all activity tracking tables
-- User ID: e3c3fcd4-f7e6-402d-b697-0c46653427d4

-- Set the user ID as a variable for easy modification
DO $$
DECLARE
    target_user_id UUID := 'e3c3fcd4-f7e6-402d-b697-0c46653427d4';
    target_user_id_text TEXT := 'e3c3fcd4-f7e6-402d-b697-0c46653427d4';
BEGIN
    RAISE NOTICE '=== Checking activity for user: % ===', target_user_id;
END $$;

-- =====================================================
-- 1. USER_ACTIVITY TABLE (Achievement/Activity Tracking)
-- =====================================================
SELECT 
    'user_activity' as source_table,
    id,
    user_id,
    activity_type,
    activity_data,
    created_at
FROM user_activity
WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID
ORDER BY created_at DESC
LIMIT 100;

-- Summary count by activity type
SELECT 
    'user_activity' as source_table,
    activity_type,
    COUNT(*) as count,
    MIN(created_at) as first_activity,
    MAX(created_at) as last_activity
FROM user_activity
WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID
GROUP BY activity_type
ORDER BY count DESC;

-- =====================================================
-- 2. ACTIVITY_HISTORY TABLE (Unified History System)
-- =====================================================
-- Note: activity_history uses TEXT for user_id, so we need to match as TEXT
SELECT 
    'activity_history' as source_table,
    id,
    user_id,
    activity_type,
    entity_type,
    entity_id,
    description,
    changes,
    created_at
FROM activity_history
WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'
ORDER BY created_at DESC
LIMIT 100;

-- Summary count by activity type
SELECT 
    'activity_history' as source_table,
    activity_type,
    entity_type,
    COUNT(*) as count,
    MIN(created_at) as first_activity,
    MAX(created_at) as last_activity
FROM activity_history
WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'
GROUP BY activity_type, entity_type
ORDER BY count DESC;

-- =====================================================
-- 3. AUDIT_LOGS TABLE (Comprehensive Audit Logging)
-- =====================================================
SELECT 
    'audit_logs' as source_table,
    id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata,
    ip_address,
    user_agent,
    session_id,
    severity,
    created_at
FROM audit_logs
WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID
ORDER BY created_at DESC
LIMIT 100;

-- Summary count by action type and entity type
SELECT 
    'audit_logs' as source_table,
    action_type,
    entity_type,
    severity,
    COUNT(*) as count,
    MIN(created_at) as first_activity,
    MAX(created_at) as last_activity
FROM audit_logs
WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID
GROUP BY action_type, entity_type, severity
ORDER BY count DESC;

-- =====================================================
-- 4. COMBINED ACTIVITY VIEW (All Sources)
-- =====================================================
-- Combined view showing all activity from all sources, ordered by date
(
    SELECT 
        'user_activity' as source_table,
        id::TEXT as record_id,
        user_id::TEXT as user_id,
        activity_type::TEXT as activity_type,
        NULL::TEXT as entity_type,
        NULL::TEXT as entity_id,
        NULL::TEXT as description,
        activity_data::TEXT as details,
        created_at::TIMESTAMP WITH TIME ZONE as created_at,
        NULL::TEXT as severity
    FROM user_activity
    WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID
)
UNION ALL
(
    SELECT 
        'activity_history' as source_table,
        id::TEXT as record_id,
        user_id::TEXT as user_id,
        activity_type::TEXT as activity_type,
        entity_type::TEXT as entity_type,
        entity_id::TEXT as entity_id,
        description::TEXT as description,
        changes::TEXT as details,
        created_at::TIMESTAMP WITH TIME ZONE as created_at,
        NULL::TEXT as severity
    FROM activity_history
    WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'
)
UNION ALL
(
    SELECT 
        'audit_logs' as source_table,
        id::TEXT as record_id,
        user_id::TEXT as user_id,
        action_type::TEXT as activity_type,
        entity_type::TEXT as entity_type,
        COALESCE(entity_id::TEXT, NULL::TEXT) as entity_id,
        NULL::TEXT as description,
        COALESCE(metadata::TEXT, new_values::TEXT, '{}'::TEXT) as details,
        created_at::TIMESTAMP WITH TIME ZONE as created_at,
        COALESCE(severity::TEXT, NULL::TEXT) as severity
    FROM audit_logs
    WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID
)
ORDER BY created_at DESC
LIMIT 200;

-- =====================================================
-- 5. OVERALL SUMMARY STATISTICS
-- =====================================================
SELECT 
    'SUMMARY' as info,
    (SELECT COUNT(*) FROM user_activity WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID) as user_activity_count,
    (SELECT COUNT(*) FROM activity_history WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4') as activity_history_count,
    (SELECT COUNT(*) FROM audit_logs WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID) as audit_logs_count,
    (SELECT MIN(created_at) FROM user_activity WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID) as first_user_activity,
    (SELECT MAX(created_at) FROM user_activity WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID) as last_user_activity,
    (SELECT MIN(created_at) FROM activity_history WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4') as first_history_activity,
    (SELECT MAX(created_at) FROM activity_history WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4') as last_history_activity,
    (SELECT MIN(created_at) FROM audit_logs WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID) as first_audit_activity,
    (SELECT MAX(created_at) FROM audit_logs WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID) as last_audit_activity;

-- =====================================================
-- 6. RECENT ACTIVITY (Last 7 Days) - All Sources
-- =====================================================
(
    SELECT 
        'user_activity'::TEXT as source_table,
        created_at::TIMESTAMP WITH TIME ZONE as created_at,
        activity_type::TEXT as activity_type,
        activity_data::TEXT as details
    FROM user_activity
    WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID
    AND created_at >= NOW() - INTERVAL '7 days'
)
UNION ALL
(
    SELECT 
        'activity_history'::TEXT as source_table,
        created_at::TIMESTAMP WITH TIME ZONE as created_at,
        activity_type::TEXT as activity_type,
        COALESCE(description::TEXT, '') as details
    FROM activity_history
    WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'
    AND created_at >= NOW() - INTERVAL '7 days'
)
UNION ALL
(
    SELECT 
        'audit_logs'::TEXT as source_table,
        created_at::TIMESTAMP WITH TIME ZONE as created_at,
        action_type::TEXT as activity_type,
        COALESCE(entity_type || ' - ' || COALESCE(metadata->>'account_name', metadata->>'amount', ''), '')::TEXT as details
    FROM audit_logs
    WHERE user_id = 'e3c3fcd4-f7e6-402d-b697-0c46653427d4'::UUID
    AND created_at >= NOW() - INTERVAL '7 days'
)
ORDER BY created_at DESC;

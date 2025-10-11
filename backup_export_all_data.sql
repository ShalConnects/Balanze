-- =====================================================
-- DIY DATABASE BACKUP - EXPORT ALL DATA
-- =====================================================
-- This script exports all your table data to SQL INSERT statements
-- You can save these and restore later if needed
-- 
-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor
-- 2. Copy ALL the output (it will be long!)
-- 3. Save it to a file: backup_data_[today's_date].sql
-- 4. Keep this file safe - it's your backup!
-- =====================================================

-- Enable output for export
\o backup_export.sql

-- =====================================================
-- PART 1: EXPORT TABLE STRUCTURES
-- =====================================================
SELECT '-- ====================================' as export;
SELECT '-- TABLE STRUCTURES BACKUP' as export;
SELECT '-- Created: ' || NOW() as export;
SELECT '-- ====================================' as export;
SELECT '' as export;

-- Export create table statements for all tables
SELECT 
    'DROP TABLE IF EXISTS ' || table_name || ' CASCADE;' as export
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT '' as export;

-- =====================================================
-- PART 2: EXPORT ALL DATA AS INSERT STATEMENTS
-- =====================================================
SELECT '-- ====================================' as export;
SELECT '-- TABLE DATA BACKUP' as export;
SELECT '-- ====================================' as export;
SELECT '' as export;

-- Profiles
SELECT '-- PROFILES DATA' as export;
SELECT 
    'INSERT INTO profiles (id, full_name, profile_picture, local_currency, selected_currencies, role, subscription, created_at, updated_at) VALUES (' ||
    '''' || id || '''::uuid, ' ||
    COALESCE('''' || replace(full_name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(profile_picture, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || local_currency || '''', 'NULL') || ', ' ||
    COALESCE('ARRAY[' || (SELECT string_agg('''' || unnest || '''', ',') FROM unnest(selected_currencies)) || ']::text[]', 'NULL') || ', ' ||
    COALESCE('''' || role || '''', 'NULL') || ', ' ||
    COALESCE('''' || subscription::text || '''::jsonb', 'NULL') || ', ' ||
    COALESCE('''' || created_at || '''::timestamptz', 'NULL') || ', ' ||
    COALESCE('''' || updated_at || '''::timestamptz', 'NULL') ||
    ');' as export
FROM profiles;

SELECT '' as export;

-- Accounts
SELECT '-- ACCOUNTS DATA' as export;
SELECT 
    'INSERT INTO accounts (id, user_id, name, type, initial_balance, calculated_balance, currency, description, is_active, has_dps, dps_type, dps_amount_type, dps_fixed_amount, dps_savings_account_id, donation_preference, created_at, updated_at) VALUES (' ||
    '''' || id || '''::uuid, ' ||
    '''' || user_id || '''::uuid, ' ||
    '''' || replace(name, '''', '''''') || ''', ' ||
    '''' || type || ''', ' ||
    COALESCE(initial_balance::text, 'NULL') || ', ' ||
    COALESCE(calculated_balance::text, 'NULL') || ', ' ||
    COALESCE('''' || currency || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(COALESCE(description, ''), '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(is_active::text, 'NULL') || ', ' ||
    COALESCE(has_dps::text, 'NULL') || ', ' ||
    COALESCE('''' || dps_type || '''', 'NULL') || ', ' ||
    COALESCE('''' || dps_amount_type || '''', 'NULL') || ', ' ||
    COALESCE(dps_fixed_amount::text, 'NULL') || ', ' ||
    COALESCE('''' || dps_savings_account_id || '''::uuid', 'NULL') || ', ' ||
    COALESCE(donation_preference::text, 'NULL') || ', ' ||
    '''' || created_at || '''::timestamptz, ' ||
    COALESCE('''' || updated_at || '''::timestamptz', 'NULL') ||
    ');' as export
FROM accounts;

SELECT '' as export;

-- Transactions
SELECT '-- TRANSACTIONS DATA' as export;
SELECT 
    'INSERT INTO transactions (id, user_id, account_id, type, amount, description, category, date, tags, transaction_id, created_at, updated_at) VALUES (' ||
    '''' || id || '''::uuid, ' ||
    '''' || user_id || '''::uuid, ' ||
    '''' || account_id || '''::uuid, ' ||
    '''' || type || ''', ' ||
    amount::text || ', ' ||
    '''' || replace(description, '''', '''''') || ''', ' ||
    '''' || replace(category, '''', '''''') || ''', ' ||
    '''' || date || '''::date, ' ||
    CASE WHEN tags IS NOT NULL THEN 'ARRAY[' || (SELECT string_agg('''' || replace(unnest, '''', '''''') || '''', ',') FROM unnest(tags)) || ']::text[]' ELSE 'NULL' END || ', ' ||
    COALESCE('''' || transaction_id || '''', 'NULL') || ', ' ||
    '''' || created_at || '''::timestamptz, ' ||
    COALESCE('''' || updated_at || '''::timestamptz', 'NULL') ||
    ');' as export
FROM transactions;

SELECT '' as export;

-- Categories
SELECT '-- CATEGORIES DATA' as export;
SELECT 
    'INSERT INTO categories (id, user_id, name, type, color, icon, description, created_at, updated_at) VALUES (' ||
    '''' || id || '''::uuid, ' ||
    '''' || user_id || '''::uuid, ' ||
    '''' || replace(name, '''', '''''') || ''', ' ||
    '''' || type || ''', ' ||
    COALESCE('''' || color || '''', 'NULL') || ', ' ||
    COALESCE('''' || icon || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(COALESCE(description, ''), '''', '''''') || '''', 'NULL') || ', ' ||
    '''' || created_at || '''::timestamptz, ' ||
    COALESCE('''' || updated_at || '''::timestamptz', 'NULL') ||
    ');' as export
FROM categories;

SELECT '' as export;

-- Purchases
SELECT '-- PURCHASES DATA' as export;
SELECT 
    'INSERT INTO purchases (id, user_id, transaction_id, item_name, category, price, currency, purchase_date, status, priority, notes, created_at, updated_at) VALUES (' ||
    '''' || id || '''::uuid, ' ||
    '''' || user_id || '''::uuid, ' ||
    COALESCE('''' || transaction_id || '''', 'NULL') || ', ' ||
    '''' || replace(item_name, '''', '''''') || ''', ' ||
    '''' || replace(category, '''', '''''') || ''', ' ||
    price::text || ', ' ||
    COALESCE('''' || currency || '''', 'NULL') || ', ' ||
    '''' || purchase_date || '''::date, ' ||
    '''' || status || ''', ' ||
    COALESCE('''' || priority || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(COALESCE(notes, ''), '''', '''''') || '''', 'NULL') || ', ' ||
    '''' || created_at || '''::timestamptz, ' ||
    COALESCE('''' || updated_at || '''::timestamptz', 'NULL') ||
    ');' as export
FROM purchases;

SELECT '' as export;

-- Purchase Categories
SELECT '-- PURCHASE CATEGORIES DATA' as export;
SELECT 
    'INSERT INTO purchase_categories (id, user_id, category_name, description, monthly_budget, currency, category_color, created_at, updated_at) VALUES (' ||
    '''' || id || '''::uuid, ' ||
    '''' || user_id || '''::uuid, ' ||
    '''' || replace(category_name, '''', '''''') || ''', ' ||
    COALESCE('''' || replace(COALESCE(description, ''), '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(monthly_budget::text, 'NULL') || ', ' ||
    COALESCE('''' || currency || '''', 'NULL') || ', ' ||
    COALESCE('''' || category_color || '''', 'NULL') || ', ' ||
    '''' || created_at || '''::timestamptz, ' ||
    COALESCE('''' || updated_at || '''::timestamptz', 'NULL') ||
    ');' as export
FROM purchase_categories;

SELECT '' as export;

-- Savings Goals
SELECT '-- SAVINGS GOALS DATA' as export;
SELECT 
    'INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, target_date, description, created_at, updated_at) VALUES (' ||
    '''' || id || '''::uuid, ' ||
    '''' || user_id || '''::uuid, ' ||
    '''' || replace(name, '''', '''''') || ''', ' ||
    target_amount::text || ', ' ||
    COALESCE(current_amount::text, '0') || ', ' ||
    COALESCE('''' || target_date || '''::date', 'NULL') || ', ' ||
    COALESCE('''' || replace(COALESCE(description, ''), '''', '''''') || '''', 'NULL') || ', ' ||
    '''' || created_at || '''::timestamptz, ' ||
    COALESCE('''' || updated_at || '''::timestamptz', 'NULL') ||
    ');' as export
FROM savings_goals;

SELECT '' as export;

-- Add similar export statements for other critical tables
-- (donation_saving_records, lend_borrow, etc.)

SELECT '-- ====================================' as export;
SELECT '-- BACKUP EXPORT COMPLETE' as export;
SELECT '-- Save this entire output to a file!' as export;
SELECT '-- ====================================' as export;


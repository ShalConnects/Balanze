-- TEST SIMPLE INSERT WITHOUT TRIGGERS
-- This will help us identify if the issue is with the triggers or the basic insert

-- First, let's try a simple insert without any triggers
-- We'll temporarily disable triggers
SET session_replication_role = replica;

-- Try to insert a simple record
INSERT INTO lend_borrow (
    user_id, 
    type, 
    person_name, 
    amount, 
    currency, 
    account_id, 
    affect_account_balance
) VALUES (
    '0d497c5c-3242-425e-aa73-1081385f46e5',
    'lend',
    'Test Person',
    100.00,
    'BDT',
    'c57ae4eb-e603-42ee-adb6-3886706c4cce',
    true
);

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Check if the record was inserted
SELECT * FROM lend_borrow WHERE person_name = 'Test Person';

-- Clean up test record
DELETE FROM lend_borrow WHERE person_name = 'Test Person';

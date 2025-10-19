-- Simple Query to Show Migrated Records with Details
-- This will show all migrated records with their basic information

SELECT 
    lb.id as record_id,
    lb.type as record_type,
    lb.person_name,
    lb.amount,
    lb.currency,
    lb.status,
    lb.transaction_id,
    a.name as account_name,
    lb.due_date,
    lb.created_at,
    t.description as transaction_description
FROM lend_borrow lb
JOIN accounts a ON lb.account_id = a.id
JOIN transactions t ON lb.transaction_id = t.transaction_id
WHERE lb.account_id IS NOT NULL 
AND lb.transaction_id IS NOT NULL
ORDER BY lb.created_at DESC;

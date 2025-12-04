-- Drop existing foreign key constraint
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;

-- Add new foreign key constraint with CASCADE DELETE
ALTER TABLE transactions
ADD CONSTRAINT transactions_account_id_fkey
FOREIGN KEY (account_id)
REFERENCES accounts(id)
ON DELETE CASCADE; 
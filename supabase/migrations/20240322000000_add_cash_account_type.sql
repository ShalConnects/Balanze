-- Add cash account type to the type check constraint
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check 
  CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash')); 
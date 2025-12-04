CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  from_account_id uuid REFERENCES accounts(id),
  to_account_id uuid REFERENCES accounts(id),
  from_amount numeric,
  from_currency text,
  to_amount numeric,
  to_currency text,
  exchange_rate numeric,
  note text,
  created_at timestamp with time zone DEFAULT now()
); 
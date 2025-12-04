-- 1. Add purchase_id column to purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS purchase_id VARCHAR(8);

-- 2. Populate purchase_id with the current transaction_id (adjust if you want a different mapping)
UPDATE purchases SET purchase_id = transaction_id WHERE purchase_id IS NULL;

-- 3. Enforce uniqueness on purchase_id
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_purchase_id_key;
ALTER TABLE purchases ADD CONSTRAINT purchases_purchase_id_key UNIQUE (purchase_id);

-- 4. Add purchase_id column to purchase_attachments if it doesn't exist
ALTER TABLE purchase_attachments ADD COLUMN IF NOT EXISTS purchase_id VARCHAR(8);

-- 5. Drop old foreign key if it exists
ALTER TABLE purchase_attachments DROP CONSTRAINT IF EXISTS purchase_attachments_purchase_id_fkey;

-- 6. Add new foreign key referencing purchases.purchase_id
ALTER TABLE purchase_attachments
  ADD CONSTRAINT purchase_attachments_purchase_id_fkey
  FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id); 
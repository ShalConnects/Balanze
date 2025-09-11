-- Dummy Data for Balanze Dashboard
-- User ID: 930e2f8d-1baa-42ce-b1a7-4ace3ac7285d

-- First, let's insert some accounts (if they don't exist)
INSERT INTO accounts (id, user_id, name, type, initial_balance, calculated_balance, currency, is_active, created_at, description, has_dps, dps_type, dps_amount_type, dps_fixed_amount, dps_savings_account_id, donation_preference)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Main Checking', 'checking', 5000.00, 5000.00, 'USD', true, NOW(), 'Primary checking account', false, null, null, null, null, 10),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Savings Account', 'savings', 15000.00, 15000.00, 'USD', true, NOW(), 'Emergency fund and savings', false, null, null, null, null, 5),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Credit Card', 'credit', 0.00, -2500.00, 'USD', true, NOW(), 'Main credit card', false, null, null, null, null, null),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Investment Portfolio', 'investment', 25000.00, 25000.00, 'USD', true, NOW(), 'Stock and bond investments', false, null, null, null, null, null)
ON CONFLICT (id) DO NOTHING;

-- Insert categories (if they don't exist)
INSERT INTO categories (id, name, type, color, icon)
VALUES 
  ('cat-001', 'Salary', 'income', '#10B981', 'briefcase'),
  ('cat-002', 'Freelance', 'income', '#3B82F6', 'laptop'),
  ('cat-003', 'Investment Returns', 'income', '#8B5CF6', 'trending-up'),
  ('cat-004', 'Food & Dining', 'expense', '#EF4444', 'utensils'),
  ('cat-005', 'Transportation', 'expense', '#F59E0B', 'car'),
  ('cat-006', 'Shopping', 'expense', '#EC4899', 'shopping-bag'),
  ('cat-007', 'Utilities', 'expense', '#06B6D4', 'zap'),
  ('cat-008', 'Entertainment', 'expense', '#8B5CF6', 'film'),
  ('cat-009', 'Healthcare', 'expense', '#10B981', 'heart'),
  ('cat-010', 'Education', 'expense', '#3B82F6', 'book-open')
ON CONFLICT (id) DO NOTHING;

-- Insert purchase categories
INSERT INTO purchase_categories (id, user_id, category_name, description, monthly_budget, category_color, created_at, updated_at)
VALUES 
  ('pc-001', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Electronics', 'Gadgets and tech items', 500.00, '#3B82F6', NOW(), NOW()),
  ('pc-002', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Home & Garden', 'Furniture and home improvement', 300.00, '#10B981', NOW(), NOW()),
  ('pc-003', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Fashion', 'Clothing and accessories', 200.00, '#EC4899', NOW(), NOW()),
  ('pc-004', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Books', 'Books and educational materials', 100.00, '#8B5CF6', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert transactions for the last 6 months (for monthly trends chart)
-- January 2024
INSERT INTO transactions (id, user_id, account_id, type, amount, description, date, category, is_recurring, recurring_frequency, saving_amount, donation_amount, created_at, tags)
VALUES 
  ('t-001', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 5000.00, 'Monthly Salary', '2024-01-15', 'Salary', true, 'monthly', 500.00, null, '2024-01-15', null),
  ('t-002', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 1200.00, 'Freelance Project', '2024-01-20', 'Freelance', false, null, 120.00, null, '2024-01-20', null),
  ('t-003', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 800.00, 'Grocery Shopping', '2024-01-05', 'Food & Dining', false, null, null, null, '2024-01-05', null),
  ('t-004', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 150.00, 'Gas Station', '2024-01-10', 'Transportation', false, null, null, null, '2024-01-10', null),
  ('t-005', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 300.00, 'Online Shopping', '2024-01-12', 'Shopping', false, null, null, null, '2024-01-12', null);

-- February 2024
INSERT INTO transactions (id, user_id, account_id, type, amount, description, date, category, is_recurring, recurring_frequency, saving_amount, donation_amount, created_at, tags)
VALUES 
  ('t-006', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 5000.00, 'Monthly Salary', '2024-02-15', 'Salary', true, 'monthly', 500.00, null, '2024-02-15', null),
  ('t-007', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 750.00, 'Grocery Shopping', '2024-02-05', 'Food & Dining', false, null, null, null, '2024-02-05', null),
  ('t-008', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 200.00, 'Movie Theater', '2024-02-14', 'Entertainment', false, null, null, null, '2024-02-14', null),
  ('t-009', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 120.00, 'Electric Bill', '2024-02-20', 'Utilities', true, 'monthly', null, null, '2024-02-20', null);

-- March 2024
INSERT INTO transactions (id, user_id, account_id, type, amount, description, date, category, is_recurring, recurring_frequency, saving_amount, donation_amount, created_at, tags)
VALUES 
  ('t-010', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 5000.00, 'Monthly Salary', '2024-03-15', 'Salary', true, 'monthly', 500.00, null, '2024-03-15', null),
  ('t-011', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 800.00, 'Freelance Project', '2024-03-25', 'Freelance', false, null, 80.00, null, '2024-03-25', null),
  ('t-012', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 900.00, 'Grocery Shopping', '2024-03-05', 'Food & Dining', false, null, null, null, '2024-03-05', null),
  ('t-013', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 400.00, 'Clothing Store', '2024-03-10', 'Shopping', false, null, null, null, '2024-03-10', null),
  ('t-014', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 250.00, 'Doctor Visit', '2024-03-18', 'Healthcare', false, null, null, null, '2024-03-18', null);

-- April 2024
INSERT INTO transactions (id, user_id, account_id, type, amount, description, date, category, is_recurring, recurring_frequency, saving_amount, donation_amount, created_at, tags)
VALUES 
  ('t-015', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 5000.00, 'Monthly Salary', '2024-04-15', 'Salary', true, 'monthly', 500.00, null, '2024-04-15', null),
  ('t-016', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 1500.00, 'Freelance Project', '2024-04-20', 'Freelance', false, null, 150.00, null, '2024-04-20', null),
  ('t-017', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 850.00, 'Grocery Shopping', '2024-04-05', 'Food & Dining', false, null, null, null, '2024-04-05', null),
  ('t-018', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 180.00, 'Gas Station', '2024-04-12', 'Transportation', false, null, null, null, '2024-04-12', null),
  ('t-019', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 600.00, 'Online Shopping', '2024-04-15', 'Shopping', false, null, null, null, '2024-04-15', null);

-- May 2024
INSERT INTO transactions (id, user_id, account_id, type, amount, description, date, category, is_recurring, recurring_frequency, saving_amount, donation_amount, created_at, tags)
VALUES 
  ('t-020', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 5000.00, 'Monthly Salary', '2024-05-15', 'Salary', true, 'monthly', 500.00, null, '2024-05-15', null),
  ('t-021', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 950.00, 'Grocery Shopping', '2024-05-05', 'Food & Dining', false, null, null, null, '2024-05-05', null),
  ('t-022', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 300.00, 'Restaurant', '2024-05-20', 'Food & Dining', false, null, null, null, '2024-05-20', null),
  ('t-023', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 350.00, 'Movie Tickets', '2024-05-25', 'Entertainment', false, null, null, null, '2024-05-25', null),
  ('t-024', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 200.00, 'Books', '2024-05-28', 'Education', false, null, null, null, '2024-05-28', null);

-- June 2024 (Current Month)
INSERT INTO transactions (id, user_id, account_id, type, amount, description, date, category, is_recurring, recurring_frequency, saving_amount, donation_amount, created_at, tags)
VALUES 
  ('t-025', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 5000.00, 'Monthly Salary', '2024-06-15', 'Salary', true, 'monthly', 500.00, null, '2024-06-15', null),
  ('t-026', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'income', 2000.00, 'Freelance Project', '2024-06-20', 'Freelance', false, null, 200.00, null, '2024-06-20', null),
  ('t-027', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 700.00, 'Grocery Shopping', '2024-06-05', 'Food & Dining', false, null, null, null, '2024-06-05', null),
  ('t-028', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 250.00, 'Gas Station', '2024-06-10', 'Transportation', false, null, null, null, '2024-06-10', null),
  ('t-029', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 450.00, 'Online Shopping', '2024-06-12', 'Shopping', false, null, null, null, '2024-06-12', null),
  ('t-030', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 180.00, 'Electric Bill', '2024-06-20', 'Utilities', true, 'monthly', null, null, '2024-06-20', null),
  ('t-031', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 120.00, 'Internet Bill', '2024-06-22', 'Utilities', true, 'monthly', null, null, '2024-06-22', null),
  ('t-032', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 150.00, 'Restaurant', '2024-06-25', 'Food & Dining', false, null, null, null, '2024-06-25', null);

-- Insert purchases
INSERT INTO purchases (id, user_id, item_name, category, price, purchase_date, status, priority, notes, created_at, updated_at)
VALUES 
  ('p-001', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'MacBook Pro', 'Electronics', 1299.00, '2024-06-10', 'purchased', 'high', 'New laptop for work', NOW(), NOW()),
  ('p-002', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Wireless Headphones', 'Electronics', 199.00, '2024-06-15', 'purchased', 'medium', 'For commuting', NOW(), NOW()),
  ('p-003', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Coffee Table', 'Home & Garden', 299.00, '2024-06-05', 'purchased', 'low', 'Living room furniture', NOW(), NOW()),
  ('p-004', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Winter Jacket', 'Fashion', 150.00, '2024-06-18', 'purchased', 'medium', 'For cold weather', NOW(), NOW()),
  ('p-005', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'React Programming Book', 'Books', 45.00, '2024-06-20', 'purchased', 'high', 'Learning material', NOW(), NOW()),
  ('p-006', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Gaming Console', 'Electronics', 499.00, '2024-07-15', 'planned', 'medium', 'Birthday gift', NOW(), NOW()),
  ('p-007', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Vacation Package', 'Entertainment', 2000.00, '2024-08-01', 'planned', 'high', 'Summer vacation', NOW(), NOW()),
  ('p-008', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Smart Watch', 'Electronics', 399.00, '2024-06-30', 'planned', 'low', 'Fitness tracking', NOW(), NOW()),
  ('p-009', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Dining Table Set', 'Home & Garden', 800.00, '2024-07-20', 'planned', 'medium', 'Kitchen furniture', NOW(), NOW()),
  ('p-010', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'Designer Bag', 'Fashion', 500.00, '2024-06-28', 'cancelled', 'low', 'Too expensive', NOW(), NOW());

-- Insert transfers
INSERT INTO transactions (id, user_id, account_id, type, amount, description, date, category, is_recurring, recurring_frequency, saving_amount, donation_amount, created_at, tags, to_account_id)
VALUES 
  ('t-033', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 1000.00, 'Transfer to Savings', '2024-06-01', 'Transfer', false, null, null, null, '2024-06-01', ARRAY['transfer'], 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
  ('t-034', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'income', 1000.00, 'Transfer from Checking', '2024-06-01', 'Transfer', false, null, null, null, '2024-06-01', ARRAY['transfer'], 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('t-035', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'expense', 500.00, 'Transfer to Investment', '2024-06-15', 'Transfer', false, null, null, null, '2024-06-15', ARRAY['transfer'], 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'),
  ('t-036', '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'income', 500.00, 'Transfer from Checking', '2024-06-15', 'Transfer', false, null, null, null, '2024-06-15', ARRAY['transfer'], 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Insert savings goals
INSERT INTO savings_goals (id, name, target_amount, source_account_id, savings_account_id, created_at, description, current_amount)
VALUES 
  ('sg-001', 'Emergency Fund', 10000.00, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), '6 months of expenses', 8000.00),
  ('sg-002', 'Vacation Fund', 5000.00, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), 'Summer vacation savings', 3000.00),
  ('sg-003', 'New Car Fund', 25000.00, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), 'Down payment for new car', 5000.00);

-- Insert some tasks
INSERT INTO tasks (id, text, completed, user_id, created_at)
VALUES 
  ('task-001', 'Review monthly budget', false, '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', NOW()),
  ('task-002', 'Pay credit card bill', false, '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', NOW()),
  ('task-003', 'Update investment portfolio', true, '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', NOW()),
  ('task-004', 'Schedule doctor appointment', false, '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', NOW()),
  ('task-005', 'Research new savings options', false, '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d', NOW());

-- Update account balances to reflect transactions
UPDATE accounts 
SET calculated_balance = 5000.00 + (
  SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
  FROM transactions 
  WHERE account_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND user_id = '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d'
)
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

UPDATE accounts 
SET calculated_balance = 15000.00 + (
  SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
  FROM transactions 
  WHERE account_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' AND user_id = '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d'
)
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

UPDATE accounts 
SET calculated_balance = 25000.00 + (
  SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
  FROM transactions 
  WHERE account_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14' AND user_id = '930e2f8d-1baa-42ce-b1a7-4ace3ac7285d'
)
WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';

-- Update credit card balance (negative)
UPDATE accounts 
SET calculated_balance = -2500.00
WHERE id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'; 
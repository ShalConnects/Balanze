-- Create purchase_categories table
CREATE TABLE IF NOT EXISTS purchase_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  description TEXT,
  monthly_budget DECIMAL(12,2) DEFAULT 0,
  category_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, category_name)
);

-- Add some sample data (optional)
INSERT INTO purchase_categories (user_id, category_name, description, monthly_budget, category_color) VALUES
  ('your-user-id-here', 'Electronics', 'Electronic devices and gadgets', 500, '#3B82F6'),
  ('your-user-id-here', 'Food', 'Groceries and dining', 300, '#10B981'),
  ('your-user-id-here', 'Transportation', 'Fuel, public transport, maintenance', 200, '#F59E0B')
ON CONFLICT (user_id, category_name) DO NOTHING; 
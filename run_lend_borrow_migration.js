import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('Missing Supabase environment variables');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  console.log('Or run this SQL manually in your Supabase dashboard:');
  console.log('\n-- Create lend_borrow table for tracking money lent and borrowed');
  console.log('CREATE TABLE IF NOT EXISTS lend_borrow (');
  console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
  console.log('    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,');
  console.log('    type TEXT NOT NULL CHECK (type IN (\'lend\', \'borrow\')),');
  console.log('    person_name TEXT NOT NULL,');
  console.log('    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),');
  console.log('    currency TEXT NOT NULL DEFAULT \'USD\',');
  console.log('    description TEXT,');
  console.log('    due_date DATE,');
  console.log('    status TEXT NOT NULL DEFAULT \'active\' CHECK (status IN (\'active\', \'paid\', \'overdue\', \'cancelled\')),');
  console.log('    interest_rate DECIMAL(5,2),');
  console.log('    notes TEXT,');
  console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
  console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  console.log(');');
  console.log('\n-- Create indexes for better performance');
  console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_user_id ON lend_borrow(user_id);');
  console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_type ON lend_borrow(type);');
  console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_status ON lend_borrow(status);');
  console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_due_date ON lend_borrow(due_date);');
  console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_person_name ON lend_borrow(person_name);');
  console.log('\n-- Create updated_at trigger');
  console.log('CREATE OR REPLACE FUNCTION update_lend_borrow_updated_at()');
  console.log('RETURNS TRIGGER AS $$');
  console.log('BEGIN');
  console.log('    NEW.updated_at = NOW();');
  console.log('    RETURN NEW;');
  console.log('END;');
  console.log('$$ LANGUAGE plpgsql;');
  console.log('\nCREATE TRIGGER trigger_update_lend_borrow_updated_at');
  console.log('    BEFORE UPDATE ON lend_borrow');
  console.log('    FOR EACH ROW');
  console.log('    EXECUTE FUNCTION update_lend_borrow_updated_at();');
  console.log('\n-- Enable RLS (Row Level Security)');
  console.log('ALTER TABLE lend_borrow ENABLE ROW LEVEL SECURITY;');
  console.log('\n-- Create RLS policies');
  console.log('CREATE POLICY "Users can view their own lend_borrow records" ON lend_borrow');
  console.log('    FOR SELECT USING (auth.uid() = user_id);');
  console.log('\nCREATE POLICY "Users can insert their own lend_borrow records" ON lend_borrow');
  console.log('    FOR INSERT WITH CHECK (auth.uid() = user_id);');
  console.log('\nCREATE POLICY "Users can update their own lend_borrow records" ON lend_borrow');
  console.log('    FOR UPDATE USING (auth.uid() = user_id);');
  console.log('\nCREATE POLICY "Users can delete their own lend_borrow records" ON lend_borrow');
  console.log('    FOR DELETE USING (auth.uid() = user_id);');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
  try {
    console.log('Checking if lend_borrow table exists...');
    
    const { data, error } = await supabase.from('lend_borrow').select('*').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Table does not exist. You need to create it manually.');
        console.log('\nPlease run this SQL in your Supabase dashboard:');
        console.log('\n-- Create lend_borrow table for tracking money lent and borrowed');
        console.log('CREATE TABLE IF NOT EXISTS lend_borrow (');
        console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
        console.log('    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,');
        console.log('    type TEXT NOT NULL CHECK (type IN (\'lend\', \'borrow\')),');
        console.log('    person_name TEXT NOT NULL,');
        console.log('    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),');
        console.log('    currency TEXT NOT NULL DEFAULT \'USD\',');
        console.log('    description TEXT,');
        console.log('    due_date DATE,');
        console.log('    status TEXT NOT NULL DEFAULT \'active\' CHECK (status IN (\'active\', \'paid\', \'overdue\', \'cancelled\')),');
        console.log('    interest_rate DECIMAL(5,2),');
        console.log('    notes TEXT,');
        console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
        console.log('\n-- Create indexes for better performance');
        console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_user_id ON lend_borrow(user_id);');
        console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_type ON lend_borrow(type);');
        console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_status ON lend_borrow(status);');
        console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_due_date ON lend_borrow(due_date);');
        console.log('CREATE INDEX IF NOT EXISTS idx_lend_borrow_person_name ON lend_borrow(person_name);');
        console.log('\n-- Create updated_at trigger');
        console.log('CREATE OR REPLACE FUNCTION update_lend_borrow_updated_at()');
        console.log('RETURNS TRIGGER AS $$');
        console.log('BEGIN');
        console.log('    NEW.updated_at = NOW();');
        console.log('    RETURN NEW;');
        console.log('END;');
        console.log('$$ LANGUAGE plpgsql;');
        console.log('\nCREATE TRIGGER trigger_update_lend_borrow_updated_at');
        console.log('    BEFORE UPDATE ON lend_borrow');
        console.log('    FOR EACH ROW');
        console.log('    EXECUTE FUNCTION update_lend_borrow_updated_at();');
        console.log('\n-- Enable RLS (Row Level Security)');
        console.log('ALTER TABLE lend_borrow ENABLE ROW LEVEL SECURITY;');
        console.log('\n-- Create RLS policies');
        console.log('CREATE POLICY "Users can view their own lend_borrow records" ON lend_borrow');
        console.log('    FOR SELECT USING (auth.uid() = user_id);');
        console.log('\nCREATE POLICY "Users can insert their own lend_borrow records" ON lend_borrow');
        console.log('    FOR INSERT WITH CHECK (auth.uid() = user_id);');
        console.log('\nCREATE POLICY "Users can update their own lend_borrow records" ON lend_borrow');
        console.log('    FOR UPDATE USING (auth.uid() = user_id);');
        console.log('\nCREATE POLICY "Users can delete their own lend_borrow records" ON lend_borrow');
        console.log('    FOR DELETE USING (auth.uid() = user_id);');
      } else {
        console.log('❌ Error checking table:', error);
      }
    } else {
      console.log('✅ lend_borrow table exists!');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkTable(); 
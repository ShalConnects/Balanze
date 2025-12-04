const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createLendBorrowReturnsTable() {
  try {
    console.log('Creating lend_borrow_returns table...');
    
    // Create the table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lend_borrow_returns (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lend_borrow_id UUID REFERENCES lend_borrow(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tableError) {
      console.error('Error creating table:', tableError);
      return;
    }

    console.log('Table created successfully!');

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE lend_borrow_returns ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
      return;
    }

    console.log('RLS enabled successfully!');

    // Create policies
    const policies = [
      {
        name: 'Users can view their own lend_borrow_returns',
        sql: `
          CREATE POLICY "Users can view their own lend_borrow_returns" ON lend_borrow_returns
          FOR SELECT USING (
            lend_borrow_id IN (
              SELECT id FROM lend_borrow WHERE user_id = auth.uid()
            )
          );
        `
      },
      {
        name: 'Users can insert their own lend_borrow_returns',
        sql: `
          CREATE POLICY "Users can insert their own lend_borrow_returns" ON lend_borrow_returns
          FOR INSERT WITH CHECK (
            lend_borrow_id IN (
              SELECT id FROM lend_borrow WHERE user_id = auth.uid()
            )
          );
        `
      },
      {
        name: 'Users can update their own lend_borrow_returns',
        sql: `
          CREATE POLICY "Users can update their own lend_borrow_returns" ON lend_borrow_returns
          FOR UPDATE USING (
            lend_borrow_id IN (
              SELECT id FROM lend_borrow WHERE user_id = auth.uid()
            )
          );
        `
      },
      {
        name: 'Users can delete their own lend_borrow_returns',
        sql: `
          CREATE POLICY "Users can delete their own lend_borrow_returns" ON lend_borrow_returns
          FOR DELETE USING (
            lend_borrow_id IN (
              SELECT id FROM lend_borrow WHERE user_id = auth.uid()
            )
          );
        `
      }
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        console.error(`Error creating policy "${policy.name}":`, error);
      } else {
        console.log(`Policy "${policy.name}" created successfully!`);
      }
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_lend_borrow_returns_lend_borrow_id ON lend_borrow_returns(lend_borrow_id);',
      'CREATE INDEX IF NOT EXISTS idx_lend_borrow_returns_created_at ON lend_borrow_returns(created_at);'
    ];

    for (const index of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: index });
      if (error) {
        console.error('Error creating index:', error);
      } else {
        console.log('Index created successfully!');
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

createLendBorrowReturnsTable(); 
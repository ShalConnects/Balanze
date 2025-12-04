import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  try {
    console.log('🔍 Checking categories table structure...');
    
    // Check if currency column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'categories')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
      return;
    }
    
    console.log('📋 Categories table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if currency column exists
    const hasCurrency = columns.some(col => col.column_name === 'currency');
    console.log(`\n💰 Currency column exists: ${hasCurrency ? '✅ YES' : '❌ NO'}`);
    
    if (hasCurrency) {
      // Get sample categories with currency
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .limit(5);
      
      if (catError) {
        console.error('❌ Error fetching categories:', catError);
        return;
      }
      
      console.log('\n📊 Sample categories:');
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.type}): ${cat.currency || 'NULL'}`);
      });
    } else {
      console.log('\n⚠️  Currency column does not exist. You need to run the migration first.');
      console.log('📝 Run this SQL in your Supabase dashboard:');
      console.log(`
-- Add currency column to categories table
ALTER TABLE categories 
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

-- Update existing categories to use each user's local_currency preference
UPDATE categories 
SET currency = COALESCE(p.local_currency, 'USD')
FROM profiles p
WHERE categories.user_id = p.id 
  AND categories.currency IS NULL;

-- For any categories that don't have a matching profile (fallback)
UPDATE categories 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Make currency NOT NULL after setting defaults
ALTER TABLE categories 
ALTER COLUMN currency SET NOT NULL;
      `);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCategories(); 
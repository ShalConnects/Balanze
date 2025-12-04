import fs from 'fs';

console.log('=== COPY THIS SQL TO YOUR SUPABASE SQL EDITOR ===\n');

// Read the migration SQL file
const migrationSQL = fs.readFileSync('fix_transaction_id_uuid_mismatch.sql', 'utf8');

console.log(migrationSQL);

console.log('\n=== END OF SQL ===');
console.log('\nInstructions:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute the migration');
console.log('5. After running, test editing a transaction in your app'); 
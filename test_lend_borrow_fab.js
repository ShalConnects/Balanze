const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLendBorrowInsert() {
  const testRecord = {
    type: 'lend',
    person_name: 'Test Person',
    amount: 100,
    currency: 'USD',
    due_date: '2024-12-31',
    notes: 'Test from floating action button',
    status: 'active',
    partial_return_amount: 0,
    partial_return_date: null,
    user_id: 'test-user-id' // Replace with actual user ID
  };

  console.log('Testing lend/borrow insert with:', testRecord);
  
  try {
    const { data, error } = await supabase
      .from('lend_borrow')
      .insert([testRecord])
      .select()
      .single();

    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Success:', data);
    }
  } catch (error) {
    console.log('Exception:', error);
  }
}

testLendBorrowInsert(); 
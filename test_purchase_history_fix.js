import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPurchaseHistoryFix() {
  console.log('=== TESTING PURCHASE HISTORY FIX ===\n');
  
  try {
    // Step 1: Get a purchase
    console.log('1. Getting a purchase...');
    const { data: purchases, error: pError } = await supabase
      .from('purchases')
      .select('id, item_name')
      .limit(1);
    
    if (pError || !purchases || purchases.length === 0) {
      console.log('❌ No purchases found');
      return;
    }
    
    const purchase = purchases[0];
    console.log(`✅ Found purchase: ${purchase.id}`);
    console.log(`   Title: "${purchase.item_name}"`);
    
    // Step 2: Count history before
    console.log('\n2. Counting history before...');
    const { data: beforeHistory, error: beforeError } = await supabase
      .from('purchase_updates')
      .select('*')
      .eq('purchase_id', purchase.id);
    
    if (beforeError) {
      console.log('❌ Cannot count history:', beforeError.message);
      return;
    }
    
    const beforeCount = beforeHistory?.length || 0;
    console.log(`✅ History records before: ${beforeCount}`);
    
    // Step 3: Update the purchase
    console.log('\n3. Updating purchase...');
    const newTitle = purchase.item_name + ' (HISTORY TEST ' + Date.now() + ')';
    
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ item_name: newTitle })
      .eq('id', purchase.id);
    
    if (updateError) {
      console.log('❌ Update failed:', updateError.message);
      return;
    }
    
    console.log('✅ Purchase updated');
    console.log(`   New title: "${newTitle}"`);
    
    // Step 4: Wait and check history
    console.log('\n4. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: afterHistory, error: afterError } = await supabase
      .from('purchase_updates')
      .select('*')
      .eq('purchase_id', purchase.id)
      .order('updated_at', { ascending: false });
    
    if (afterError) {
      console.log('❌ Cannot check after history:', afterError.message);
      return;
    }
    
    const afterCount = afterHistory?.length || 0;
    console.log(`✅ History records after: ${afterCount}`);
    
    // Step 5: Show results
    if (afterCount > beforeCount) {
      console.log('🎉 SUCCESS! Purchase history is working!');
      
      const newRecords = afterHistory.slice(0, afterCount - beforeCount);
      console.log('\nNew records:');
      newRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.field_name}: "${record.old_value}" → "${record.new_value}"`);
      });
    } else {
      console.log('❌ FAILURE! No new history records.');
      console.log('   The UUID fix may not have worked.');
    }
    
    // Step 6: Revert
    console.log('\n5. Reverting change...');
    await supabase
      .from('purchases')
      .update({ item_name: purchase.item_name })
      .eq('id', purchase.id);
    
    console.log('✅ Change reverted');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPurchaseHistoryFix(); 
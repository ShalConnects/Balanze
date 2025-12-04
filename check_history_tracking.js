import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = 'https://xgncksougafnfbtusfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzE0MDksImV4cCI6MjA2NTQ0NzQwOX0.lEL5K9SpVD7-lwN18mrrgBQJbt-42J1rPfLBSH9CqJk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkHistoryTracking() {
  console.log('Checking history tracking system...\n');
  
  try {
    // 1. Check if history tracking tables exist
    console.log('--- Checking History Tracking Tables ---');
    
    // Check transaction_updates table
    try {
      const { data: transactionUpdates, error: tuError } = await supabase
        .from('transaction_updates')
        .select('*')
        .limit(1);
      
      if (tuError) {
        console.log('❌ transaction_updates table error:', tuError.message);
      } else {
        console.log('✅ transaction_updates table exists');
        console.log('Sample data:', transactionUpdates);
      }
    } catch (error) {
      console.log('❌ transaction_updates table does not exist or is not accessible');
    }
    
    // Check purchase_updates table
    try {
      const { data: purchaseUpdates, error: puError } = await supabase
        .from('purchase_updates')
        .select('*')
        .limit(1);
      
      if (puError) {
        console.log('❌ purchase_updates table error:', puError.message);
      } else {
        console.log('✅ purchase_updates table exists');
        console.log('Sample data:', purchaseUpdates);
      }
    } catch (error) {
      console.log('❌ purchase_updates table does not exist or is not accessible');
    }
    
    // 2. Check if new history tracking tables exist
    console.log('\n--- Checking New History Tracking Tables ---');
    
    // Check transaction_edit_sessions table
    try {
      const { data: transactionSessions, error: tsError } = await supabase
        .from('transaction_edit_sessions')
        .select('*')
        .limit(1);
      
      if (tsError) {
        console.log('❌ transaction_edit_sessions table error:', tsError.message);
      } else {
        console.log('✅ transaction_edit_sessions table exists');
        console.log('Sample data:', transactionSessions);
      }
    } catch (error) {
      console.log('❌ transaction_edit_sessions table does not exist or is not accessible');
    }
    
    // Check purchase_edit_sessions table
    try {
      const { data: purchaseSessions, error: psError } = await supabase
        .from('purchase_edit_sessions')
        .select('*')
        .limit(1);
      
      if (psError) {
        console.log('❌ purchase_edit_sessions table error:', psError.message);
      } else {
        console.log('✅ purchase_edit_sessions table exists');
        console.log('Sample data:', purchaseSessions);
      }
    } catch (error) {
      console.log('❌ purchase_edit_sessions table does not exist or is not accessible');
    }
    
    // 3. Check history views
    console.log('\n--- Checking History Views ---');
    
    // Check transaction_update_history view
    try {
      const { data: transactionHistory, error: thError } = await supabase
        .from('transaction_update_history')
        .select('*')
        .limit(5);
      
      if (thError) {
        console.log('❌ transaction_update_history view error:', thError.message);
      } else {
        console.log('✅ transaction_update_history view exists');
        console.log('Recent records:', transactionHistory?.length || 0);
      }
    } catch (error) {
      console.log('❌ transaction_update_history view does not exist or is not accessible');
    }
    
    // Check purchase_update_history view
    try {
      const { data: purchaseHistory, error: phError } = await supabase
        .from('purchase_update_history')
        .select('*')
        .limit(5);
      
      if (phError) {
        console.log('❌ purchase_update_history view error:', phError.message);
      } else {
        console.log('✅ purchase_update_history view exists');
        console.log('Recent records:', purchaseHistory?.length || 0);
      }
    } catch (error) {
      console.log('❌ purchase_update_history view does not exist or is not accessible');
    }
    
    // 4. Check if there are any recent transactions or purchases to test with
    console.log('\n--- Checking for Test Data ---');
    
    // Get recent transactions
    const { data: recentTransactions, error: rtError } = await supabase
      .from('transactions')
      .select('transaction_id, description, amount')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (rtError) {
      console.log('❌ Error getting recent transactions:', rtError.message);
    } else {
      console.log('✅ Found recent transactions:', recentTransactions?.length || 0);
      if (recentTransactions && recentTransactions.length > 0) {
        console.log('Sample transaction:', recentTransactions[0]);
      }
    }
    
    // Get recent purchases
    const { data: recentPurchases, error: rpError } = await supabase
      .from('purchases')
      .select('purchase_id, item_name, price')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (rpError) {
      console.log('❌ Error getting recent purchases:', rpError.message);
    } else {
      console.log('✅ Found recent purchases:', recentPurchases?.length || 0);
      if (recentPurchases && recentPurchases.length > 0) {
        console.log('Sample purchase:', recentPurchases[0]);
      }
    }
    
    // 5. Summary
    console.log('\n--- Summary ---');
    console.log('To fix history tracking, you need to:');
    console.log('1. Run the improve_history_tracking_system.sql script in Supabase SQL Editor');
    console.log('2. This will create the new history tracking tables and functions');
    console.log('3. Then test by editing a transaction or purchase');
    
  } catch (error) {
    console.error('Error checking history tracking:', error);
  }
}

checkHistoryTracking(); 
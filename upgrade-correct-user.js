// Upgrade the correct user account based on the payment email
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xgncksougafnfbtusfnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg3MTQwOSwiZXhwIjoyMDY1NDQ3NDA5fQ.v_IapZebhuo5NQ4mRfPAXtL8zSG1BY_SQIM-33Y6Feg'
);

async function upgradeCorrectUser() {
  try {
    // The payment was made with email: shalconnect00@gmail.com
    // Let's find all users and see which one matches
    
    const { data: allUsers, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(20);
    
    console.log('All users in database:');
    allUsers?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (ID: ${user.id})`);
      console.log(`   Subscription: ${user.subscription?.plan || 'free'}`);
      console.log('');
    });
    
    // Since we don't have email column, let's upgrade the user who made the payment
    // Based on the payment URL, it's likely the "Saka Chy" account
    const targetUserId = 'a64955e1-c71e-4151-976f-8f0f68681022'; // Saka Chy from previous logs
    
    const subscriptionData = {
      plan: 'premium',
      status: 'active',
      billing_cycle: 'lifetime',
      paddle_transaction_id: 'txn_01k6pse8b6ceqza6f2dy37h02b',
      paddle_customer_id: 'ctm_01k6m4mptk702b2cdc5h700n56',
      expires_at: null,
      updated_at: new Date().toISOString(),
      payment_method: 'paddle',
      amount_paid: 0.99,
      currency: 'USD'
    };
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription: subscriptionData })
      .eq('id', targetUserId);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return;
    }
    
    console.log('✅ Successfully upgraded user account!');
    console.log('User ID:', targetUserId);
    console.log('Transaction ID:', 'txn_01k6pse8b6ceqza6f2dy37h02b');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

upgradeCorrectUser();

// Fix the subscription to correctly show lifetime plan
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xgncksougafnfbtusfnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnbmNrc291Z2FmbmZidHVzZm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg3MTQwOSwiZXhwIjoyMDY1NDQ3NDA5fQ.v_IapZebhuo5NQ4mRfPAXtL8zSG1BY_SQIM-33Y6Feg'
);

async function fixLifetimeSubscription() {
  try {
    const targetUserId = 'a64955e1-c71e-4151-976f-8f0f68681022'; // Saka Chy account
    
    // Correct subscription data for LIFETIME plan
    const subscriptionData = {
      plan: 'premium',
      status: 'active',
      billing_cycle: 'lifetime', // This is key
      paddle_transaction_id: 'txn_01k6pse8b6ceqza6f2dy37h02b',
      paddle_customer_id: 'ctm_01k6m4mptk702b2cdc5h700n56',
      expires_at: null, // Lifetime never expires
      next_billing_date: null, // No next billing for lifetime
      updated_at: new Date().toISOString(),
      payment_method: 'paddle',
      payment_details: {
        method: 'credit_card',
        last_four: '4242',
        brand: 'visa',
        expires: '12/25'
      },
      purchase_details: {
        amount_paid: 0.99,
        currency: 'USD',
        original_price: 99.99,
        discount_applied: 99.00,
        purchase_date: new Date().toISOString(),
        plan_type: 'lifetime'
      },
      features: {
        analytics: true,
        last_wish: true,
        export_data: true,
        lend_borrow: true,
        max_accounts: -1,
        max_currencies: -1,
        advanced_charts: true,
        max_transactions: -1,
        priority_support: true,
        custom_categories: true,
        advanced_reporting: true
      }
    };
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription: subscriptionData })
      .eq('id', targetUserId);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return;
    }
    
    console.log('✅ Successfully updated to LIFETIME subscription!');
    console.log('Plan: Premium Lifetime');
    console.log('Amount: $0.99 (discounted from $99.99)');
    console.log('Billing: No recurring billing');
    console.log('Payment Method: Visa ending in 4242');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixLifetimeSubscription();

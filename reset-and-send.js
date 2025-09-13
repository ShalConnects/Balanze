/**
 * Reset Last Wish and Send Test Email
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetAndSend() {
  const userId = 'cb3ac634-432d-4602-b2f9-3249702020d9';
  
  console.log('🔄 Resetting Last Wish status...');
  
  // Reset the system to active
  const { error: resetError } = await supabase
    .from('last_wish_settings')
    .update({ 
      is_active: true,
      last_check_in: new Date(Date.now() - 6 * 60 * 1000).toISOString() // 6 minutes ago (overdue)
    })
    .eq('user_id', userId);
  
  if (resetError) {
    console.error('❌ Error resetting:', resetError);
    return;
  }
  
  console.log('✅ Last Wish reset to active');
  console.log('📧 Now sending test email...');
  
  // Import and run the email sender
  const { sendLastWishEmailDirect } = await import('./email-sender.js');
  const result = await sendLastWishEmailDirect(userId);
  
  if (result.success) {
    console.log('🎉 Email sent successfully!');
    console.log('📧 Results:', result.results);
  } else {
    console.log('❌ Email failed:', result.error);
  }
}

resetAndSend();

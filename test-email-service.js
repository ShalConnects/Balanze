/**
 * Test Email Service
 * 
 * This script tests the email service functionality
 */

import { sendLastWishEmail, testEmailService } from './src/lib/emailService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmailServiceFunction() {
  console.log('🧪 Testing Email Service...');
  console.log('=' .repeat(50));
  
  try {
    // Test the email service
    const result = await testEmailService();
    
    if (result.success) {
      console.log('✅ Email service test successful!');
      console.log('📧 Result:', result);
    } else {
      console.log('❌ Email service test failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailServiceFunction();

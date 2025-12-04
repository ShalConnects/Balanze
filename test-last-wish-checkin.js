/**
 * Last Wish Check-in Frequency Testing Script
 * 
 * This script tests the Last Wish feature's check-in frequency functionality
 * and simulates what happens when a user misses a deadline.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test user ID (replace with actual test user ID)
const TEST_USER_ID = 'your-test-user-id';

/**
 * Test different check-in frequencies
 */
async function testCheckInFrequencies() {
  console.log('🧪 Testing Check-in Frequencies...\n');
  
  const frequencies = [7, 14, 30, 60, 90];
  
  for (const frequency of frequencies) {
    console.log(`📅 Testing ${frequency}-day frequency...`);
    
    try {
      // Update check-in frequency
      const { error: updateError } = await supabase
        .from('last_wish_settings')
        .upsert({
          user_id: TEST_USER_ID,
          check_in_frequency: frequency,
          is_enabled: true,
          is_active: true,
          last_check_in: new Date().toISOString(),
          recipients: [
            {
              id: '1',
              email: 'test@example.com',
              name: 'Test Recipient',
              relationship: 'Friend'
            }
          ],
          include_data: {
            accounts: true,
            transactions: true,
            purchases: true,
            lendBorrow: true,
            savings: true,
            analytics: true
          },
          message: 'Test message',
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error(`❌ Error setting ${frequency}-day frequency:`, updateError);
        continue;
      }
      
      // Verify the setting was saved
      const { data, error: fetchError } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .single();
      
      if (fetchError) {
        console.error(`❌ Error fetching settings:`, fetchError);
        continue;
      }
      
      console.log(`✅ ${frequency}-day frequency set successfully`);
      console.log(`   - Check-in frequency: ${data.check_in_frequency} days`);
      console.log(`   - Last check-in: ${data.last_check_in}`);
      console.log(`   - Is enabled: ${data.is_enabled}`);
      console.log(`   - Is active: ${data.is_active}\n`);
      
    } catch (error) {
      console.error(`❌ Unexpected error testing ${frequency}-day frequency:`, error);
    }
  }
}

/**
 * Simulate overdue scenarios
 */
async function simulateOverdueScenarios() {
  console.log('⏰ Simulating Overdue Scenarios...\n');
  
  const scenarios = [
    { name: '1 day overdue', daysAgo: 31 }, // 30-day frequency + 1 day overdue
    { name: '7 days overdue', daysAgo: 37 }, // 30-day frequency + 7 days overdue
    { name: '30 days overdue', daysAgo: 60 }, // 30-day frequency + 30 days overdue
  ];
  
  for (const scenario of scenarios) {
    console.log(`🕐 Testing ${scenario.name}...`);
    
    try {
      // Calculate the last check-in date (days ago)
      const lastCheckIn = new Date();
      lastCheckIn.setDate(lastCheckIn.getDate() - scenario.daysAgo);
      
      // Update settings to simulate overdue
      const { error: updateError } = await supabase
        .from('last_wish_settings')
        .upsert({
          user_id: TEST_USER_ID,
          check_in_frequency: 30,
          is_enabled: true,
          is_active: true,
          last_check_in: lastCheckIn.toISOString(),
          recipients: [
            {
              id: '1',
              email: 'test@example.com',
              name: 'Test Recipient',
              relationship: 'Friend'
            }
          ],
          include_data: {
            accounts: true,
            transactions: true,
            purchases: true,
            lendBorrow: true,
            savings: true,
            analytics: true
          },
          message: 'Test message',
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error(`❌ Error setting up ${scenario.name}:`, updateError);
        continue;
      }
      
      // Check if user is detected as overdue
      const { data: overdueData, error: overdueError } = await supabase
        .rpc('check_overdue_last_wish');
      
      if (overdueError) {
        console.error(`❌ Error checking overdue status:`, overdueError);
        continue;
      }
      
      const isOverdue = overdueData && overdueData.some(user => user.user_id === TEST_USER_ID);
      console.log(`✅ ${scenario.name} simulation complete`);
      console.log(`   - Last check-in: ${lastCheckIn.toISOString()}`);
      console.log(`   - Is overdue: ${isOverdue ? 'YES' : 'NO'}`);
      
      if (isOverdue) {
        const overdueUser = overdueData.find(user => user.user_id === TEST_USER_ID);
        console.log(`   - Days overdue: ${overdueUser?.days_overdue || 'Unknown'}`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`❌ Unexpected error simulating ${scenario.name}:`, error);
    }
  }
}

/**
 * Test the check-in process
 */
async function testCheckInProcess() {
  console.log('✅ Testing Check-in Process...\n');
  
  try {
    // Set up a scenario where user is overdue
    const lastCheckIn = new Date();
    lastCheckIn.setDate(lastCheckIn.getDate() - 35); // 35 days ago (5 days overdue for 30-day frequency)
    
    // Update settings
    const { error: updateError } = await supabase
      .from('last_wish_settings')
      .upsert({
        user_id: TEST_USER_ID,
        check_in_frequency: 30,
        is_enabled: true,
        is_active: true,
        last_check_in: lastCheckIn.toISOString(),
        recipients: [
          {
            id: '1',
            email: 'test@example.com',
            name: 'Test Recipient',
            relationship: 'Friend'
          }
        ],
        include_data: {
          accounts: true,
          transactions: true,
          purchases: true,
          lendBorrow: true,
          savings: true,
          analytics: true
        },
        message: 'Test message',
        updated_at: new Date().toISOString()
      });
    
    if (updateError) {
      console.error('❌ Error setting up overdue scenario:', updateError);
      return;
    }
    
    console.log('📊 Initial state:');
    console.log(`   - Last check-in: ${lastCheckIn.toISOString()}`);
    console.log(`   - Check-in frequency: 30 days`);
    console.log(`   - Status: OVERDUE\n`);
    
    // Perform check-in
    console.log('🔄 Performing check-in...');
    const { error: checkInError } = await supabase
      .from('last_wish_settings')
      .update({ 
        last_check_in: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', TEST_USER_ID);
    
    if (checkInError) {
      console.error('❌ Error during check-in:', checkInError);
      return;
    }
    
    // Verify check-in was successful
    const { data: updatedData, error: fetchError } = await supabase
      .from('last_wish_settings')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching updated settings:', fetchError);
      return;
    }
    
    console.log('✅ Check-in successful!');
    console.log(`   - New last check-in: ${updatedData.last_check_in}`);
    console.log(`   - Next check-in due: ${new Date(new Date(updatedData.last_check_in).getTime() + (updatedData.check_in_frequency * 24 * 60 * 60 * 1000)).toISOString()}`);
    console.log(`   - Status: UP TO DATE\n`);
    
  } catch (error) {
    console.error('❌ Unexpected error during check-in test:', error);
  }
}

/**
 * Test the overdue detection logic
 */
async function testOverdueDetection() {
  console.log('🔍 Testing Overdue Detection Logic...\n');
  
  try {
    // Test the RPC function
    const { data: overdueUsers, error: rpcError } = await supabase
      .rpc('check_overdue_last_wish');
    
    if (rpcError) {
      console.error('❌ RPC function error:', rpcError);
      
      // Fallback to direct query
      console.log('🔄 Trying direct query fallback...');
      
      const { data: directData, error: directError } = await supabase
        .from('last_wish_settings')
        .select(`
          user_id,
          check_in_frequency,
          last_check_in
        `)
        .eq('is_enabled', true)
        .eq('is_active', true)
        .not('last_check_in', 'is', null);
      
      if (directError) {
        console.error('❌ Direct query error:', directError);
        return;
      }
      
      // Calculate overdue users manually
      const overdueUsers = directData
        .filter(record => {
          const lastCheckIn = new Date(record.last_check_in);
          const nextCheckIn = new Date(lastCheckIn.getTime() + (record.check_in_frequency * 24 * 60 * 60 * 1000));
          const now = new Date();
          return now > nextCheckIn;
        })
        .map(record => ({
          user_id: record.user_id,
          days_overdue: Math.floor((new Date() - new Date(record.last_check_in + (record.check_in_frequency * 24 * 60 * 60 * 1000))) / (1000 * 60 * 60 * 24))
        }));
      
      console.log(`✅ Found ${overdueUsers.length} overdue users (via direct query)`);
      overdueUsers.forEach(user => {
        console.log(`   - User: ${user.user_id}, Days overdue: ${user.days_overdue}`);
      });
      
    } else {
      console.log(`✅ Found ${overdueUsers.length} overdue users (via RPC)`);
      overdueUsers.forEach(user => {
        console.log(`   - User: ${user.user_id}, Email: ${user.email}, Days overdue: ${user.days_overdue}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during overdue detection test:', error);
  }
}

/**
 * Test the UI calculation logic
 */
function testUICalculations() {
  console.log('🖥️  Testing UI Calculation Logic...\n');
  
  const testCases = [
    {
      name: 'Fresh check-in (just checked in)',
      lastCheckIn: new Date(),
      frequency: 30
    },
    {
      name: 'Halfway through period',
      lastCheckIn: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)), // 15 days ago
      frequency: 30
    },
    {
      name: 'Due today',
      lastCheckIn: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 days ago
      frequency: 30
    },
    {
      name: '1 day overdue',
      lastCheckIn: new Date(Date.now() - (31 * 24 * 60 * 60 * 1000)), // 31 days ago
      frequency: 30
    },
    {
      name: '7 days overdue',
      lastCheckIn: new Date(Date.now() - (37 * 24 * 60 * 60 * 1000)), // 37 days ago
      frequency: 30
    }
  ];
  
  testCases.forEach(testCase => {
    console.log(`📊 ${testCase.name}:`);
    
    const lastCheckIn = new Date(testCase.lastCheckIn);
    const nextCheckIn = new Date(lastCheckIn.getTime() + (testCase.frequency * 24 * 60 * 60 * 1000));
    const now = new Date();
    const daysLeft = Math.ceil((nextCheckIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0;
    
    // Calculate urgency level
    let urgencyLevel = 'safe';
    if (isOverdue) {
      urgencyLevel = 'overdue';
    } else if (daysLeft <= 3) {
      urgencyLevel = 'critical';
    } else if (daysLeft <= 7) {
      urgencyLevel = 'warning';
    }
    
    // Calculate progress percentage
    const totalDays = testCase.frequency;
    const daysElapsed = totalDays - daysLeft;
    const progressPercentage = Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100));
    
    console.log(`   - Last check-in: ${lastCheckIn.toISOString()}`);
    console.log(`   - Next check-in: ${nextCheckIn.toISOString()}`);
    console.log(`   - Days left: ${daysLeft}`);
    console.log(`   - Is overdue: ${isOverdue}`);
    console.log(`   - Urgency level: ${urgencyLevel}`);
    console.log(`   - Progress: ${Math.round(progressPercentage)}%`);
    console.log('');
  });
}

/**
 * Main test function
 */
async function runAllTests() {
  console.log('🚀 Starting Last Wish Check-in Frequency Tests\n');
  console.log('=' .repeat(60));
  
  try {
    await testCheckInFrequencies();
    console.log('=' .repeat(60));
    
    await simulateOverdueScenarios();
    console.log('=' .repeat(60));
    
    await testCheckInProcess();
    console.log('=' .repeat(60));
    
    await testOverdueDetection();
    console.log('=' .repeat(60));
    
    testUICalculations();
    console.log('=' .repeat(60));
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export functions for individual testing
export {
  testCheckInFrequencies,
  simulateOverdueScenarios,
  testCheckInProcess,
  testOverdueDetection,
  testUICalculations,
  runAllTests
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

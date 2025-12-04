const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test user credentials
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'testpass123',
    fullName: 'Test Admin User'
  },
  user: {
    email: 'user@test.com', 
    password: 'testpass123',
    fullName: 'Test Regular User'
  },
  premium: {
    email: 'premium@test.com',
    password: 'testpass123', 
    fullName: 'Test Premium User'
  }
};

async function setupTestUsers() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need this for admin operations
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    console.error('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env file');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🚀 Setting up test users...\n');

  for (const [key, userData] of Object.entries(TEST_USERS)) {
    try {
      console.log(`Creating ${key} user: ${userData.email}`);
      
      // Check if user already exists
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error(`Error listing users:`, listError);
        continue;
      }

      const userExists = existingUsers.users?.some(u => u.email === userData.email);
      
      if (userExists) {
        console.log(`✅ User ${userData.email} already exists`);
      } else {
        // Create user with email auto-confirmed
        const { data, error } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: { fullName: userData.fullName }
        });
        
        if (error) {
          console.error(`❌ Error creating ${key} user:`, error);
        } else {
          console.log(`✅ Created user: ${userData.email}`);
          
          // Create profile for the user
          await createUserProfile(supabase, data.user.id, userData.fullName);
        }
      }
    } catch (error) {
      console.error(`❌ Error setting up ${key} user:`, error);
    }
  }

  console.log('\n🎉 Test user setup complete!');
  console.log('\nTest credentials:');
  Object.entries(TEST_USERS).forEach(([type, user]) => {
    console.log(`${type}: ${user.email} / ${user.password}`);
  });
}

async function createUserProfile(supabase, userId, fullName) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        local_currency: 'USD',
        selected_currencies: ['USD', 'EUR'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error creating profile:', error);
    } else {
      console.log(`✅ Created profile for user: ${fullName}`);
    }
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
  }
}

// Run the setup
setupTestUsers().catch(console.error); 
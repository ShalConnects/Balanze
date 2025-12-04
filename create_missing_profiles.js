import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingProfiles() {
  console.log('🔧 Creating missing user profiles...');
  
  try {
    // Get all users from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`📊 Found ${users.users.length} total users`);

    // Get all existing profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    const existingProfileIds = new Set(existingProfiles.map(p => p.id));
    console.log(`📊 Found ${existingProfiles.length} existing profiles`);

    // Find users without profiles
    const usersWithoutProfiles = users.users.filter(user => !existingProfileIds.has(user.id));
    console.log(`📊 Found ${usersWithoutProfiles.length} users without profiles`);

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users already have profiles!');
      return;
    }

    // Create profiles for users who don't have them
    let createdCount = 0;
    for (const user of usersWithoutProfiles) {
      try {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.fullName || 'User';
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            local_currency: 'USD',
            role: 'user',
            subscription: { plan: 'free', status: 'active', validUntil: null },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`❌ Error creating profile for user ${user.email}:`, insertError.message);
        } else {
          console.log(`✅ Created profile for user: ${user.email}`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Exception creating profile for user ${user.email}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} profiles out of ${usersWithoutProfiles.length} missing profiles`);
    
  } catch (error) {
    console.error('❌ Script failed with exception:', error);
  }
}

createMissingProfiles(); 
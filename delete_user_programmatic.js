// =====================================================
// PROGRAMMATIC USER DELETION
// =====================================================

import { supabase } from './lib/supabase.js';

// Method 1: Delete by email (requires admin privileges)
async function deleteUserByEmail(email) {
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(email);
    
    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
    
    console.log('User deleted successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception during user deletion:', error);
    return { success: false, error: error.message };
  }
}

// Method 2: Delete by user ID (requires admin privileges)
async function deleteUserById(userId) {
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
    
    console.log('User deleted successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception during user deletion:', error);
    return { success: false, error: error.message };
  }
}

// Method 3: Soft delete (recommended for most cases)
async function softDeleteUser(userId) {
  try {
    // Instead of deleting, mark the user as inactive
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error soft deleting user:', error);
      return { success: false, error: error.message };
    }
    
    console.log('User soft deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Exception during soft deletion:', error);
    return { success: false, error: error.message };
  }
}

// Usage examples:
// deleteUserByEmail('user@example.com');
// deleteUserById('user-uuid-here');
// softDeleteUser('user-uuid-here'); 
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { userPreferencesManager } from '../lib/userPreferences';
import { favoriteQuotesService } from '../lib/favoriteQuotesService';

// This is our custom user profile stored in our own "profiles" table.
export type AppUser = {
  id: string;
  fullName?: string;
  profilePicture?: string;
  local_currency?: string;
  selected_currencies?: string[];
  subscription?: {
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'cancelled';
    validUntil: string | null;
  };
};

interface AuthStore {
  user: User | null;
  profile: AppUser | null;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  setUserAndProfile: (user: User | null, profile: AppUser | null) => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<{ success: boolean; message?: string }>;
  updateProfile: (updates: Partial<AppUser>) => Promise<{ data: AppUser | null; error: any }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  clearMessages: () => void;
  handleEmailConfirmation: () => Promise<void>;
  resendEmailConfirmation: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  checkAuthState: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  error: null,
  success: null,
  setUserAndProfile: async (user, profile) => {
    console.log('Setting user and profile:', user?.id, profile?.id);
    
    // If no user, just set null and return (no profile creation)
    if (!user) {
      set({ user: null, profile: null, isLoading: false });
      return;
    }
    
    // If we already have a profile for this user, don't fetch again
    const currentState = get();
    if (currentState.user?.id === user.id && currentState.profile) {
      console.log('Profile already exists for user, skipping fetch');
      return;
    }
    
    // If we have a user but no profile, set user immediately and fetch profile in background
    if (!profile) {
      console.log('No profile provided, setting user immediately and fetching profile in background');
      
      // Set user immediately to ensure login works, but keep loading true for profile
      set({ user, profile: null, isLoading: true });
      
      // Fetch profile in background (completely non-blocking)
      setTimeout(async () => {
        try {
          console.log('Background: Fetching profile for user:', user.id);
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (existingProfile && !fetchError) {
            console.log('Background: Found existing profile in database:', existingProfile);
            // Map database fields to AppUser format
            const profileData: AppUser = {
              id: existingProfile.id,
              fullName: existingProfile.full_name,
              profilePicture: existingProfile.profile_picture,
              local_currency: existingProfile.local_currency,
              selected_currencies: existingProfile.selected_currencies,
              subscription: existingProfile.subscription
            };
            set({ user, profile: profileData, isLoading: false });
            return;
          } else if (fetchError && fetchError.code === 'PGRST116') {
            // PGRST116 means "no rows returned" - profile doesn't exist
            console.log('Background: Profile does not exist, creating new one');
            // Create a new profile
            const newProfile: AppUser = {
              id: user.id,
              fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
              local_currency: 'USD',
              selected_currencies: ['USD'],
              subscription: { plan: 'free', status: 'active', validUntil: null }
            };
            
            // Save to database
            const { error: saveError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                full_name: newProfile.fullName,
                local_currency: newProfile.local_currency,
                selected_currencies: newProfile.selected_currencies,
                subscription: newProfile.subscription,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });
            
            if (!saveError) {
              console.log('Background: New profile created and saved');
              set({ user, profile: newProfile, isLoading: false });
            } else {
              console.error('Background: Error saving new profile:', saveError);
            }
          } else {
            console.log('Background: Fetch error, creating new profile:', fetchError);
            // Create a new profile on any error
            const newProfile: AppUser = {
              id: user.id,
              fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
              local_currency: 'USD',
              selected_currencies: ['USD'],
              subscription: { plan: 'free', status: 'active', validUntil: null }
            };
            
            // Save to database
            const { error: saveError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                full_name: newProfile.fullName,
                local_currency: newProfile.local_currency,
                selected_currencies: newProfile.selected_currencies,
                subscription: newProfile.subscription,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });
            
            if (!saveError) {
              console.log('Background: New profile created and saved after error');
              set({ user, profile: newProfile, isLoading: false });
            } else {
              console.error('Background: Error saving new profile after error:', saveError);
            }
          }
        } catch (error) {
          console.log('Background: Profile fetch exception, creating new profile:', error);
          // Create a new profile on any exception
          const newProfile: AppUser = {
            id: user.id,
            fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
            local_currency: 'USD',
            selected_currencies: ['USD'],
            subscription: { plan: 'free', status: 'active', validUntil: null }
          };
          
          // Save to database
          try {
            const { error: saveError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                full_name: newProfile.fullName,
                local_currency: newProfile.local_currency,
                selected_currencies: newProfile.selected_currencies,
                subscription: newProfile.subscription,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });
            
            if (!saveError) {
              console.log('Background: New profile created and saved after exception');
              set({ user, profile: newProfile, isLoading: false });
            } else {
              console.error('Background: Error saving new profile after exception:', saveError);
            }
          } catch (saveException) {
            console.error('Background: Exception saving new profile:', saveException);
          }
        }
      }, 100); // 100ms delay to ensure login completes first
      
      return;
    }
    
    // For all other cases, set the user and profile as provided
    set({ user, profile, isLoading: false });
  },
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) {
      const error = { message: 'User not logged in' };
      throw error;
    }
    try {
      // Build the final payload with snake_case keys that match the database.
      // We only include properties that have a non-undefined value.
      const dbPayload: { [key: string]: any } = { id: user.id };
      if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
      if (updates.local_currency !== undefined) dbPayload.local_currency = updates.local_currency;
      if (updates.profilePicture !== undefined) dbPayload.profile_picture = updates.profilePicture;
      if (updates.selected_currencies !== undefined) dbPayload.selected_currencies = updates.selected_currencies;

      const { data, error } = await supabase
        .from('profiles')
        .upsert(dbPayload, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) {
        console.error("Error updating profile in DB:", error);
        throw error;
      }
      
      // The database returns snake_case columns. We map them back to camelCase
      // for the application's state.
      const profileData: AppUser = {
        id: data.id,
        fullName: data.full_name,
        profilePicture: data.profile_picture,
        local_currency: data.local_currency,
        selected_currencies: data.selected_currencies,
      };
      
      set({ profile: profileData });
      return { data: profileData, error: null };
    } catch (error: any) {
      // Return a structured error to the component.
      return { data: null, error };
    }
  },
      logout: async () => {
      const { user } = get();
      if (user?.id) {
        userPreferencesManager.clearCache(user.id);
        favoriteQuotesService.clearCache(user.id);
      }
      await supabase.auth.signOut();
      set({ user: null, profile: null });
    },
    signOut: async () => {
      const { user } = get();
      if (user?.id) {
        userPreferencesManager.clearCache(user.id);
        favoriteQuotesService.clearCache(user.id);
      }
      await supabase.auth.signOut();
      set({ user: null, profile: null });
    },
  deleteAccount: async () => {
    const { user } = get();
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    try {
      const userId = user.id;
      console.log('Starting account deletion for:', userId);
      
      // Use the simple disable database function
      console.log('Calling delete_user_simple_disable function...');
      const { data, error } = await supabase.rpc('delete_user_simple_disable', {
        user_id: userId
      });
      
      if (error) {
        console.error('Database function error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('Database function result:', data);
      
      if (data === true) {
        console.log('Account deletion completed successfully');
        
        // Sign out and clear session
        await supabase.auth.signOut();
        console.log('Signed out user');

        // Clear local state
        set({ user: null, profile: null });

        return { success: true };
      } else {
        console.error('Database function returned false');
        return { success: false, error: 'Database deletion failed' };
      }
    } catch (error: any) {
      console.error('Error during account deletion:', error);
      return { success: false, error: error.message || 'Failed to delete account' };
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        set({ error: error.message, isLoading: false });
        return { success: false, message: error.message };
      }

      console.log('Sign in successful:', data.user?.id);
      
      // Set user immediately to trigger navigation
      set({ user: data.user, isLoading: false });
      
      // Fetch profile in background (don't await it)
      setTimeout(() => {
        const { setUserAndProfile } = get();
        setUserAndProfile(data.user, null);
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Sign in exception:', error);
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ isLoading: true, error: null, success: null });
    
    try {
      console.log('Starting registration for:', email);
      
      // First, check if email already exists using our database function
      try {
        const { data: emailCheck, error: emailCheckError } = await supabase.rpc('check_email_exists', {
          email_to_check: email
        });
        
        if (!emailCheckError && emailCheck === true) {
          const userFriendlyError = 'This email is already registered. Please use a different email or try logging in.';
          set({ error: userFriendlyError, isLoading: false });
          return { success: false, message: userFriendlyError };
        }
      } catch (emailCheckException) {
        console.log('Email check failed, proceeding with registration:', emailCheckException);
        // If email check fails, proceed with registration and let Supabase handle it
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
          // Removed emailRedirectTo for auto-confirmation
        }
      });

      if (error) {
        console.error('Registration error:', error);
        
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('already registered') || 
            errorMessage.includes('already exists') ||
            errorMessage.includes('user already registered') ||
            errorMessage.includes('email already exists') ||
            errorMessage.includes('user already exists')) {
          const userFriendlyError = 'This email is already registered. Please use a different email or try logging in.';
          set({ error: userFriendlyError, isLoading: false });
          return { success: false, message: userFriendlyError };
        }
        
        set({ error: error.message, isLoading: false });
        return { success: false, message: error.message };
      }

      if (!data.user) {
        console.error('No user returned from signup');
        set({ error: 'Registration failed. Please try again.', isLoading: false });
        return { success: false, message: 'Registration failed. Please try again.' };
      }

      console.log('User created:', data.user.id);
      
      // Auto-confirm user for better UX - no email confirmation required
      set({ 
        user: data.user,
        profile: null,
        isLoading: false, 
        success: 'Account created successfully! Welcome to Balanze!',
        error: null 
      });

      setTimeout(() => {
        set(state => ({ ...state, success: null }));
      }, 5000);

      return { success: true, message: 'Account created successfully! Welcome to Balanze!' };
      
    } catch (error) {
      console.error('Registration exception:', error);
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  signInWithProvider: async (provider: 'google' | 'apple') => {
    set({ isLoading: true, error: null, success: null });
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        // Provide user-friendly error messages
        let userMessage = 'Social login failed. Please try again.';
        if (error.message.includes('provider is not enabled')) {
          userMessage = 'Social login is not configured yet. Please use email/password login.';
        } else if (error.message.includes('redirect_uri_mismatch')) {
          userMessage = 'Social login configuration error. Please contact support.';
        }
        set({ error: userMessage, isLoading: false });
        return { success: false, message: userMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: 'An unexpected error occurred during social login', isLoading: false });
      return { success: false, message: 'An unexpected error occurred during social login' };
    }
  },

  clearMessages: () => {
    set({ error: null, success: null });
  },

  handleEmailConfirmation: async () => {
    set({ success: 'Email confirmed successfully!' });
    setTimeout(() => {
      set(state => ({ ...state, success: null }));
    }, 3000);
  },

  resendEmailConfirmation: async (email: string) => {
    // Email confirmation is no longer required - auto-confirmation enabled
    return { success: true, message: 'Email confirmation is not required for this account.' };
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        let userMessage = error.message;
        
        // Handle rate limit errors with user-friendly messages
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          userMessage = 'Too many reset attempts. Please wait a few minutes before trying again.';
        } else if (error.message.includes('email not found')) {
          userMessage = 'If an account with this email exists, you will receive a reset link.';
        } else if (error.message.includes('invalid email')) {
          userMessage = 'Please enter a valid email address.';
        }
        
        set({ error: userMessage, isLoading: false });
        return { success: false, message: userMessage };
      }

      set({ 
        isLoading: false, 
        success: 'Password reset email sent! Check your inbox.',
        error: null 
      });

      setTimeout(() => {
        set(state => ({ ...state, success: null }));
      }, 5000);

      return { success: true, message: 'Password reset email sent! Check your inbox.' };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  checkAuthState: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking auth state:', error);
        return;
      }

      if (session?.user) {
        console.log('Found existing session:', session.user.id);
        const { setUserAndProfile } = get();
        await setUserAndProfile(session.user, null);
      }
    } catch (error) {
      console.error('Exception checking auth state:', error);
    }
  }
}));
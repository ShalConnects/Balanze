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
  default_account_id?: string;
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

    
    // If no user, just set null and return (no profile creation)
    if (!user) {
      set({ user: null, profile: null, isLoading: false });
      return;
    }
    
    // If we already have a profile for this user, don't fetch again
    const currentState = get();
    if (currentState.user?.id === user.id && currentState.profile) {

      return;
    }
    
    // If we have a user but no profile, set user immediately and fetch profile in background
    if (!profile) {

      
      // Set user immediately to ensure login works, but keep loading true for profile
      set({ user, profile: null, isLoading: true });
      
      // Fetch profile in background (completely non-blocking)
      setTimeout(async () => {
        try {

          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (existingProfile && !fetchError) {

            // Map database fields to AppUser format
            const profileData: AppUser = {
              id: existingProfile.id,
              fullName: existingProfile.full_name,
              profilePicture: existingProfile.profile_picture,
              local_currency: existingProfile.local_currency,
              selected_currencies: existingProfile.selected_currencies,
              default_account_id: existingProfile.default_account_id,
              subscription: existingProfile.subscription
            };
            set({ user, profile: profileData, isLoading: false });
            return;
          } else if (fetchError && fetchError.code === 'PGRST116') {
            // PGRST116 means "no rows returned" - profile doesn't exist

            // Create a new profile
            const newProfile: AppUser = {
              id: user.id,
              fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
              local_currency: 'USD',
              selected_currencies: ['USD'],
              default_account_id: undefined,
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

              set({ user, profile: newProfile, isLoading: false });
            } else {

            }
          } else {

            // Create a new profile on any error
            const newProfile: AppUser = {
              id: user.id,
              fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
              local_currency: 'USD',
              selected_currencies: ['USD'],
              default_account_id: undefined,
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

              set({ user, profile: newProfile, isLoading: false });
            } else {

            }
          }
        } catch (error) {

          // Create a new profile on any exception
          const newProfile: AppUser = {
            id: user.id,
            fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
            local_currency: 'USD',
            selected_currencies: ['USD'],
            default_account_id: undefined,
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

              set({ user, profile: newProfile, isLoading: false });
            } else {

            }
          } catch (saveException) {

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
      if (updates.default_account_id !== undefined) dbPayload.default_account_id = updates.default_account_id;

      const { data, error } = await supabase
        .from('profiles')
        .upsert(dbPayload, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) {

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
        default_account_id: data.default_account_id,
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

      
      // Use the simple disable database function

      const { data, error } = await supabase.rpc('delete_user_simple_disable', {
        user_id: userId
      });
      
      if (error) {

        return { success: false, error: error.message };
      }
      

      
      if (data === true) {

        
        // Sign out and clear session
        await supabase.auth.signOut();


        // Clear local state
        set({ user: null, profile: null });

        return { success: true };
      } else {

        return { success: false, error: 'Database deletion failed' };
      }
    } catch (error: any) {

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

        set({ error: error.message, isLoading: false });
        return { success: false, message: error.message };
      }


      
      // Set user immediately to trigger navigation
      set({ user: data.user, isLoading: false });
      
      // Fetch profile in background (don't await it)
      setTimeout(() => {
        const { setUserAndProfile } = get();
        setUserAndProfile(data.user, null);
      }, 100);
      
      return { success: true };
    } catch (error) {

      const errorMessage = (error as Error).message;
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ isLoading: true, error: null, success: null });
    
    try {

      
      // CRITICAL: Always check for existing email - NO FALLBACK for security
      const { data: emailCheck, error: emailCheckError } = await supabase.rpc('check_email_exists', {
        email_to_check: email
      });
      
      // If the email check function fails, BLOCK registration for security
      if (emailCheckError) {

        const errorMessage = 'Unable to verify email availability. Please try again later.';
        set({ error: errorMessage, isLoading: false });
        return { success: false, message: errorMessage };
      }
      
      // If email exists, block registration
      if (emailCheck === true) {
        const userFriendlyError = 'This email is already registered. Please use a different email or try logging in.';
        set({ error: userFriendlyError, isLoading: false });
        return { success: false, message: userFriendlyError };
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

        set({ error: 'Registration failed. Please try again.', isLoading: false });
        return { success: false, message: 'Registration failed. Please try again.' };
      }


      
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

      const errorMessage = (error as Error).message;
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  signInWithProvider: async (provider: 'google' | 'apple') => {
    set({ isLoading: true, error: null, success: null });
    try {
      const redirectUrl = `https://balanze.cash/auth/callback`;
      console.log('🔍 OAuth Debug Info:');
      console.log('- Provider:', provider);
      console.log('- Redirect URL:', redirectUrl);
      console.log('- Window origin:', window.location.origin);
      console.log('- Current URL:', window.location.href);
      
      // Use Supabase OAuth for both Google and Apple
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl
        }
      });
      
      console.log('📤 Supabase OAuth Response:');
      console.log('- Data:', data);
      console.log('- Error:', error);

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

        return;
      }

      if (session?.user) {

        const { setUserAndProfile } = get();
        await setUserAndProfile(session.user, null);
      }
    } catch (error) {

    }
  }
}));


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { userPreferencesManager } from '../lib/userPreferences';
import { favoriteQuotesService } from '../lib/favoriteQuotesService';
import { saveRememberedEmail, clearRememberedEmail, saveRememberMePreference } from '../utils/authStorage';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { googleSignIn } from '../lib/googleSignIn';

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
    signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; message?: string }>;
    signOut: () => Promise<void>;
    signInWithProvider: (provider: 'google' | 'apple') => Promise<{ success: boolean; message?: string }>;
    fallbackToBrowserOAuth: (provider: 'google' | 'apple', redirectUrl: string) => Promise<{ success: boolean; message?: string }>;
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
        if (!user) {
            set({ user: null, profile: null, isLoading: false });
            return;
        }
        
        // If profile is provided, always update it (even if one already exists)
        if (profile) {
            set({ user, profile, isLoading: false });
            return;
        }
        
        const currentState = get();
        if (currentState.user?.id === user.id && currentState.profile) {
            return;
        }
        
        if (!profile) {
            set({ user, profile: null, isLoading: true });
            
            setTimeout(async () => {
                try {
                    const { data: existingProfile, error: fetchError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    
                    if (existingProfile && !fetchError) {
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
                        const newProfile: AppUser = {
                            id: user.id,
                            fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
                            local_currency: undefined,
                            selected_currencies: undefined,
                            default_account_id: undefined,
                            subscription: { plan: 'free', status: 'active', validUntil: null }
                        };
                        
                        const { error: saveError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: user.id,
                                full_name: newProfile.fullName,
                                local_currency: null,
                                selected_currencies: null,
                                subscription: newProfile.subscription,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }, {
                                onConflict: 'id'
                            });
                        
                        if (!saveError) {
                            set({ user, profile: newProfile, isLoading: false });
                        }
                    } else {
                        const newProfile: AppUser = {
                            id: user.id,
                            fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
                            local_currency: undefined,
                            selected_currencies: undefined,
                            default_account_id: undefined,
                            subscription: { plan: 'free', status: 'active', validUntil: null }
                        };
                        
                        const { error: saveError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: user.id,
                                full_name: newProfile.fullName,
                                local_currency: null,
                                selected_currencies: null,
                                subscription: newProfile.subscription,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }, {
                                onConflict: 'id'
                            });
                        
                        if (!saveError) {
                            set({ user, profile: newProfile, isLoading: false });
                        }
                    }
                } catch (error) {
                    const newProfile: AppUser = {
                        id: user.id,
                        fullName: user.user_metadata?.full_name || user.user_metadata?.fullName || 'User',
                        local_currency: undefined,
                        selected_currencies: undefined,
                        default_account_id: undefined,
                        subscription: { plan: 'free', status: 'active', validUntil: null }
                    };
                    
                    try {
                        const { error: saveError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: user.id,
                                full_name: newProfile.fullName,
                                local_currency: null,
                                selected_currencies: null,
                                subscription: newProfile.subscription,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }, {
                                onConflict: 'id'
                            });
                        
                        if (!saveError) {
                            set({ user, profile: newProfile, isLoading: false });
                        }
                    } catch (saveException) {
                        // Handle save exception
                    }
                }
            }, 100);
            
            return;
        }
        
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

  signIn: async (email: string, password: string, rememberMe: boolean = false) => {
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

      // Handle remember me functionality
      if (rememberMe) {
        saveRememberedEmail(email);
        saveRememberMePreference(true);
      } else {
        clearRememberedEmail();
        saveRememberMePreference(false);
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
      // Use setUserAndProfile to fetch the profile (required for WelcomeModal check)
      const { setUserAndProfile } = get();
      await setUserAndProfile(data.user, null);

      set({ 
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
    // Use console.error to ensure visibility in logcat
    console.error('[OAUTH] ========================================');
    console.error('[OAUTH] ========== STARTING OAUTH FLOW ==========');
    console.error('[OAUTH] Provider:', provider);
    console.error('[OAUTH] Platform:', Capacitor.getPlatform());
    console.error('[OAUTH] ========================================');
    
    set({ isLoading: true, error: null, success: null });
    try {
      const redirectUrl = `https://balanze.cash/auth/callback`;
      console.error('[OAUTH] 🔍 OAuth Configuration:');
      console.error('[OAUTH] - Redirect URL:', redirectUrl);
      console.error('[OAUTH] - Window origin:', window.location.origin);
      console.error('[OAUTH] - Current URL:', window.location.href);
      
      // Check if we're on Android
      const isAndroid = Capacitor.getPlatform() === 'android';
      console.error('[OAUTH] Is Android platform?', isAndroid);
      
      if (isAndroid && provider === 'google') {
        // Use native Google Sign-In on Android for professional UX
        console.error('[OAUTH] 📱 Android detected - using native Google Sign-In');
        try {
          // Check if native Google Sign-In is available
          if (!googleSignIn.isAvailable()) {
            console.error('[OAUTH] ⚠️ Native Google Sign-In not available, falling back to browser');
            // Fallback to browser-based OAuth
            return await this.fallbackToBrowserOAuth(provider, redirectUrl);
          }
          
          console.error('[OAUTH] 🔄 Starting native Google Sign-In...');
          const googleResult = await googleSignIn.signIn();
          
          if (!googleResult) {
            throw new Error('Google Sign-In returned no result');
          }
          
          console.error('[OAUTH] ✅ Native Google Sign-In successful');
          console.error('[OAUTH] - Email:', googleResult.email);
          console.error('[OAUTH] - Has ID token?', !!googleResult.idToken);
          
          // Exchange Google ID token with Supabase using REST API
          console.error('[OAUTH] 🔄 Exchanging Google ID token with Supabase...');
          const { supabaseUrl, supabaseAnonKey } = await import('../lib/supabase');
          const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=id_token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({
              provider: 'google',
              id_token: googleResult.idToken,
            }),
          });
          
          const tokenData = await response.json();
          
          if (!response.ok || tokenData.error) {
            console.error('[OAUTH] ❌ Supabase token exchange error:', tokenData);
            throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange token');
          }
          
          if (tokenData.access_token && tokenData.refresh_token) {
            console.error('[OAUTH] ✅ Token exchange successful');
            
            // Set the session with the tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
            });
            
            if (sessionError) {
              console.error('[OAUTH] ❌ Error setting session:', sessionError);
              throw sessionError;
            }
            
            if (sessionData?.user) {
              console.error('[OAUTH] ✅ Supabase authentication successful');
              console.error('[OAUTH] - User ID:', sessionData.user.id);
              console.error('[OAUTH] - User email:', sessionData.user.email);
              
              // Set user and profile
              await get().setUserAndProfile(sessionData.user, null);
              set({ isLoading: false });
              return { success: true };
            } else {
              throw new Error('No user data received from Supabase');
            }
          } else {
            throw new Error('Invalid token response from Supabase');
          }
        } catch (error: any) {
          console.error('[OAUTH] ❌ Native Google Sign-In error:', error);
          
          // If native sign-in fails, fallback to browser OAuth
          if (error?.message?.includes('cancelled') || error?.message?.includes('Sign in was cancelled')) {
            set({ isLoading: false });
            return { success: false, message: 'Sign in was cancelled' };
          }
          
          console.error('[OAUTH] 🔄 Falling back to browser OAuth...');
          return await this.fallbackToBrowserOAuth(provider, redirectUrl);
        }
      } else if (isAndroid && provider === 'apple') {
        // For Apple on Android, use browser OAuth (Apple Sign-In is iOS only)
        console.error('[OAUTH] 📱 Android detected - Apple Sign-In not available on Android, using browser');
        return await this.fallbackToBrowserOAuth(provider, redirectUrl);
      } else {
        // On web/iOS, use default Supabase OAuth flow
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
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: 'An unexpected error occurred during social login', isLoading: false });
      return { success: false, message: 'An unexpected error occurred during social login' };
    }
  },

  // Fallback to browser-based OAuth (for Apple on Android or when native sign-in fails)
  fallbackToBrowserOAuth: async (provider: 'google' | 'apple', redirectUrl: string) => {
    try {
      console.error('[OAUTH] 🔄 Using browser-based OAuth fallback...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true
        }
      });
      
      if (error) {
        console.error('[OAUTH] ❌ Supabase OAuth error:', error);
        throw error;
      }
      
      if (data?.url) {
        console.error('[OAUTH] 🌐 Opening browser with OAuth URL...');
        try {
          await Browser.open({ url: data.url });
          console.error('[OAUTH] ✅ Browser opened successfully');
          return { success: true };
        } catch (browserError: any) {
          console.error('[OAUTH] ⚠️ Browser.open() failed:', browserError);
          const fallbackWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
          if (fallbackWindow) {
            return { success: true };
          } else {
            throw new Error('Unable to open browser. Please ensure you have a browser installed.');
          }
        }
      } else {
        throw new Error('OAuth URL not received');
      }
    } catch (error: any) {
      console.error('[OAUTH] ❌ Browser OAuth fallback error:', error);
      let userMessage = 'Social login failed. Please try again.';
      if (error?.message?.includes('provider is not enabled')) {
        userMessage = 'Social login is not configured yet. Please use email/password login.';
      } else if (error?.message?.includes('redirect_uri_mismatch')) {
        userMessage = 'Social login configuration error. Please contact support.';
      }
      set({ error: userMessage, isLoading: false });
      return { success: false, message: userMessage };
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
      // Use hardcoded URL for Android (like OAuth), dynamic for web
      const isAndroid = Capacitor.getPlatform() === 'android';
      const redirectUrl = isAndroid 
        ? 'https://balanze.cash/auth/reset-password'
        : `${window.location.origin}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
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


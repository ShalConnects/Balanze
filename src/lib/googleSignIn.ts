import { Capacitor } from '@capacitor/core';

export interface GoogleSignInResult {
  success: boolean;
  idToken: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  id: string;
}

export interface GoogleSignInPlugin {
  signIn(): Promise<GoogleSignInResult>;
  signOut(): Promise<{ success: boolean }>;
}

// Get the plugin instance
const getGoogleSignInPlugin = (): GoogleSignInPlugin | null => {
  if (Capacitor.getPlatform() === 'android') {
    const capacitor = (window as any).Capacitor;
    console.error('[GoogleSignIn] Checking plugin availability...');
    console.error('[GoogleSignIn] - Capacitor exists?', !!capacitor);
    
    if (!capacitor) {
      console.error('[GoogleSignIn] ❌ Capacitor not available');
      return null;
    }
    
    // Try Capacitor.Plugins.GoogleSignIn (standard way for custom plugins)
    if (capacitor.Plugins) {
      console.error('[GoogleSignIn] - Capacitor.Plugins exists, keys:', Object.keys(capacitor.Plugins));
      
      if (capacitor.Plugins.GoogleSignIn) {
        console.error('[GoogleSignIn] ✅ Plugin found via Capacitor.Plugins.GoogleSignIn');
        return capacitor.Plugins.GoogleSignIn as GoogleSignInPlugin;
      }
    }
    
    // Try getPlugin method if available
    if (typeof capacitor.getPlugin === 'function') {
      try {
        const plugin = capacitor.getPlugin('GoogleSignIn');
        if (plugin) {
          console.error('[GoogleSignIn] ✅ Plugin found via getPlugin');
          return plugin as GoogleSignInPlugin;
        }
      } catch (e) {
        console.error('[GoogleSignIn] getPlugin error:', e);
      }
    }
    
    console.error('[GoogleSignIn] ❌ Plugin not found - ensure plugin is registered in MainActivity');
    console.error('[GoogleSignIn] - Available plugins:', capacitor.Plugins ? Object.keys(capacitor.Plugins) : 'none');
  }
  return null;
};

export const googleSignIn = {
  /**
   * Sign in with Google using native Android SDK
   * Returns null if not on Android or plugin not available
   */
  async signIn(): Promise<GoogleSignInResult | null> {
    if (Capacitor.getPlatform() !== 'android') {
      console.error('[GoogleSignIn] Not on Android platform');
      return null;
    }

    const plugin = getGoogleSignInPlugin();
    if (!plugin) {
      console.error('[GoogleSignIn] ❌ Plugin not available - trying direct bridge call...');
      
      // Try direct bridge call as last resort (only if Plugins.GoogleSignIn exists)
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.GoogleSignIn) {
        try {
          console.error('[GoogleSignIn] Attempting direct bridge call...');
          // Use Capacitor's native bridge directly
          const result = await capacitor.Plugins.GoogleSignIn.signIn();
          console.error('[GoogleSignIn] ✅ Direct bridge call succeeded');
          return result;
        } catch (bridgeError: any) {
          console.error('[GoogleSignIn] ❌ Direct bridge call failed:', bridgeError);
          throw bridgeError;
        }
      }
      
      console.error('[GoogleSignIn] ❌ Plugin not available - cannot use native sign-in');
      return null;
    }

    console.error('[GoogleSignIn] ✅ Plugin found, calling signIn()...');
    try {
      const result = await plugin.signIn();
      console.error('[GoogleSignIn] ✅ signIn() completed, result:', !!result);
      return result;
    } catch (error: any) {
      console.error('[GoogleSignIn] ❌ Sign in error:', error);
      console.error('[GoogleSignIn] - Error message:', error?.message);
      console.error('[GoogleSignIn] - Error code:', error?.code);
      throw error;
    }
  },

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const plugin = getGoogleSignInPlugin();
    if (plugin) {
      try {
        await plugin.signOut();
      } catch (error) {
        console.error('[GoogleSignIn] Sign out error:', error);
      }
    }
  },

  /**
   * Check if native Google Sign-In is available
   */
  isAvailable(): boolean {
    return Capacitor.getPlatform() === 'android' && getGoogleSignInPlugin() !== null;
  }
};


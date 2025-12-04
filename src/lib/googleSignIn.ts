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
    const plugin = (window as any).Capacitor?.Plugins?.GoogleSignIn;
    if (plugin) {
      return plugin as GoogleSignInPlugin;
    }
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
      return null;
    }

    const plugin = getGoogleSignInPlugin();
    if (!plugin) {
      console.error('[GoogleSignIn] Plugin not available');
      return null;
    }

    try {
      const result = await plugin.signIn();
      return result;
    } catch (error: any) {
      console.error('[GoogleSignIn] Sign in error:', error);
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


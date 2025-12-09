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

// Use the JavaScript interface directly (injected by MainActivity)
// This is more reliable than waiting for Capacitor plugin registration
const callNativeSignIn = (): Promise<GoogleSignInResult> => {
  return new Promise((resolve, reject) => {
    const callbackId = 'cb' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Set up callback handler
    (window as any).GoogleSignInCallback = (id: string, result: any) => {
      if (id === callbackId) {
        delete (window as any).GoogleSignInCallback;
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result as GoogleSignInResult);
        }
      }
    };
    
    // Call native interface
    const nativeInterface = (window as any).GoogleSignInNative;
    if (nativeInterface && nativeInterface.signIn) {
      console.error('[GoogleSignIn] ✅ Calling native interface directly');
      nativeInterface.signIn(callbackId);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if ((window as any).GoogleSignInCallback) {
          delete (window as any).GoogleSignInCallback;
          reject(new Error('Sign in timeout'));
        }
      }, 30000);
    } else {
      delete (window as any).GoogleSignInCallback;
      reject(new Error('Native interface not available'));
    }
  });
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

    // Check if native interface is available (injected by MainActivity)
    const nativeInterface = (window as any).GoogleSignInNative;
    if (!nativeInterface || !nativeInterface.signIn) {
      console.error('[GoogleSignIn] ❌ Native interface not available');
      console.error('[GoogleSignIn] - GoogleSignInNative exists?', !!nativeInterface);
      return null;
    }

    console.error('[GoogleSignIn] ✅ Native interface found, calling signIn()...');
    try {
      const result = await callNativeSignIn();
      console.error('[GoogleSignIn] ✅ signIn() completed, result:', !!result);
      return result;
    } catch (error: any) {
      console.error('[GoogleSignIn] ❌ Sign in error:', error);
      console.error('[GoogleSignIn] - Error message:', error?.message);
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


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
    
    console.error('[GoogleSignIn] 📞 Setting up native sign-in call...');
    console.error('[GoogleSignIn] - Callback ID:', callbackId);
    
    // Set up callback handler (use a unique function per call to avoid conflicts)
    const callbackHandler = (id: string, result: any) => {
      console.error('[GoogleSignIn] 📥 Callback received:', { id, hasError: !!result.error, hasResult: !!result });
      if (id === callbackId) {
        // Clean up
        if ((window as any).GoogleSignInCallback === callbackHandler) {
          delete (window as any).GoogleSignInCallback;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (result.error) {
          console.error('[GoogleSignIn] ❌ Callback error:', result.error);
          reject(new Error(result.error));
        } else {
          console.error('[GoogleSignIn] ✅ Callback success');
          resolve(result as GoogleSignInResult);
        }
      } else {
        console.error('[GoogleSignIn] ⚠️ Callback ID mismatch. Expected:', callbackId, 'Got:', id);
      }
    };
    
    // Store callback handler
    (window as any).GoogleSignInCallback = callbackHandler;
    
    // Declare timeout ID outside the if block so it can be accessed in the callback
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Call native interface
    const nativeInterface = (window as any).GoogleSignInNative;
    if (nativeInterface && typeof nativeInterface.signIn === 'function') {
      console.error('[GoogleSignIn] ✅ Calling native interface directly');
      try {
        nativeInterface.signIn(callbackId);
        console.error('[GoogleSignIn] ✅ Native signIn() called successfully');
      } catch (callError: any) {
        console.error('[GoogleSignIn] ❌ Error calling native signIn():', callError);
        delete (window as any).GoogleSignInCallback;
        reject(new Error(`Failed to call native sign-in: ${callError?.message || 'Unknown error'}`));
        return;
      }
      
      // Timeout after 30 seconds
      timeoutId = setTimeout(() => {
        console.error('[GoogleSignIn] ⏱️ Sign-in timeout after 30 seconds');
        if ((window as any).GoogleSignInCallback === callbackHandler) {
          delete (window as any).GoogleSignInCallback;
        }
        reject(new Error('Sign in timeout - no response from native interface'));
      }, 30000);
    } else {
      console.error('[GoogleSignIn] ❌ Native interface not available when calling');
      console.error('[GoogleSignIn] - nativeInterface exists?', !!nativeInterface);
      console.error('[GoogleSignIn] - signIn method exists?', !!(nativeInterface && nativeInterface.signIn));
      delete (window as any).GoogleSignInCallback;
      reject(new Error('Native interface not available'));
    }
  });
};

// Wait for GoogleSignInNative interface to be available (with timeout)
const waitForNativeInterface = (maxWaitMs: number = 2000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkInterface = () => {
      const nativeInterface = (window as any).GoogleSignInNative;
      const isAvailable = nativeInterface && typeof nativeInterface.signIn === 'function';
      
      if (isAvailable) {
        console.error('[GoogleSignIn] ✅ Native interface is now available');
        resolve(true);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed >= maxWaitMs) {
        console.error('[GoogleSignIn] ⏱️ Timeout waiting for native interface');
        console.error('[GoogleSignIn] - GoogleSignInNative exists?', !!nativeInterface);
        console.error('[GoogleSignIn] - typeof GoogleSignInNative:', typeof nativeInterface);
        if (nativeInterface) {
          console.error('[GoogleSignIn] - GoogleSignInNative.signIn exists?', typeof nativeInterface.signIn);
        }
        resolve(false);
        return;
      }
      
      // Check again in 100ms
      setTimeout(checkInterface, 100);
    };
    
    checkInterface();
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

    console.error('[GoogleSignIn] 🔍 Checking for native interface...');
    console.error('[GoogleSignIn] - GoogleSignInNative exists?', !!(window as any).GoogleSignInNative);
    console.error('[GoogleSignIn] - typeof GoogleSignInNative:', typeof (window as any).GoogleSignInNative);
    
    // Wait for native interface to be available (up to 2 seconds)
    const isAvailable = await waitForNativeInterface(2000);
    
    if (!isAvailable) {
      console.error('[GoogleSignIn] ❌ Native interface not available after waiting');
      console.error('[GoogleSignIn] - This usually means:');
      console.error('[GoogleSignIn]   1. The app was not rebuilt after adding the native interface');
      console.error('[GoogleSignIn]   2. The WebView hasn\'t fully loaded yet');
      console.error('[GoogleSignIn]   3. The JavaScript interface wasn\'t properly injected');
      return null;
    }

    const nativeInterface = (window as any).GoogleSignInNative;
    console.error('[GoogleSignIn] ✅ Native interface found, calling signIn()...');
    console.error('[GoogleSignIn] - Interface type:', typeof nativeInterface);
    console.error('[GoogleSignIn] - signIn method type:', typeof nativeInterface.signIn);
    
    try {
      const result = await callNativeSignIn();
      console.error('[GoogleSignIn] ✅ signIn() completed, result:', !!result);
      if (result) {
        console.error('[GoogleSignIn] - Email:', result.email);
        console.error('[GoogleSignIn] - Has idToken?', !!result.idToken);
      }
      return result;
    } catch (error: any) {
      console.error('[GoogleSignIn] ❌ Sign in error:', error);
      console.error('[GoogleSignIn] - Error message:', error?.message);
      console.error('[GoogleSignIn] - Error stack:', error?.stack);
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

    // Sign out is handled by the native interface if needed
    // For now, we'll just clear any cached state
    console.error('[GoogleSignIn] Sign out called');
  },

  /**
   * Check if native Google Sign-In is available
   */
  isAvailable(): boolean {
    if (Capacitor.getPlatform() !== 'android') {
      return false;
    }
    const nativeInterface = (window as any).GoogleSignInNative;
    return !!(nativeInterface && typeof nativeInterface.signIn === 'function');
  }
};


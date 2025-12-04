import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.balanze.app',
  appName: 'Balanze',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  android: {
    // Enable pull-to-refresh with overscroll
    overscrollMode: 'auto',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#3b82f6",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true
    },
    GoogleSignIn: {
      // Use your Google OAuth Web Client ID (same as configured in Supabase)
      // Get this from: Google Cloud Console > APIs & Services > Credentials
      // It should be the same Client ID you use for web OAuth
      serverClientId: process.env.VITE_GOOGLE_CLIENT_ID || ""
    }
  }
};

export default config;

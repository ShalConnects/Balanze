/**
 * Platform detection utilities
 * Detects if the app is running in Android/Capacitor environment
 */

/**
 * Checks if the app is running in a Capacitor Android app
 * @returns true if running in Android Capacitor app, false otherwise
 */
export const isAndroidApp = (): boolean => {
  // Check for Capacitor
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
  
  // Check for Android user agent
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  
  return isCapacitor && isAndroid;
};

/**
 * Checks if the app is running in a Capacitor environment (any platform)
 * @returns true if running in Capacitor, false otherwise
 */
export const isCapacitorApp = (): boolean => {
  return typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
};

/**
 * Checks if the app is running in a web browser
 * @returns true if running in web browser, false otherwise
 */
export const isWebBrowser = (): boolean => {
  return !isCapacitorApp();
};


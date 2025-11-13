/**
 * First launch detection utilities
 * Tracks whether this is the user's first time launching the app
 */

const FIRST_LAUNCH_KEY = 'hasLaunchedBefore';

/**
 * Checks if this is the user's first launch
 * @returns true if first launch, false otherwise
 */
export const isFirstLaunch = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hasLaunched = localStorage.getItem(FIRST_LAUNCH_KEY);
  return hasLaunched === null;
};

/**
 * Marks that the user has launched the app before
 * Call this after showing the welcome screen
 */
export const markAsLaunched = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
};

/**
 * Resets the first launch flag (useful for testing)
 */
export const resetFirstLaunch = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(FIRST_LAUNCH_KEY);
};


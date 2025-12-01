/**
 * Authentication storage utilities
 * Handles storing and retrieving remembered email (never passwords)
 */

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';
const REMEMBER_ME_PREFERENCE_KEY = 'rememberMePreference';

/**
 * Saves the email address for "Remember Me" functionality
 * @param email - The email address to save
 */
export const saveRememberedEmail = (email: string): void => {
  if (typeof window === 'undefined') return;
  
  if (email && email.trim()) {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
  }
};

/**
 * Retrieves the saved email address
 * @returns The saved email or null if not found
 */
export const getRememberedEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const email = localStorage.getItem(REMEMBERED_EMAIL_KEY);
  return email ? email.trim() : null;
};

/**
 * Clears the saved email address
 */
export const clearRememberedEmail = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
};

/**
 * Saves the "Remember Me" preference
 * @param shouldRemember - Whether to remember the user (persist session)
 */
export const saveRememberMePreference = (shouldRemember: boolean): void => {
  if (typeof window === 'undefined') return;
  
  if (shouldRemember) {
    localStorage.setItem(REMEMBER_ME_PREFERENCE_KEY, 'true');
  } else {
    localStorage.setItem(REMEMBER_ME_PREFERENCE_KEY, 'false');
  }
};

/**
 * Retrieves the "Remember Me" preference
 * @returns true if should remember, false if not, null if not set
 */
export const getRememberMePreference = (): boolean | null => {
  if (typeof window === 'undefined') return null;
  
  const preference = localStorage.getItem(REMEMBER_ME_PREFERENCE_KEY);
  if (preference === null) return null;
  return preference === 'true';
};

/**
 * Clears the "Remember Me" preference
 */
export const clearRememberMePreference = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(REMEMBER_ME_PREFERENCE_KEY);
};


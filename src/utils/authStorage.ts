/**
 * Authentication storage utilities
 * Handles storing and retrieving remembered email (never passwords)
 */

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

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


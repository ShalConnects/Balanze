import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { Account } from '../types';

/**
 * Get the user's default account with smart fallback logic
 * @returns The default account ID or empty string if none available
 */
export const getDefaultAccountId = (): string => {
  const { profile } = useAuthStore.getState();
  const { accounts } = useFinanceStore.getState();
  
  // 1. User's explicitly set default account (if it exists and is active)
  if (profile?.default_account_id) {
    const defaultAccount = accounts.find(a => a.id === profile.default_account_id && a.isActive);
    if (defaultAccount) {
      return defaultAccount.id;
    }
  }
  
  // 2. First active checking account (most common for transactions)
  const checkingAccount = accounts.find(a => a.type === 'checking' && a.isActive);
  if (checkingAccount) {
    return checkingAccount.id;
  }
  
  // 3. First active account (any type)
  const firstActive = accounts.find(a => a.isActive);
  if (firstActive) {
    return firstActive.id;
  }
  
  // 4. No default available
  return '';
};

/**
 * Get the default account object (not just the ID)
 * @returns The default account object or null if none available
 */
export const getDefaultAccount = (): Account | null => {
  const defaultAccountId = getDefaultAccountId();
  if (!defaultAccountId) return null;
  
  const { accounts } = useFinanceStore.getState();
  return accounts.find(a => a.id === defaultAccountId) || null;
};

/**
 * Set a new default account for the user
 * @param accountId The account ID to set as default
 * @returns Promise<boolean> Success status
 */
export const setDefaultAccount = async (accountId: string): Promise<boolean> => {
  try {
    const { updateProfile } = useAuthStore.getState();
    const result = await updateProfile({ default_account_id: accountId });
    return !result.error;
  } catch (error) {

    return false;
  }
};

/**
 * Clear the user's default account preference
 * @returns Promise<boolean> Success status
 */
export const clearDefaultAccount = async (): Promise<boolean> => {
  try {
    const { updateProfile } = useAuthStore.getState();
    const result = await updateProfile({ default_account_id: undefined });
    return !result.error;
  } catch (error) {

    return false;
  }
};

/**
 * Check if an account is the user's default account
 * @param accountId The account ID to check
 * @returns boolean
 */
export const isDefaultAccount = (accountId: string): boolean => {
  const { profile } = useAuthStore.getState();
  return profile?.default_account_id === accountId;
};


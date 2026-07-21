import type { User } from '@supabase/supabase-js';
import { getRememberMePreference, markPersistentLogin } from './authStorage';
import { isAndroidApp } from './platformDetection';

/** Web only — Android stays signed in until manual sign-out */
export const shouldRejectStoredSession = () =>
  !isAndroidApp() && getRememberMePreference() === false;

export const persistAndroidLogin = () => {
  if (isAndroidApp()) markPersistentLogin();
};

export const isConfirmedUser = (user: User | null | undefined): boolean =>
  !!user?.email_confirmed_at;

export async function syncUserFromSession(
  user: User | null | undefined,
  setUserAndProfile: (user: User | null, profile: null) => void | Promise<void>
): Promise<void> {
  if (isConfirmedUser(user)) {
    try {
      await setUserAndProfile(user!, null);
      return;
    } catch {
      // Continue so bootstrap is not blocked
    }
  }
  await setUserAndProfile(null, null);
}

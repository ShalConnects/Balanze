import type { User } from '@supabase/supabase-js';
import { getRememberMePreference } from './authStorage';

export const shouldRejectStoredSession = () => getRememberMePreference() === false;

export const isConfirmedUser = (user: User | null | undefined): boolean =>
  !!user?.email_confirmed_at;

export async function syncUserFromSession(
  user: User | null | undefined,
  setUserAndProfile: (user: User | null, profile: null) => Promise<void>
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

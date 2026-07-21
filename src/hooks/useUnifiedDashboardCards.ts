import { usePersistedToggle } from './usePersistedToggle';

/** Flip off in Widget Settings → Display to restore classic purple-gradient cards. */
export const DASHBOARD_UNIFIED_CARDS_KEY = 'dashboardUnifiedCards';

export function useUnifiedDashboardCards(userId?: string | null) {
  return usePersistedToggle(DASHBOARD_UNIFIED_CARDS_KEY, true, userId);
}

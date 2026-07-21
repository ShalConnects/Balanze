import { useCallback, useEffect, useState } from 'react';
import { getPreference, setPreference } from '../lib/userPreferences';

function readLocal(key: string, fallback: boolean): boolean {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Boolean preference: localStorage + same-tab CustomEvent sync + optional DB persistence.
 */
export function usePersistedToggle(
  key: string,
  defaultValue = true,
  userId?: string | null,
  options?: { syncFromDb?: boolean }
): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => readLocal(key, defaultValue));

  useEffect(() => {
    const sync = () => setValue(readLocal(key, defaultValue));
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) sync();
    };
    const eventName = `${key}Changed`;
    window.addEventListener('storage', onStorage);
    window.addEventListener(eventName, sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(eventName, sync);
    };
  }, [key, defaultValue]);

  useEffect(() => {
    if (!userId || !options?.syncFromDb) return;
    let cancelled = false;
    getPreference(userId, key, defaultValue)
      .then((v) => {
        if (cancelled) return;
        setValue(v);
        localStorage.setItem(key, JSON.stringify(v));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, key, defaultValue, options?.syncFromDb]);

  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(`${key}Changed`));
      if (userId) setPreference(userId, key, next).catch(() => {});
    },
    [key, userId]
  );

  return [value, set];
}

/** Map main-dashboard widget ids → preference keys (single source of truth). */
export const MAIN_WIDGET_PREF_KEYS = {
  donations: 'showDonationsSavingsWidget',
  purchases: 'showPurchasesWidget',
  'lend-borrow': 'showLendBorrowWidget',
  transfers: 'showTransferWidget',
  clients: 'showClientsWidget',
  learning: 'showLearningWidget',
  investments: 'showInvestmentsWidget',
  'prize-bonds': 'showPrizeBondsWidget',
} as const;

export type MainWidgetId = keyof typeof MAIN_WIDGET_PREF_KEYS;

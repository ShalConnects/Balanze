import { useAuthStore } from '../store/authStore';

export const normalizeCurrencyCode = (currency?: string | null) => currency?.trim().toUpperCase() || '';

export type ProfileCurrencyPrefs = {
  local_currency?: string | null;
  selected_currencies?: string[] | null;
};

/** Primary currency from profile: local_currency → first selected → USD */
export const getProfilePreferredCurrency = (profile?: ProfileCurrencyPrefs | null) =>
  profile?.local_currency?.trim()
  || profile?.selected_currencies?.[0]?.trim()
  || 'USD';

export const findCurrencyInList = (candidate: string | null | undefined, available: string[]) =>
  available.find(c => normalizeCurrencyCode(c) === normalizeCurrencyCode(candidate));

export const resolveDefaultCurrency = (
  availableCurrencies: string[],
  preferredCurrency?: string | null,
  fallbackCurrency?: string | null
) =>
  findCurrencyInList(preferredCurrency, availableCurrencies)
  ?? findCurrencyInList(fallbackCurrency, availableCurrencies)
  ?? availableCurrencies[0]
  ?? '';

/** Keep `current` if valid; otherwise resolve default. Use allowEmpty for "All currencies" filters. */
export const syncCurrencyFilter = (
  current: string,
  available: string[],
  preferred?: string | null,
  options?: { allowEmpty?: boolean; fallbackCurrency?: string | null }
): string => {
  if (options?.allowEmpty && !normalizeCurrencyCode(current)) return '';
  if (!available.length) return current.trim();
  return findCurrencyInList(current, available)
    ?? resolveDefaultCurrency(available, preferred, options?.fallbackCurrency);
};

export const usePreferredCurrency = () => {
  const { profile } = useAuthStore();
  const preferredCurrency = getProfilePreferredCurrency(profile);

  return {
    preferredCurrency,
    hasPreferredCurrency: Boolean(profile?.local_currency || profile?.selected_currencies?.[0]),
    isDefaultCurrency: preferredCurrency === 'USD'
  };
};

import { useAuthStore } from '../store/authStore';

export const normalizeCurrencyCode = (currency?: string | null) => currency?.trim().toUpperCase() || '';

export const resolveDefaultCurrency = (
  availableCurrencies: string[],
  preferredCurrency?: string | null
) => {
  const preferred = normalizeCurrencyCode(preferredCurrency);
  if (preferred) {
    const matched = availableCurrencies.find(c => normalizeCurrencyCode(c) === preferred);
    if (matched) return matched;
  }
  return availableCurrencies[0] || '';
};

export const usePreferredCurrency = () => {
  const { profile } = useAuthStore();
  
  // Get user's preferred currency, fallback to USD
  const preferredCurrency = profile?.local_currency || 'USD';
  
  return {
    preferredCurrency,
    hasPreferredCurrency: Boolean(profile?.local_currency),
    isDefaultCurrency: !profile?.local_currency || profile.local_currency === 'USD'
  };
}; 


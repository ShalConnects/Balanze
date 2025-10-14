import { useAuthStore } from '../store/authStore';

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


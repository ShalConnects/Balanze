import React, { useState, useEffect, useMemo } from 'react';
import { Check, Star, CreditCard, Wallet, Building, Search, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { getCurrencySymbol } from '../../utils/currency';
import { getAllCurrencies, getPopularCurrencies, getCurrencyName } from '../../utils/currencies';
import { setDefaultAccount } from '../../utils/defaultAccount';
import { showToast } from '../../lib/toast';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { CustomDropdown } from '../Purchases/CustomDropdown';

interface CurrencySettingsProps {
  hideTitle?: boolean;
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({ hideTitle = false }) => {
  const { profile, updateProfile } = useAuthStore();
  const { accounts, fetchAccounts } = useFinanceStore();
  const { isPremiumPlan: isPremium } = usePlanFeatures();
  
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [localCurrency, setLocalCurrency] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDefaultAccount, setSelectedDefaultAccount] = useState<string>('');
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');

  // Get all available currencies
  const allCurrencies = useMemo(() => {
    const popular = getPopularCurrencies();
    const all = getAllCurrencies();
    
    // Combine: popular first, then rest (excluding duplicates)
    const popularSet = new Set(popular);
    const rest = all.filter(c => !popularSet.has(c));
    
    return [...popular, ...rest];
  }, []);

  // Filter and sort currencies: selected currencies first, then rest
  const availableCurrencies = useMemo(() => {
    let filtered = allCurrencies;
    
    // Filter by search query if provided
    if (currencySearchQuery.trim()) {
      const query = currencySearchQuery.toLowerCase().trim();
      filtered = allCurrencies.filter(currency => {
        const code = currency.toLowerCase();
        const name = getCurrencyName(currency).toLowerCase();
        return code.includes(query) || name.includes(query);
      });
    }
    
    // Sort: selected currencies first, then rest
    return filtered.sort((a, b) => {
      const aSelected = selectedCurrencies.includes(a);
      const bSelected = selectedCurrencies.includes(b);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0; // Keep original order for both selected or both unselected
    });
  }, [allCurrencies, currencySearchQuery, selectedCurrencies]);

  // Load current settings
  useEffect(() => {
    if (profile) {
      setSelectedCurrencies(profile.selected_currencies || []);
      setLocalCurrency(profile.local_currency || profile.selected_currencies?.[0] || 'USD');
      setSelectedDefaultAccount(profile.default_account_id || '');
    }
  }, [profile]);

  // Fetch accounts when component mounts
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const toggleCurrency = async (currency: string) => {
    if (isUpdating) return;

    // Check plan limits for free users
    if (!isPremium) {
      const isCurrentlySelected = selectedCurrencies.includes(currency);
      const wouldHaveZeroCurrencies = isCurrentlySelected && selectedCurrencies.length === 1;
      
      if (wouldHaveZeroCurrencies) {
        showToast.error('You must have at least 1 currency selected. Select a different currency first.');
        return;
      }
      
      if (!isCurrentlySelected && selectedCurrencies.length >= 1) {
        showToast.error('Currency limit reached! Free plan allows only 1 currency. Upgrade to Premium for unlimited currencies.');
        return;
      }
    }

    setIsUpdating(true);
    
    try {
      const newCurrencies = selectedCurrencies.includes(currency)
        ? selectedCurrencies.filter(c => c !== currency)
        : [...selectedCurrencies, currency];

      setSelectedCurrencies(newCurrencies);
      
      const result = await updateProfile({
        selected_currencies: newCurrencies
      });

      if (result.error) {
        throw result.error;
      }

      showToast.success('Currency preferences updated');
    } catch (error) {

      showToast.error('Failed to update currency preferences');
      // Revert the state
      setSelectedCurrencies(profile?.selected_currencies || []);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateLocalCurrency = async (currency: string) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      const result = await updateProfile({
        local_currency: currency
      });

      if (result.error) {
        throw result.error;
      }

      setLocalCurrency(currency);
      showToast.success('Local currency updated');
    } catch (error) {

      showToast.error('Failed to update local currency');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetDefaultAccount = async (accountId: string) => {
    try {
      setSelectedDefaultAccount(accountId);
      const success = await setDefaultAccount(accountId);
      if (success) {
        showToast.success('Default account updated');
      } else {
        showToast.error('Failed to update default account');
        // Revert on failure
        setSelectedDefaultAccount(profile?.default_account_id || '');
      }
    } catch (error) {

      showToast.error('Failed to update default account');
      // Revert on failure
      setSelectedDefaultAccount(profile?.default_account_id || '');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <CreditCard className="w-4 h-4" />;
      case 'savings': return <Building className="w-4 h-4" />;
      case 'cash': return <Wallet className="w-4 h-4" />;
      case 'investment': return <Building className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  const activeAccounts = accounts.filter(account => account.isActive && account.type !== 'savings');

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6 px-1 sm:px-0">
      {/* Page Header */}
      {!hideTitle && (
        <div className="mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">General Settings</h2>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Manage your currency preferences, default account, and notification settings
          </p>
        </div>
      )}

      {/* Default Account and Current Selection - Side by Side with Glassmorphism */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        {/* Default Account Section - Glassmorphism Card */}
        {activeAccounts.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4 lg:p-5 xl:p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 mb-2.5 sm:mb-3 lg:mb-4">
              <div className="p-1.5 sm:p-2 lg:p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex-shrink-0 shadow-sm">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">Default Account</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 break-words">Pre-selected for new transactions</p>
              </div>
            </div>
            
            <div className="relative">
              <CustomDropdown
                options={activeAccounts.map(account => ({
                  value: account.id,
                  label: `${account.name} (${account.type}) • ${getCurrencySymbol(account.currency)}${Number(account.calculated_balance).toLocaleString()}`,
                  icon: getAccountIcon(account.type)
                }))}
                value={selectedDefaultAccount}
                onChange={handleSetDefaultAccount}
                placeholder="Select default account"
                fullWidth={true}
              />
            </div>
          </div>
        )}

        {/* Current Selection Summary - Glassmorphism Card */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4 lg:p-5 xl:p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 mb-2.5 sm:mb-3 lg:mb-4">
            <div className="p-1.5 sm:p-2 lg:p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl flex-shrink-0 shadow-sm">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">Current Selection</h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 break-words">Your active preferences</p>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-2.5 lg:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 sm:min-w-[120px] lg:min-w-[130px] flex-shrink-0">Primary Currency:</span>
              <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium break-words min-w-0">{localCurrency} ({getCurrencySymbol(localCurrency)})</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 sm:min-w-[120px] lg:min-w-[130px] flex-shrink-0">Selected Currencies:</span>
              <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium break-words min-w-0">{selectedCurrencies.join(', ') || 'None'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 sm:min-w-[120px] lg:min-w-[130px] flex-shrink-0">Default Account:</span>
              <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium break-words min-w-0">
                {selectedDefaultAccount && activeAccounts.find(acc => acc.id === selectedDefaultAccount) 
                  ? `${activeAccounts.find(acc => acc.id === selectedDefaultAccount)?.name} (${activeAccounts.find(acc => acc.id === selectedDefaultAccount)?.type})`
                  : 'None selected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Banner for Free Users - Glassmorphism */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/80 to-amber-50/80 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-start gap-2.5 sm:gap-3 lg:gap-4">
            <div className="flex-shrink-0 p-1.5 sm:p-2 lg:p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg sm:rounded-xl shadow-sm">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-amber-900 dark:text-amber-200 mb-1 sm:mb-1.5 lg:mb-2">
                Currency Selection Locked
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed break-words">
                Free plan allows only 1 currency. Your current currency cannot be changed.
              </p>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-medium mt-1.5 sm:mt-2 lg:mt-2.5 break-words">
                <strong>Upgrade to Premium</strong> to use multiple currencies and unlock full currency management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Currency Settings - Glassmorphism Design */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800/80 dark:via-gray-800/80 dark:to-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4 lg:p-5 xl:p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 mb-3 sm:mb-4 lg:mb-5">
          <div className="p-1.5 sm:p-2 lg:p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">Currency Settings</h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 break-words">
              {isPremium 
                ? "Select one or more currencies. Pick a primary currency for forms and default display."
                : "Free plan allows only 1 currency. Upgrade to Premium to use multiple currencies."
              }
            </p>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search currency (e.g., USD, Dollar, Euro)..."
            value={currencySearchQuery}
            onChange={(e) => setCurrencySearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {currencySearchQuery && (
            <button
              onClick={() => setCurrencySearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results count */}
        {currencySearchQuery && (
          <div className="mb-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {availableCurrencies.length === 0 ? (
              <span>No currencies found matching "{currencySearchQuery}"</span>
            ) : (
              <span>Found {availableCurrencies.length} {availableCurrencies.length === 1 ? 'currency' : 'currencies'}</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 sm:gap-2.5 lg:gap-3">
          {/* Compact Scrollable Currency Grid - 2 rows only */}
          {availableCurrencies.length > 0 ? (
            <div className="w-full overflow-y-auto" style={{ maxHeight: '140px' }}>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                {availableCurrencies.map((currency) => {
              const isSelected = selectedCurrencies.includes(currency);
              const isPrimary = localCurrency === currency;
              const isDisabled = !isPremium;
              
              return (
                <div
                  key={currency}
                  className={`group relative p-2 rounded-lg border-2 transition-all duration-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm min-w-0 ${
                    isSelected
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                  } ${isPrimary ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 ring-offset-1' : ''} ${
                    isDisabled 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'cursor-pointer hover:shadow-lg'
                  }`}
                  onClick={() => !isDisabled && toggleCurrency(currency)}
                >
                  <div className="text-center min-w-0">
                    <div className="text-lg font-bold text-gray-900 dark:text-white mb-1 leading-none">
                      {getCurrencySymbol(currency)}
                    </div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{currency}</div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 p-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-sm">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    {isPrimary && (
                      <div className="absolute bottom-1 right-1 p-0.5 bg-yellow-500 rounded-full shadow-sm">
                        <Star className="w-2.5 h-2.5 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  {isSelected && !isPrimary && isPremium && (
                    <button
                      className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100 whitespace-nowrap z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLocalCurrency(currency);
                      }}
                    >
                      Set Primary
                    </button>
                  )}
                </div>
                );
              })}
              </div>
            </div>
          ) : (
            <div className="w-full text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No currencies found matching "{currencySearchQuery}"</p>
              <button
                onClick={() => setCurrencySearchQuery('')}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tip - Glassmorphism */}
      <div className="block sm:hidden bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-3 sm:p-3.5 shadow-sm">
        <div className="flex items-start gap-2 sm:gap-2.5">
          <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0">
            <span className="text-sm sm:text-base">💡</span>
          </div>
          <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed break-words">
            <strong className="font-semibold">Tip:</strong> Tap a currency to select/deselect. Tap "Set Primary" to make it your primary currency.
          </p>
        </div>
      </div>

    </div>
  );
};


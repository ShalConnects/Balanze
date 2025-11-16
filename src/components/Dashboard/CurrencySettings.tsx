import React, { useState, useEffect } from 'react';
import { Check, Star, CreditCard, Wallet, Building } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { getCurrencySymbol } from '../../utils/currency';
import { setDefaultAccount } from '../../utils/defaultAccount';
import { showToast } from '../../lib/toast';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { CustomDropdown } from '../Purchases/CustomDropdown';

interface CurrencySettingsProps {
  hideTitle?: boolean;
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = () => {
  const { profile, updateProfile } = useAuthStore();
  const { accounts, fetchAccounts } = useFinanceStore();
  const { isPremiumPlan: isPremium } = usePlanFeatures();
  
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [localCurrency, setLocalCurrency] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDefaultAccount, setSelectedDefaultAccount] = useState<string>('');

  // Available currencies
  const availableCurrencies = ['USD', 'BDT', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

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
    <div className="space-y-5 sm:space-y-6">
      {/* Default Account and Current Selection - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Default Account Section - Enhanced Card */}
        {activeAccounts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3.5 sm:p-4 md:p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex-shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">Default Account</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">Pre-selected for new transactions</p>
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

        {/* Current Selection Summary - Enhanced Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3.5 sm:p-4 md:p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex-shrink-0">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">Current Selection</h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">Your active preferences</p>
            </div>
          </div>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 sm:min-w-[120px] flex-shrink-0">Primary Currency:</span>
              <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium break-words">{localCurrency} ({getCurrencySymbol(localCurrency)})</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 sm:min-w-[120px] flex-shrink-0">Selected Currencies:</span>
              <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium break-words">{selectedCurrencies.join(', ') || 'None'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 sm:min-w-[120px] flex-shrink-0">Default Account:</span>
              <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium break-words">
                {selectedDefaultAccount && activeAccounts.find(acc => acc.id === selectedDefaultAccount) 
                  ? `${activeAccounts.find(acc => acc.id === selectedDefaultAccount)?.name} (${activeAccounts.find(acc => acc.id === selectedDefaultAccount)?.type})`
                  : 'None selected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Banner for Free Users */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 sm:p-4 md:p-5 shadow-sm">
          <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
            <div className="flex-shrink-0 p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-amber-900 dark:text-amber-200 mb-1 sm:mb-1.5">
                Currency Selection Locked
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed break-words">
                Free plan allows only 1 currency. Your current currency cannot be changed.
              </p>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-medium mt-1.5 sm:mt-2 break-words">
                <strong>Upgrade to Premium</strong> to use multiple currencies and unlock full currency management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Currency Settings - Enhanced Design */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3.5 sm:p-4 md:p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">Currency Settings</h4>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">
              {isPremium 
                ? "Select one or more currencies. Pick a primary currency for forms and default display."
                : "Free plan allows only 1 currency. Upgrade to Premium to use multiple currencies."
              }
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {/* Mobile Layout */}
          <div className="w-full grid grid-cols-2 gap-2.5 sm:hidden">
            {availableCurrencies.map((currency) => {
              const isSelected = selectedCurrencies.includes(currency);
              const isPrimary = localCurrency === currency;
              const isDisabled = !isPremium;
              
              return (
                <div
                  key={currency}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-gray-700 ${
                    isSelected
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${isPrimary ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 ring-offset-1' : ''} ${
                    isDisabled 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'cursor-pointer hover:shadow-sm'
                  }`}
                  onClick={() => !isDisabled && toggleCurrency(currency)}
                >
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">
                      {getCurrencySymbol(currency)}
                    </div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300">{currency}</div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 p-1 bg-blue-600 rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {isPrimary && (
                      <div className="absolute bottom-2 right-2 p-1 bg-yellow-500 rounded-full">
                        <Star className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  {isSelected && !isPrimary && isPremium && (
                    <button
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md"
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
          
          {/* Desktop/Tablet Layout */}
          <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2.5 sm:gap-3 w-full">
            {availableCurrencies.map((currency) => {
              const isSelected = selectedCurrencies.includes(currency);
              const isPrimary = localCurrency === currency;
              const isDisabled = !isPremium;
              
              return (
                <div
                  key={currency}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-gray-700 ${
                    isSelected
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${isPrimary ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 ring-offset-1' : ''} ${
                    isDisabled 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'cursor-pointer hover:shadow-lg'
                  }`}
                  onClick={() => !isDisabled && toggleCurrency(currency)}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {getCurrencySymbol(currency)}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{currency}</div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 p-1.5 bg-blue-600 rounded-full shadow-sm">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {isPrimary && (
                      <div className="absolute bottom-2 right-2 p-1.5 bg-yellow-500 rounded-full shadow-sm">
                        <Star className="w-3.5 h-3.5 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  {isSelected && !isPrimary && isPremium && (
                    <button
                      className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100"
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
      </div>

      {/* Mobile Tip */}
      <div className="block sm:hidden bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0">
            <span className="text-base">💡</span>
          </div>
          <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <strong className="font-semibold">Tip:</strong> Tap a currency to select/deselect. Tap "Set Primary" to make it your primary currency.
          </p>
        </div>
      </div>

    </div>
  );
};


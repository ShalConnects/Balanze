import React, { useState, useEffect } from 'react';
import { Check, Star, CreditCard, Wallet, PiggyBank, Building } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6">
      {/* Default Account and Current Selection - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Default Account Section - Compact Dropdown */}
        {activeAccounts.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 sm:p-4 border border-blue-200/50 dark:border-blue-800/50">
            <div className="mb-4">
              <h3 className="text-md font-medium text-gradient-primary mb-1">Default Account</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Choose which account is pre-selected when creating new transactions</p>
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

        {/* Current Selection Summary */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3 sm:p-4">
          <h4 className="text-md font-medium text-gradient-primary mb-2">Current Selection</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li><strong>Primary Currency:</strong> {localCurrency} ({getCurrencySymbol(localCurrency)})</li>
            <li><strong>Selected Currencies:</strong> {selectedCurrencies.join(', ')}</li>
            <li><strong>Default Account:</strong> {
              selectedDefaultAccount && activeAccounts.find(acc => acc.id === selectedDefaultAccount) 
                ? `${activeAccounts.find(acc => acc.id === selectedDefaultAccount)?.name} (${activeAccounts.find(acc => acc.id === selectedDefaultAccount)?.type})`
                : 'None selected'
            }</li>
          </ul>
        </div>
      </div>

      {/* Upgrade Banner for Free Users */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Currency Selection Locked
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Free plan allows only 1 currency. Your current currency cannot be changed. 
                <br />
                <strong>Upgrade to Premium</strong> to use multiple currencies and unlock full currency management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Currency Settings - matching your existing design */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 sm:p-4 border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-md font-medium text-gradient-primary">Currency Settings</h4>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
          {isPremium 
            ? "Select one or more currencies. Pick a primary currency for forms and default display."
            : "Free plan allows only 1 currency. Upgrade to Premium to use multiple currencies."
          }
        </p>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
          {availableCurrencies.map((currency) => {
            const isSelected = selectedCurrencies.includes(currency);
            const isPrimary = localCurrency === currency;
            const isDisabled = !isPremium; // Free users can't interact with any currency
            
            return (
              <div
                key={currency}
                className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-800/40 dark:via-indigo-800/40 dark:to-purple-800/40'
                    : 'border-gray-200 dark:border-gray-600'
                } ${isPrimary ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''} ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-500'
                }`}
                onClick={() => !isDisabled && toggleCurrency(currency)}
              >
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {getCurrencySymbol(currency)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{currency}</div>
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  {isPrimary && (
                    <div className="absolute bottom-1 right-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    </div>
                  )}
                </div>
                {isSelected && !isPrimary && isPremium && (
                  <button
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLocalCurrency(currency);
                    }}
                  >
                    Set
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Tip */}
      <div className="block sm:hidden bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          💡 <strong>Tip:</strong> Tap a currency to select/deselect. Tap "Set" to make it primary.
        </p>
      </div>

    </div>
  );
};


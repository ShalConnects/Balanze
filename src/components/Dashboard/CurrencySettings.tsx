import React, { useState, useEffect } from 'react';
import { Check, Star, AlertCircle, CreditCard, Wallet, PiggyBank, Building, Info, Monitor, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { getCurrencySymbol } from '../../utils/currency';
import { setDefaultAccount, getDefaultAccount, isDefaultAccount } from '../../utils/defaultAccount';
import { showToast } from '../../lib/toast';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';
import { CustomDropdown } from '../Purchases/CustomDropdown';

interface CurrencySettingsProps {
  hideTitle?: boolean;
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({ hideTitle = false }) => {
  const { profile, updateProfile } = useAuthStore();
  const { accounts, fetchAccounts } = useFinanceStore();
  const { isPremium } = usePlanFeatures();
  const navigate = useNavigate();
  
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [localCurrency, setLocalCurrency] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDefaultAccount, setSelectedDefaultAccount] = useState<string>('');

  // Available currencies (matching your existing list)
  const availableCurrencies = ['USD', 'BDT', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

  // Load current settings
  useEffect(() => {
    if (profile) {
      setSelectedCurrencies(profile.selected_currencies || []);
      setLocalCurrency(profile.local_currency || 'USD');
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
      const currentCount = selectedCurrencies.length;
      const isCurrentlySelected = selectedCurrencies.includes(currency);
      
      if (!isCurrentlySelected && currentCount >= 1) {
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
      console.error('Error updating currencies:', error);
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
      console.error('Error updating local currency:', error);
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
      console.error('Error setting default account:', error);
      showToast.error('Failed to update default account');
      // Revert on failure
      setSelectedDefaultAccount(profile?.default_account_id || '');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <CreditCard className="w-4 h-4" />;
      case 'savings': return <PiggyBank className="w-4 h-4" />;
      case 'cash': return <Wallet className="w-4 h-4" />;
      case 'investment': return <Building className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  const activeAccounts = accounts.filter(account => account.isActive);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Currency Settings - matching your existing design */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Currency Settings</h4>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
          Select one or more currencies. Pick a primary currency for forms and default display.
        </p>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
          {availableCurrencies.map((currency) => {
            const isSelected = selectedCurrencies.includes(currency);
            const isPrimary = localCurrency === currency;
            const isDisabled = !isPremium && !isSelected && selectedCurrencies.length >= 1;
            
            return (
              <div
                key={currency}
                className={`relative p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } ${isPrimary ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''} ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
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
                {isSelected && !isPrimary && (
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

      {/* Default Account and Current Selection - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Default Account Section - Compact Dropdown */}
        {activeAccounts.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-green-200 dark:border-gray-600">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">🏦 Default Account</h3>
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Current Selection</h4>
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

      {/* Mobile Tip */}
      <div className="block sm:hidden bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          💡 <strong>Tip:</strong> Tap a currency to select/deselect. Tap "Set" to make it primary.
        </p>
      </div>

      {/* Notification Settings - keeping your existing structure */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-blue-200 dark:border-gray-600">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🔔 Notification Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Configure all your notification preferences in one place</p>
        </div>
        
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">Overdue Payments</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Bills past due date</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" defaultChecked />
              </label>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">Due Soon Reminders</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Bills due within 3 days</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" defaultChecked />
              </label>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">Low Balance Alerts</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Account balance is low</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" defaultChecked />
              </label>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">New Features</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">New features and improvements</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" defaultChecked />
              </label>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">Account Changes</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Changes to your accounts</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" defaultChecked />
              </label>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-xs mr-2">📱</span>
            Communication Channels
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <Monitor className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">In-App Notifications</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Show notifications in app</span>
                  </div>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" defaultChecked />
              </label>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">Email Notifications</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Send emails for alerts</span>
                  </div>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full text-xs mr-2">⏰</span>
            Notification Frequency
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">Real Time</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Immediate notifications as they happen</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" defaultChecked />
              </label>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">Daily Digest</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Summary at end of each day</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" defaultChecked />
              </label>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">Monthly Report</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Comprehensive monthly insights</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
              </label>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">Weekly Summary</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Weekly roundup of activity</span>
                </div>
                <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
              </label>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">💡 You can enable multiple frequency options. Higher priority options take precedence.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

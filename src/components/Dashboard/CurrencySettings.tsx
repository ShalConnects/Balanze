import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { notificationPreferencesService, NotificationPreferences } from '../../lib/notificationPreferences';
import { toast } from 'sonner';
import { Check, Globe, Star, Save, RotateCcw } from 'lucide-react';
import { NotificationSettings } from './NotificationSettings';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'BDT', label: 'BDT - Bangladeshi Taka', symbol: '৳' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
];

export const CurrencySettings: React.FC = () => {
  const { profile, updateProfile } = useAuthStore();
  const { features, isFreePlan } = usePlanFeatures();
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(profile?.selected_currencies || (profile?.local_currency ? [profile.local_currency] : ['USD']));
  const [primaryCurrency, setPrimaryCurrency] = useState<string>(profile?.local_currency || 'USD');
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [notificationDirty, setNotificationDirty] = useState(false);

  // --- Fix: Sync state with profile after refresh/profile update ---
  useEffect(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      setSelectedCurrencies(profile.selected_currencies);
      // Use profile.local_currency as primary if it's in the selection, otherwise first selected
      if (profile.local_currency && profile.selected_currencies.includes(profile.local_currency)) {
        setPrimaryCurrency(profile.local_currency);
      } else {
        setPrimaryCurrency(profile.selected_currencies[0]);
      }
    } else if (profile?.local_currency) {
      setSelectedCurrencies([profile.local_currency]);
      setPrimaryCurrency(profile.local_currency);
    } else {
      setSelectedCurrencies(['USD']);
      setPrimaryCurrency('USD');
    }
  }, [profile?.selected_currencies, profile?.local_currency]);

  // Load notification preferences
  useEffect(() => {
    if (profile?.id) {
      loadNotificationPreferences();
    }
  }, [profile?.id]);

  const loadNotificationPreferences = async () => {
    if (!profile?.id) return;
    
    try {
      const prefs = await notificationPreferencesService.getPreferences(profile.id);
      setNotificationPreferences(prefs);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const toggleCurrency = (currency: string) => {
    if (selectedCurrencies.includes(currency)) {
      const newSelected = selectedCurrencies.filter(c => c !== currency);
      setSelectedCurrencies(newSelected);
      
      // If we removed the primary currency, set a new primary
      if (primaryCurrency === currency && newSelected.length > 0) {
        setPrimaryCurrency(newSelected[0]);
      }
    } else {
      // Check currency limit for free users
      if (isFreePlan && selectedCurrencies.length >= 1) {
        toast.error('Currency limit reached! Free plan allows only 1 currency. Upgrade to Premium for unlimited currencies.');
        return;
      }
      
      setSelectedCurrencies([...selectedCurrencies, currency]);
    }
    setDirty(true);
  };

  const setAsPrimary = (currency: string) => {
    setPrimaryCurrency(currency);
    setDirty(true);
  };

  const handleNotificationPreferenceChange = (
    category: keyof NotificationPreferences,
    key: string,
    value: boolean | string
  ) => {
    if (!notificationPreferences) return;

    setNotificationPreferences({
      ...notificationPreferences,
      [category]: {
        ...notificationPreferences[category],
        [key]: value,
      },
    });
    setNotificationDirty(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Save currency settings
      if (dirty) {
        await updateProfile({
          selected_currencies: selectedCurrencies,
          local_currency: primaryCurrency
        });
        setDirty(false);
      }

      // Save notification settings
      if (notificationDirty && notificationPreferences) {
        console.log('Attempting to save notification preferences for user:', profile.id);
        const success = await notificationPreferencesService.savePreferences(profile.id, notificationPreferences);
        if (success) {
          setNotificationDirty(false);
          console.log('Notification preferences saved successfully');
        } else {
          console.error('Failed to save notification preferences');
          toast.error('Failed to save notification settings. Please check your login status and try again.');
          setLoading(false);
          return;
        }
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Reset currency settings
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      setSelectedCurrencies(profile.selected_currencies);
      if (profile.local_currency && profile.selected_currencies.includes(profile.local_currency)) {
        setPrimaryCurrency(profile.local_currency);
      } else {
        setPrimaryCurrency(profile.selected_currencies[0]);
      }
    } else if (profile?.local_currency) {
      setSelectedCurrencies([profile.local_currency]);
      setPrimaryCurrency(profile.local_currency);
    } else {
      setSelectedCurrencies(['USD']);
      setPrimaryCurrency('USD');
    }
    setDirty(false);

    // Reset notification settings
    if (profile?.id) {
      loadNotificationPreferences();
      setNotificationDirty(false);
    }
  };

  const hasChanges = dirty || notificationDirty;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with only save/reset buttons when changes exist */}
      {hasChanges && (
        <div className="flex justify-end">
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3 h-3" />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Currency Selection */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          💱 Currency Settings
        </h4>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
          {isFreePlan 
            ? 'Free plan allows 1 currency only. Pick a primary currency for forms and default display.'
            : 'Select one or more currencies. Pick a primary currency for forms and default display.'
          }
        </p>
        
        {/* Currency Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
          {currencyOptions.map((currency) => {
            const selected = selectedCurrencies.includes(currency.value);
            const isPrimary = primaryCurrency === currency.value;
            
            return (
              <div
                key={currency.value}
                className={`
                  relative p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${selected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                  ${isPrimary ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''}
                  ${isFreePlan && selectedCurrencies.length >= 1 && !selected 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                  }
                `}
                onClick={() => toggleCurrency(currency.value)}
              >
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {currency.symbol}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {currency.value}
                  </div>
                  {selected && (
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
                
                {/* Set as Primary Button */}
                {selected && !isPrimary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsPrimary(currency.value);
                    }}
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Set
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Free Plan Currency Limit Warning */}
        {isFreePlan && (
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              🔒 <strong>Free Plan Limit:</strong> You can select only 1 currency. 
              <button 
                onClick={() => window.location.href = '/settings?tab=plans-usage'}
                className="ml-1 text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                Upgrade to Premium
              </button> for unlimited currencies.
            </p>
          </div>
        )}
      </div>

      {/* Current Selection Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Current Selection
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>
            <strong>Primary Currency:</strong> {primaryCurrency} ({currencyOptions.find(c => c.value === primaryCurrency)?.symbol})
          </li>
          <li>
            <strong>Selected Currencies:</strong> {selectedCurrencies.join(', ')}
          </li>
        </ul>
      </div>

      {/* Mobile Optimization Note */}
      <div className="block sm:hidden bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          💡 <strong>Tip:</strong> Tap a currency to select/deselect. Tap "Set" to make it primary.
        </p>
      </div>

      {/* Notification Settings Section */}
      <div className="mt-8">
        <NotificationSettings 
          preferences={notificationPreferences}
          onPreferenceChange={handleNotificationPreferenceChange}
          dirty={notificationDirty}
        />
      </div>
    </div>
  );
};

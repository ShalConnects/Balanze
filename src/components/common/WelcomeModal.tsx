import React, { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from 'sonner';
import { getCurrencySymbol } from '../../utils/currency';
import { supabase } from '../../lib/supabase';
import { useLoadingContext } from '../../context/LoadingContext';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuthStore();
  const { addAccount, fetchAccounts } = useFinanceStore();
  const { setLoading } = useLoadingContext();
  
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get currency options from user's profile
  const currencyOptions = React.useMemo(() => {
    // Force use common currencies for new users (when welcome modal shows)
    // This ensures new users always see the full list
    const commonCurrencies = [
      'USD', 'BDT', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'
    ];
    
    return commonCurrencies.map(currency => ({
      value: currency,
      label: `${currency} (${getCurrencySymbol(currency)})`
    }));
  }, [profile]);

  const handleContinue = async () => {
    if (!selectedCurrency || isCreating) return; // Prevent multiple calls
    
    setIsCreating(true);
    setLoading(true); // Set global loading state
    
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');
      
      // Use the database function to create cash account safely
      const { data: result, error: cashError } = await supabase.rpc('create_cash_account', {
        p_currency: selectedCurrency,
        p_initial_balance: 0
      });

      if (cashError) {
        console.error('Error creating cash account:', cashError);
        throw cashError;
      }

      if (!result || !result.success) {
        const errorMessage = result?.error_message || 'Failed to create cash account';
        console.error('Cash account creation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Wait a bit for the account to be properly saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch accounts to update the store
      await fetchAccounts();
      
      setIsSuccess(true);
      toast.success('Cash account created successfully!');
      
      // Auto close after showing success for a few seconds
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setSelectedCurrency('');
        setIsCreating(false);
        setLoading(false); // Clear global loading state
      }, 5000);
      
    } catch (error) {
      console.error('Error creating cash account:', error);
      toast.error('Failed to create cash account. Please try again.');
      setIsCreating(false);
      setLoading(false); // Clear global loading state on error
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
      setIsSuccess(false);
      setSelectedCurrency('');
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4 z-50 shadow-xl">
        
        {!isSuccess ? (
          <>
            {/* Welcome Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Balanze! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Let's get started by creating your first account. You can navigate to the Accounts tab in the sidebar 
                to manage your accounts and add initial balances.
              </p>
            </div>

            {/* Currency Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Which currency would you like to use for your first account?
              </label>
              <CustomDropdown
                options={currencyOptions}
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                placeholder="Select Currency *"
                fullWidth={true}
                disabled={isCreating}
              />
            </div>

            {/* Continue Button */}
            {selectedCurrency && (
              <button
                onClick={handleContinue}
                disabled={isCreating}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            )}
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="text-center">
              <div className="mb-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Account Created Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Your cash account has been created. Here's how to add your initial balance:
                </p>
              </div>

              {/* Simple CSS Animation Tutorial */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  {/* Step 1: Click Accounts */}
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-100 dark:bg-blue-900/30 h-8 rounded animate-pulse"></div>
                      <p className="text-xs text-gray-500 mt-1">Click "Accounts" in sidebar</p>
                    </div>
                  </div>

                  {/* Step 2: Click Edit */}
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="bg-green-100 dark:bg-green-900/30 h-8 rounded animate-pulse"></div>
                      <p className="text-xs text-gray-500 mt-1">Click edit button on Cash Wallet</p>
                    </div>
                  </div>

                  {/* Step 3: Add Balance */}
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 h-8 rounded animate-pulse"></div>
                      <p className="text-xs text-gray-500 mt-1">Add your initial balance</p>
                    </div>
                  </div>

                  {/* Step 4: Save */}
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="bg-purple-100 dark:bg-purple-900/30 h-8 rounded animate-pulse"></div>
                      <p className="text-xs text-gray-500 mt-1">Save changes</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Got it!
                </button>
                <button
                  onClick={() => {
                    console.log('Manual close clicked');
                    onClose();
                    setIsSuccess(false);
                    setSelectedCurrency('');
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 
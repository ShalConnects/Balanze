import React, { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from 'sonner';
import { getCurrencySymbol } from '../../utils/currency';
import { supabase } from '../../lib/supabase';
import { useLoadingContext } from '../../context/LoadingContext';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onStartTour }) => {
  const { profile } = useAuthStore();
  const { addAccount, fetchAccounts } = useFinanceStore();
  const { setLoading } = useLoadingContext();
  
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

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
      
      // Create cash account directly using the same logic as addAccount
      const { data: newCashAccount, error: cashError } = await supabase
        .from('accounts')
        .insert([{
          name: `Cash Wallet (${selectedCurrency})`,
          type: 'cash',
          initial_balance: 0,
          calculated_balance: 0,
          currency: selectedCurrency,
          description: 'Default cash account for tracking physical money',
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null,
          is_active: true,  // Use snake_case to match database schema
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (cashError) {

        throw new Error(`Failed to create cash account: ${cashError.message}`);
      }


      
      // Add audit log
      try {
        await supabase.from('activity_history').insert({
          user_id: user.id,
          activity_type: 'ACCOUNT_CREATED',
          entity_type: 'account',
          entity_id: newCashAccount.id,
          description: `Welcome cash account created: ${newCashAccount.name} (${newCashAccount.currency})`,
          changes: {
            new: newCashAccount
          }
        });
      } catch (auditError) {

        // Don't fail the account creation if audit log fails
      }
      
      // Fetch accounts to update the store
      await fetchAccounts();
      
      setIsSuccess(true);
      toast.success('Cash account created successfully!');
      
      // Show success message briefly, then start the tour
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedCurrency('');
        setIsCreating(false);
        setLoading(false); // Clear global loading state
        onClose(); // Close the welcome modal
        
        // Additional delay to ensure modal is fully closed before starting tour
        setTimeout(() => {
          onStartTour(); // Start the contextual tour
        }, 300);
      }, 2000);
      
    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Failed to create cash account';
      toast.error(errorMessage);
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

  // Prevent escape key from closing modal during currency selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSuccess) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[100000]"
      onKeyDown={handleKeyDown}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4 z-[100000] shadow-xl">
        
        {!isSuccess ? (
          <>
            {/* Welcome Message */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Balanze! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                To get started, please select your preferred currency below. We'll create your first cash account automatically.
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 font-medium">
                Currency selection is required to continue
              </p>
            </div>

            {/* Currency Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Which currency would you like to use for your first account?
              </label>
              <button
                type="button"
                onClick={() => setShowCurrencyModal(true)}
                disabled={isCreating}
                className="w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 text-gray-700 dark:text-gray-100 px-4 pr-[10px] py-2 text-[14px] h-10 rounded-lg border border-blue-200/50 dark:border-blue-800/50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:via-indigo-800/30 dark:hover:to-purple-800/30 transition-colors flex items-center space-x-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={selectedCurrency ? '' : 'text-gray-400'}>
                  {selectedCurrency ? 
                    currencyOptions.find(opt => opt.value === selectedCurrency)?.label || selectedCurrency
                    : 'Select Currency *'
                  }
                </span>
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
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

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100001]">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100000]" />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 z-[100001] shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select Currency
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Choose your preferred currency for your first account
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {currencyOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedCurrency(option.value);
                    setShowCurrencyModal(false);
                  }}
                  className={`w-full flex items-center text-left text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-4 py-3 ${
                    selectedCurrency === option.value 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold' 
                      : 'text-gray-700 dark:text-gray-100'
                  }`}
                >
                  <span className="flex-1">{option.label}</span>
                  {selectedCurrency === option.value && (
                    <svg className="w-5 h-5 text-white ml-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCurrencyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 


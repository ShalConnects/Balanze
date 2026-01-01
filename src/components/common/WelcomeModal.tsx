import React, { useState, useMemo } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from 'sonner';
import { getCurrencySymbol } from '../../utils/currency';
import { getAllCurrencies, getPopularCurrencies, getCurrencyName } from '../../utils/currencies';
import { supabase } from '../../lib/supabase';
import { useLoadingContext } from '../../context/LoadingContext';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onStartTour }) => {
  const { profile, signOut } = useAuthStore();
  const { addAccount, fetchAccounts, fetchCategories } = useFinanceStore();
  const { setLoading } = useLoadingContext();
  
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
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

  // Get currency options with search filter
  const currencyOptions = useMemo(() => {
    const query = currencySearchQuery.toLowerCase().trim();
    
    let filtered = allCurrencies;
    
    if (query) {
      filtered = allCurrencies.filter(currency => {
        const code = currency.toLowerCase();
        const name = getCurrencyName(currency).toLowerCase();
        return code.includes(query) || name.includes(query);
      });
    }
    
    return filtered.map(currency => ({
      value: currency,
      label: `${currency} (${getCurrencySymbol(currency)})`,
      name: getCurrencyName(currency)
    }));
  }, [allCurrencies, currencySearchQuery]);

  const handleContinue = async () => {
    if (!selectedCurrency || isCreating) return; // Prevent multiple calls
    
    setIsCreating(true);
    setLoading(true); // Set global loading state
    
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');
      
      // Ensure profile exists before creating account
      const { profile: currentProfile } = useAuthStore.getState();
      if (!currentProfile) {
        // Wait a bit for profile to be created
        await new Promise(resolve => setTimeout(resolve, 500));
        const { profile: retryProfile } = useAuthStore.getState();
        if (!retryProfile) {
          throw new Error('Profile not found. Please try again.');
        }
      }
      
      let newCashAccount;
      let accountId;
      
      // Try using the database function first (bypasses RLS safely)
      try {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('create_cash_account', {
            p_currency: selectedCurrency,
            p_initial_balance: 0
          });
        
        if (rpcError) {
          throw rpcError;
        }
        
        if (rpcResult && rpcResult.length > 0) {
          const result = rpcResult[0];
          if (result.success && result.account_id) {
            accountId = result.account_id;
            // Fetch the created account to get full details
            const { data: fetchedAccount, error: fetchError } = await supabase
              .from('accounts')
              .select('*')
              .eq('id', accountId)
              .single();
            
            if (fetchError) {
              throw fetchError;
            }
            newCashAccount = fetchedAccount;
          } else {
            throw new Error(result.error_message || 'Failed to create cash account');
          }
        } else {
          throw new Error('No result from create_cash_account function');
        }
      } catch (rpcError: any) {
        // Fallback to store's addAccount if RPC fails
        console.warn('RPC function failed, using fallback:', rpcError);
        await addAccount({
          name: 'Cash Wallet',
          type: 'cash',
          initial_balance: 0,
          calculated_balance: 0,
          currency: selectedCurrency,
          description: 'Default cash account for tracking physical money',
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null,
          is_active: true
        });
        
        // Fetch the newly created account
        await fetchAccounts();
        const accounts = useFinanceStore.getState().accounts;
        newCashAccount = accounts.find(acc => acc.type === 'cash' && acc.currency === selectedCurrency);
        
        if (!newCashAccount) {
          throw new Error('Failed to create cash account');
        }
        accountId = newCashAccount.id;
      }


      
      if (!newCashAccount || !accountId) {
        throw new Error('Failed to create cash account');
      }
      
      // Add audit log
      try {
        await supabase.from('activity_history').insert({
          user_id: user.id,
          activity_type: 'ACCOUNT_CREATED',
          entity_type: 'account',
          entity_id: accountId,
          description: `Welcome cash account created: ${newCashAccount.name || 'Cash Wallet'} (${newCashAccount.currency || selectedCurrency})`,
          changes: {
            new: newCashAccount
          }
        });
      } catch (auditError) {

        // Don't fail the account creation if audit log fails
      }
      
      // Update user profile with selected currency preferences
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          selected_currencies: [selectedCurrency],
          local_currency: selectedCurrency
        })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Failed to update profile with currency preferences:', profileError);
        // Don't fail the account creation if profile update fails
      } else if (updatedProfile) {
        // Update the auth store with the new profile data
        const { setUserAndProfile } = useAuthStore.getState();
        const profileData = {
          id: updatedProfile.id,
          fullName: updatedProfile.full_name,
          profilePicture: updatedProfile.profile_picture,
          local_currency: updatedProfile.local_currency,
          selected_currencies: updatedProfile.selected_currencies,
          default_account_id: updatedProfile.default_account_id,
          subscription: updatedProfile.subscription
        };
        setUserAndProfile(user, profileData);
      }

      // Fetch accounts to update the store
      await fetchAccounts();
      
      // Create default categories with the selected currency (pass currency directly)
      await fetchCategories(selectedCurrency);
      
      toast.success('Cash account created successfully!');
      
      // Close modal and start tour immediately
      setSelectedCurrency('');
      setIsCreating(false);
      setLoading(false); // Clear global loading state
      onClose(); // Close the welcome modal
      
      // Start the tour immediately
      onStartTour();
      
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
      setSelectedCurrency('');
      setIsCreating(false);
    }
  };

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    onClose(); // Close the welcome modal
    await signOut(); // Then sign out
  };

  if (!isOpen) return null;

  // Prevent escape key from closing modal during currency selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
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

        {/* Sign Out Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            disabled={isCreating}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Not ready? Sign out
          </button>
        </div>
      </div>

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100001]">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100000]" />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 z-[100001] shadow-xl max-h-[90vh] flex flex-col">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select Currency
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Choose your preferred currency for your first account
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Important:</strong> Free users can only use 1 currency. This choice cannot be changed later. 
                  <br />
                  <span className="text-amber-700 dark:text-amber-300">
                    Upgrade to Premium to use multiple currencies.
                  </span>
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
                autoFocus
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

            {/* Currency List */}
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {currencyOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No currencies found matching "{currencySearchQuery}"</p>
                </div>
              ) : (
                <>
                  {/* Popular Currencies Section (only show if no search query) */}
                  {!currencySearchQuery && (
                    <>
                      <div className="sticky top-0 bg-white dark:bg-gray-800 py-2 z-10">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Popular Currencies
                        </p>
                      </div>
                      {currencyOptions.filter(opt => getPopularCurrencies().includes(opt.value)).map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedCurrency(option.value);
                            setShowCurrencyModal(false);
                            setCurrencySearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between text-left text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-4 py-3 ${
                            selectedCurrency === option.value 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold' 
                              : 'text-gray-700 dark:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold">{getCurrencySymbol(option.value)}</span>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.value}</span>
                              <span className={`text-xs ${selectedCurrency === option.value ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                {option.name}
                              </span>
                            </div>
                          </div>
                          {selectedCurrency === option.value && (
                            <svg className="w-5 h-5 text-white ml-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                      <div className="sticky top-0 bg-white dark:bg-gray-800 py-2 z-10 mt-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          All Currencies
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* All Currencies (or filtered results) */}
                  {currencyOptions
                    .filter(opt => currencySearchQuery || !getPopularCurrencies().includes(opt.value))
                    .map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedCurrency(option.value);
                          setShowCurrencyModal(false);
                          setCurrencySearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between text-left text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-4 py-3 ${
                          selectedCurrency === option.value 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold' 
                            : 'text-gray-700 dark:text-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">{getCurrencySymbol(option.value)}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.value}</span>
                            <span className={`text-xs ${selectedCurrency === option.value ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                              {option.name}
                            </span>
                          </div>
                        </div>
                        {selectedCurrency === option.value && (
                          <svg className="w-5 h-5 text-white ml-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                </>
              )}
            </div>

            <div className="mt-4 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowCurrencyModal(false);
                  setCurrencySearchQuery('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-[100001]">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100000]" />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 z-[100001] shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sign Out?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                You haven't finished setup. Signing out will require you to complete this step next time you log in.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Continue signing out?
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 


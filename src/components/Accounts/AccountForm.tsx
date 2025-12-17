import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Loader } from '../common/Loader';
import { showToast } from '../../lib/toast';
import { useLoadingContext } from '../../context/LoadingContext';
import { validateAccount, ACCOUNT_TYPES, CURRENCY_OPTIONS, getAccountTypeDisplayName } from '../../utils/accountUtils';
import { useUpgradeModal } from '../../hooks/useUpgradeModal';
import { UpgradeModal } from '../common/UpgradeModal';
import { getAccountIcon } from '../../utils/accountIcons';
import { Tooltip } from '../common/Tooltip';
import { CreditCard, Wallet, PiggyBank, Building } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
}

export const AccountForm: React.FC<AccountFormProps> = ({ isOpen, onClose, account }) => {
  const { addAccount, updateAccount, loading, error, getTransactionsByAccount } = useFinanceStore();
  const { profile } = useAuthStore();
  const { modalState, closeModal, handleDatabaseError } = useUpgradeModal();
  const { setLoading, setLoadingMessage } = useLoadingContext();
  const { isMobile } = useMobileDetection();
  
  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || 'checking',
    balance: account?.initial_balance?.toString() || '',
    currency: account?.currency || 'USD',
    description: account?.description || '',
    has_dps: account?.has_dps || false,
    dps_type: account?.dps_type || 'monthly',
    dps_amount_type: account?.dps_amount_type || 'fixed',
    dps_fixed_amount: account?.dps_fixed_amount?.toString() || '',
    dps_initial_balance: ''
  });

  // Ref to track latest formData for validation
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showDpsTooltip, setShowDpsTooltip] = useState(false);
  const [showDpsMobileModal, setShowDpsMobileModal] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const dpsIconRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [availableCurrencies, setAvailableCurrencies] = useState<Array<{label: string, value: string}>>(
    CURRENCY_OPTIONS.map(currency => ({ label: currency, value: currency }))
  );

  // Check if account has existing transactions
  const hasExistingTransactions = account ? getTransactionsByAccount(account.id).length > 0 : false;

  // Calculate tooltip position when it should be shown
  useEffect(() => {
    if (showDpsTooltip && !isMobile && dpsIconRef.current && tooltipRef.current) {
      const iconRect = dpsIconRef.current.getBoundingClientRect();
      const tooltipWidth = 256; // w-64 = 16rem = 256px
      const tooltipHeight = tooltipRef.current.offsetHeight || 200; // approximate
      const spacing = 8; // ml-2 = 8px
      
      // Position to the right of icon, vertically centered
      let left = iconRect.right + spacing;
      let top = iconRect.top + (iconRect.height / 2) - (tooltipHeight / 2);
      
      // Check if tooltip would overflow right edge
      const viewportWidth = window.innerWidth;
      if (left + tooltipWidth > viewportWidth - 16) {
        // Position to the left instead
        left = iconRect.left - tooltipWidth - spacing;
      }
      
      // Check if tooltip would overflow top
      if (top < 8) {
        top = 8;
      }
      
      // Check if tooltip would overflow bottom
      const viewportHeight = window.innerHeight;
      if (top + tooltipHeight > viewportHeight - 8) {
        top = viewportHeight - tooltipHeight - 8;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [showDpsTooltip, isMobile]);

  // Fetch user profile and set up available currencies
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (profile?.id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('selected_currencies, local_currency')
            .eq('id', profile.id)
            .single();
          
          if (data) {
            setUserProfile(data);
            
            // Set up available currencies based on user's selected currencies
            const allCurrencyOptions = CURRENCY_OPTIONS.map(currency => ({
              label: currency,
              value: currency
            }));
            
            const userCurrencies = data.selected_currencies && data.selected_currencies.length > 0
              ? allCurrencyOptions.filter(opt => data.selected_currencies?.includes(opt.value))
              : allCurrencyOptions;
            
            setAvailableCurrencies(userCurrencies);
            
            // Set default currency if not already set
            if (!formData.currency || formData.currency === 'USD') {
              if (data.local_currency && data.selected_currencies?.includes(data.local_currency)) {
                setFormData(prev => ({ ...prev, currency: data.local_currency }));
              } else if (data.selected_currencies && data.selected_currencies.length > 0) {
                setFormData(prev => ({ ...prev, currency: data.selected_currencies[0] }));
              }
            }
          }
        } catch (error) {

          // Fallback to all currencies if profile fetch fails
          setAvailableCurrencies(CURRENCY_OPTIONS.map(currency => ({
            label: currency,
            value: currency
          })));
        }
      }
    };
    
    fetchUserProfile();
  }, [profile?.id]);

  // Update form data when account prop changes
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.initial_balance?.toString() || '',
        currency: account.currency,
        description: account.description || '',
        has_dps: account.has_dps || false,
        dps_type: account.dps_type || 'monthly',
        dps_amount_type: account.dps_amount_type || 'fixed',
        dps_fixed_amount: account.dps_fixed_amount?.toString() || '',
        dps_initial_balance: ''
      });
    }
  }, [account]);

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normalClasses = "border-gray-200 focus:ring-blue-500";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  const handleFieldChange = (field: string, value: string | boolean) => {
    // Prevent changes to disabled fields
    if (hasExistingTransactions && (field === 'balance' || field === 'currency')) {
      return;
    }
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Update ref immediately so validation can use latest data
      formDataRef.current = newData;
      
      // Validate related fields after state update
      setTimeout(() => {
        if (field === 'balance') {
          validateField('balance');
        }
        if (field === 'has_dps') {
          // Only validate balance when DPS is DISABLED (to clear error)
          // When DPS is enabled, wait for balance field interaction or form submit
          if (!newData.has_dps) {
            validateField('balance');
          }
        }
        if (field === 'dps_amount_type') {
          // Only validate if DPS is disabled or amount type changed away from fixed
          if (!newData.has_dps || newData.dps_amount_type !== 'fixed') {
            validateField('balance');
          }
        }
      }, 0);
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!formData.name.trim()) {
          newErrors.name = 'Account name is required';
        } else if (formData.name.length < 2) {
          newErrors.name = 'Account name must be at least 2 characters';
        } else if (formData.name.length > 50) {
          newErrors.name = 'Account name must be less than 50 characters';
        } else {
          delete newErrors.name;
        }
        break;
        
      case 'balance':
        const balance = parseFloat(formData.balance);
        // Use ref to get latest formData for DPS checks (handles async state updates)
        const currentFormData = formDataRef.current;
        if (isNaN(balance)) {
          newErrors.balance = 'Initial balance is required';
        } else if (balance < 0) {
          newErrors.balance = 'Initial balance cannot be negative';
        } else if (balance > 999999999) {
          newErrors.balance = 'Initial balance is too large';
        } else {
          delete newErrors.balance;
        }
        // Check DPS validation when balance changes - use ref for latest DPS state
        // First, clear any existing DPS-related error if conditions are not met
        const shouldClearDpsError = !currentFormData.has_dps || currentFormData.dps_amount_type !== 'fixed' || balance > 0;
        if (shouldClearDpsError) {
          // Clear DPS error if DPS is disabled, amount type is not fixed, or balance is greater than zero
          if (newErrors.balance && newErrors.balance.includes('DPS with fixed amount')) {
            delete newErrors.balance;
          }
          // Also check and clear from existing errors
          if (errors.balance && errors.balance.includes('DPS with fixed amount')) {
            delete newErrors.balance;
          }
        }
        // Then, set the DPS error only if all conditions are met AND balance field has been touched
        // This prevents showing error immediately when DPS is enabled - wait for user interaction
        const shouldSetDpsError = currentFormData.has_dps && 
                                  currentFormData.dps_amount_type === 'fixed' && 
                                  balance === 0 &&
                                  touched.balance; // Only show error if balance field has been touched
        if (shouldSetDpsError) {
          newErrors.balance = 'Initial balance must be greater than zero to create DPS with fixed amount';
        }
        break;
        
      case 'dps_fixed_amount':
        if (formData.has_dps && formData.dps_amount_type === 'fixed') {
          const amount = parseFloat(formData.dps_fixed_amount);
          if (isNaN(amount) || amount <= 0) {
            newErrors.dps_fixed_amount = 'Fixed amount must be greater than 0';
          } else if (amount > 999999) {
            newErrors.dps_fixed_amount = 'Fixed amount is too large';
          } else {
            delete newErrors.dps_fixed_amount;
          }
        }
        break;
        
      case 'has_dps':
      case 'dps_amount_type':
        // Check if DPS with fixed amount is enabled but balance is zero
        // Use ref to get latest formData (handles async state updates)
        const currentFormDataDps = formDataRef.current;
        const currentBalance = parseFloat(currentFormDataDps.balance);
        // First, clear any existing DPS-related error if conditions are not met
        const shouldClearDpsErrorDps = !currentFormDataDps.has_dps || currentFormDataDps.dps_amount_type !== 'fixed' || currentBalance > 0;
        if (shouldClearDpsErrorDps) {
          // Clear DPS error if DPS is disabled, amount type is not fixed, or balance is greater than zero
          if (newErrors.balance && newErrors.balance.includes('DPS with fixed amount')) {
            delete newErrors.balance;
          }
          // Also check and clear from existing errors
          if (errors.balance && errors.balance.includes('DPS with fixed amount')) {
            delete newErrors.balance;
          }
        }
        // Then, set the DPS error only if all conditions are met AND balance field has been touched
        // This prevents showing error immediately when DPS settings change - wait for user interaction
        const shouldSetDpsErrorDps = currentFormDataDps.has_dps && 
                                     currentFormDataDps.dps_amount_type === 'fixed' && 
                                     currentBalance === 0 &&
                                     touched.balance; // Only show error if balance field has been touched
        if (shouldSetDpsErrorDps) {
          newErrors.balance = 'Initial balance must be greater than zero to create DPS with fixed amount';
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const validateForm = () => {
    const validation = validateAccount({
      name: formData.name,
      type: formData.type as any,
      initial_balance: parseFloat(formData.balance),
      currency: formData.currency
    });
    
    const allErrors: Record<string, string> = {};
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        if (error.includes('name')) allErrors.name = error;
        if (error.includes('balance')) allErrors.balance = error;
        if (error.includes('currency')) allErrors.currency = error;
        if (error.includes('type')) allErrors.type = error;
      });
    }
    
    // Validate name
    if (!formData.name.trim()) {
      allErrors.name = 'Account name is required';
    } else if (formData.name.length < 2) {
      allErrors.name = 'Account name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      allErrors.name = 'Account name must be less than 50 characters';
    }
    
    // Validate balance
    const balance = parseFloat(formData.balance);
    if (isNaN(balance)) {
      allErrors.balance = 'Initial balance is required';
    } else if (balance < 0) {
      allErrors.balance = 'Initial balance cannot be negative';
    } else if (balance > 999999999) {
      allErrors.balance = 'Initial balance is too large';
    }
    
    // Additional DPS validation
    
    // IMPORTANT: Only set DPS error if DPS is actually enabled
    // If DPS is disabled, explicitly ensure we don't have a DPS error
    if (!formData.has_dps || formData.dps_amount_type !== 'fixed') {
      // Explicitly remove DPS error if it exists in allErrors
      if (allErrors.balance && allErrors.balance.includes('DPS with fixed amount')) {
        delete allErrors.balance;
      }
      // Also clear from existing errors state (in case it was set before)
      // We'll update the errors state at the end, so this ensures it's cleared
    } else if (formData.has_dps && formData.dps_amount_type === 'fixed') {
      // DPS is enabled and amount type is fixed - check if balance is zero
      // Only set error if balance has been touched (i.e., user has interacted or form is being submitted)
      if (balance === 0 && touched.balance) {
        allErrors.balance = 'Initial balance must be greater than zero to create DPS with fixed amount';
      } else {
        // Balance is not zero - validate fixed amount
        const amount = parseFloat(formData.dps_fixed_amount);
        if (isNaN(amount) || amount <= 0) {
          allErrors.dps_fixed_amount = 'Fixed amount must be greater than 0';
        } else if (amount > 999999) {
          allErrors.dps_fixed_amount = 'Fixed amount is too large';
        }
        // Make sure we don't have a DPS balance error if balance is > 0
        if (allErrors.balance && allErrors.balance.includes('DPS with fixed amount')) {
          delete allErrors.balance;
        }
      }
    }
    
    // Final check: If DPS is disabled, make absolutely sure no DPS error exists
    if (!formData.has_dps || formData.dps_amount_type !== 'fixed') {
      if (allErrors.balance && allErrors.balance.includes('DPS with fixed amount')) {
        delete allErrors.balance;
      }
    }
    
    // Update errors state
    setErrors(allErrors);
    
    // Return validation result
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Form submitted, preventing default
    
    // Mark all fields as touched
    setTouched({
      name: true,
      type: true,
      balance: true,
      currency: true,
      description: true,
      has_dps: true,
      dps_type: true,
      dps_amount_type: true,
      dps_fixed_amount: true,
      dps_initial_balance: true
    });
    
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    setLoadingMessage(account ? 'Updating Account...' : 'Creating Account...');
    
    try {
      const accountData = {
        name: formData.name.trim(),
        type: formData.type as any,
        initial_balance: parseFloat(formData.balance),
        currency: formData.currency,
        description: formData.description.trim() || undefined,
        has_dps: formData.has_dps,
        dps_type: formData.has_dps ? formData.dps_type : null,
        dps_amount_type: formData.has_dps ? formData.dps_amount_type : null,
        dps_fixed_amount: formData.has_dps && formData.dps_amount_type === 'fixed' ? parseFloat(formData.dps_fixed_amount) : null,
        dps_savings_account_id: null,
        isActive: true,
        updated_at: new Date().toISOString(),
        dps_initial_balance: formData.has_dps ? parseFloat(formData.dps_initial_balance) || 0 : 0
      };

      // Attempting to create account

      if (account) {
        await updateAccount(account.id, accountData);
        showToast.success('Account updated successfully!');
      } else {
        await addAccount(accountData);
        showToast.success('Account created successfully!');
      }
      
      onClose();
    } catch (error) {

      
              // Check if it's a plan limit error and show upgrade prompt
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
          const errorMessage = error.message;
          
          if (errorMessage.includes('ACCOUNT_LIMIT_EXCEEDED')) {
            // Show toast and navigate to plans
            const { accounts } = useFinanceStore.getState();
            const current = accounts.length;
            const limit = 3;
            
            showToast.error(`Account limit exceeded! You have ${current}/${limit} accounts. Upgrade to Premium for unlimited accounts.`);
            setTimeout(() => {
              window.location.href = '/settings?tab=plans-usage';
            }, 2000);
            
            return;
          }
          
          if (errorMessage.includes('CURRENCY_LIMIT_EXCEEDED')) {
            // Show toast and navigate to plans
            const { accounts } = useFinanceStore.getState();
            const uniqueCurrencies = new Set(accounts.map(a => a.currency)).size;
            const limit = 1;
            
            showToast.error(`Currency limit exceeded! You have ${uniqueCurrencies}/${limit} currencies. Upgrade to Premium for unlimited currencies.`);
            setTimeout(() => {
              window.location.href = '/settings?tab=plans';
            }, 2000);
            
            return;
          }
        }
      
      showToast.error(account ? 'Failed to update account. Please check your data and try again.' : 'Failed to create account. Please check your data and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDpsCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    handleFieldChange('has_dps', checked);
    
    if (!checked) {
      // Clear DPS-related fields when disabling
      setFormData(prev => {
        const newData = {
          ...prev,
          dps_type: 'monthly',
          dps_amount_type: 'fixed',
          dps_fixed_amount: '',
          dps_initial_balance: ''
        };
        // Update ref immediately
        formDataRef.current = newData;
        // Immediately validate balance to clear DPS error
        setTimeout(() => {
          validateField('balance');
        }, 0);
        return newData;
      });
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    // Reset form state only if not editing
    if (!account) {
      setFormData({
        name: '',
        type: 'checking',
        balance: '',
        currency: 'USD',
        description: '',
        has_dps: false,
        dps_type: 'monthly',
        dps_amount_type: 'fixed',
        dps_fixed_amount: '',
        dps_initial_balance: ''
      });
      setErrors({});
      setTouched({});
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        <div 
          data-tour="account-form"
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {account ? 'Edit Account' : 'Add New Account'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Account Name */}
          <div>
            <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Name *
            </label>
            <input
              id="account-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={getInputClasses('name')}
              placeholder="e.g., Main Checking Account"
              disabled={loading}
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={!!errors.name}
            />
            {touched.name && errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Type *
            </label>
            <CustomDropdown
              options={ACCOUNT_TYPES.filter(type => type !== 'lend_borrow').map(type => ({
                label: getAccountTypeDisplayName(type),
                value: type
              }))}
              value={formData.type}
              onChange={(value) => handleFieldChange('type', value)}
              placeholder="Select account type"
              disabled={loading}
            />
          </div>

          {/* Initial Balance */}
          <div>
            <label htmlFor="account-balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Balance *
            </label>
            <div className="relative">
              <input
                id="account-balance"
                type="number"
                step="0.01"
                min="0"
                value={formData.balance}
                onChange={(e) => handleFieldChange('balance', e.target.value)}
                onBlur={() => handleBlur('balance')}
                className={getInputClasses('balance')}
                placeholder="0.00"
                disabled={loading || hasExistingTransactions}
                aria-describedby={errors.balance ? 'balance-error' : undefined}
                aria-invalid={!!errors.balance}
              />
            </div>
            {errors.balance && touched.balance && (
              <p id="balance-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.balance}
              </p>
            )}
            {hasExistingTransactions && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Initial balance cannot be changed when account has existing transactions
              </p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="account-currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency *
            </label>
            <CustomDropdown
              options={availableCurrencies}
              value={formData.currency}
              onChange={(value) => handleFieldChange('currency', value)}
              placeholder="Select currency"
              disabled={loading || hasExistingTransactions}
            />
            {hasExistingTransactions && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Currency cannot be changed when account has existing transactions
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="account-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="account-description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className={getInputClasses('description')}
              placeholder="Optional description for this account"
              rows={3}
              disabled={loading}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* DPS Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center mb-3 relative">
              <input
                id="dps-enabled"
                type="checkbox"
                checked={formData.has_dps}
                onChange={handleDpsCheckbox}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={loading}
              />
              <label htmlFor="dps-enabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable DPS (Daily Profit Sharing)
              </label>
              <div className="relative ml-2 inline-flex">
                <button
                  ref={dpsIconRef}
                  type="button"
                  onMouseEnter={() => {
                    if (!isMobile) {
                      setShowDpsTooltip(true);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isMobile) {
                      setShowDpsTooltip(false);
                    }
                  }}
                  onFocus={() => {
                    if (!isMobile) {
                      setShowDpsTooltip(true);
                    }
                  }}
                  onBlur={() => {
                    if (!isMobile) {
                      setShowDpsTooltip(false);
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isMobile) {
                      setShowDpsMobileModal(true);
                    } else {
                      setShowDpsTooltip(v => !v);
                    }
                  }}
                  tabIndex={0}
                  aria-label="Show DPS information"
                  className="flex items-center justify-center"
                >
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors duration-200" />
                </button>
              </div>
            </div>

            {formData.has_dps && (
              <div className="space-y-3 pl-6 border-l-2 border-blue-200 dark:border-blue-700">
                {/* DPS Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    DPS Type
                  </label>
                  <CustomDropdown
                    options={[
                      { label: 'Monthly', value: 'monthly' },
                      { label: 'Flexible', value: 'flexible' }
                    ]}
                    value={formData.dps_type}
                    onChange={(value) => handleFieldChange('dps_type', value)}
                    placeholder="Select DPS type"
                    disabled={loading}
                  />
                </div>

                {/* Amount Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount Type
                  </label>
                  <CustomDropdown
                    options={[
                      { label: 'Fixed Amount', value: 'fixed' },
                      { label: 'Custom Amount', value: 'custom' }
                    ]}
                    value={formData.dps_amount_type}
                    onChange={(value) => handleFieldChange('dps_amount_type', value)}
                    placeholder="Select amount type"
                    disabled={loading}
                  />
                </div>

                {/* Fixed Amount */}
                {formData.dps_amount_type === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fixed Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.dps_fixed_amount}
                      onChange={(e) => handleFieldChange('dps_fixed_amount', e.target.value)}
                      onBlur={() => handleBlur('dps_fixed_amount')}
                      className={getInputClasses('dps_fixed_amount')}
                      placeholder="0.00"
                      disabled={loading}
                    />
                    {touched.dps_fixed_amount && errors.dps_fixed_amount && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.dps_fixed_amount}
                      </p>
                    )}
                  </div>
                )}

                {/* Initial DPS Balance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial DPS Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dps_initial_balance}
                    onChange={(e) => handleFieldChange('dps_initial_balance', e.target.value)}
                    className={getInputClasses('dps_initial_balance')}
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading || Object.keys(errors).filter(key => errors[key] && errors[key].trim() !== '').length > 0}
            >
              {account ? 'Update Account' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
      
      {/* DPS Tooltip - Portal to avoid overflow issues */}
      {showDpsTooltip && !isMobile && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[100] w-64 sm:w-72 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          onMouseEnter={() => setShowDpsTooltip(true)}
          onMouseLeave={() => setShowDpsTooltip(false)}
        >
          {/* Arrow pointer pointing left towards icon */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-200 dark:border-r-gray-700"></div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-white dark:border-r-gray-900"></div>
          <div className="space-y-2">
            <p className="font-medium">Daily Profit Sharing (DPS)</p>
            <p className="text-xs">Automatically transfer a portion of your daily income to a savings account to build wealth over time.</p>
            <ul className="text-xs space-y-1">
              <li>• <strong>Monthly:</strong> Fixed amount transferred monthly</li>
              <li>• <strong>Flexible:</strong> Percentage of daily income</li>
              <li>• <strong>Fixed Amount:</strong> Set a specific amount to transfer</li>
              <li>• <strong>Custom Amount:</strong> Choose amount each time</li>
            </ul>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Modal for DPS Info */}
      {showDpsMobileModal && isMobile && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDpsMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 w-64 animate-fadein">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Daily Profit Sharing (DPS)</div>
              <button
                onClick={() => setShowDpsMobileModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-200">
              <p>Automatically transfer a portion of your daily income to a savings account to build wealth over time.</p>
              <ul className="space-y-1">
                <li>• <strong>Monthly:</strong> Fixed amount transferred monthly</li>
                <li>• <strong>Flexible:</strong> Percentage of daily income</li>
                <li>• <strong>Fixed Amount:</strong> Set a specific amount to transfer</li>
                <li>• <strong>Custom Amount:</strong> Choose amount each time</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          type={modalState.type}
          feature={modalState.feature}
          currentUsage={modalState.currentUsage}
        />
    </>
  );
};


import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useAuthStore } from '../../store/authStore';
import { Loader } from '../common/Loader';
import { toast } from 'sonner';
import { useLoadingContext } from '../../context/LoadingContext';
import { validateAccount, ACCOUNT_TYPES, CURRENCY_OPTIONS, getAccountTypeDisplayName } from '../../utils/accountUtils';
import { useUpgradeModal } from '../../hooks/useUpgradeModal';
import { UpgradeModal } from '../common/UpgradeModal';
import { getAccountIcon } from '../../utils/accountIcons';
import { Tooltip } from '../common/Tooltip';
import { CreditCard, Wallet, PiggyBank, Building } from 'lucide-react';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
}

export const AccountForm: React.FC<AccountFormProps> = ({ isOpen, onClose, account }) => {
  const { addAccount, updateAccount, loading, error } = useFinanceStore();
  const { profile } = useAuthStore();
  const { modalState, closeModal, handleDatabaseError } = useUpgradeModal();
  
  console.log('🔧 AccountForm render - modalState:', modalState);

  // Watch for modal state changes
  useEffect(() => {
    console.log('🔧 Modal state changed:', modalState);
  }, [modalState]);



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

  const [showDpsModal, setShowDpsModal] = useState(false);
  const [dpsTransferAmount, setDpsTransferAmount] = useState('');
  const [pendingDpsEnable, setPendingDpsEnable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
        if (isNaN(balance)) {
          newErrors.balance = 'Initial balance is required';
        } else if (balance < 0) {
          newErrors.balance = 'Initial balance cannot be negative';
        } else if (balance > 999999999) {
          newErrors.balance = 'Initial balance is too large';
        } else {
          delete newErrors.balance;
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
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        if (error.includes('name')) newErrors.name = error;
        if (error.includes('balance')) newErrors.balance = error;
        if (error.includes('currency')) newErrors.currency = error;
        if (error.includes('type')) newErrors.type = error;
      });
      setErrors(newErrors);
      return false;
    }
    
    // Additional DPS validation
    if (formData.has_dps && formData.dps_amount_type === 'fixed') {
      validateField('dps_fixed_amount');
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    console.log('🚀 Form submitted, preventing default');
    
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
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setSubmitting(true);
    
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

      console.log('🚀 Attempting to create account...');

      if (account) {
        await updateAccount(account.id, accountData);
        toast.success('Account updated successfully!');
      } else {
        await addAccount(accountData);
        toast.success('Account created successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving account:', error);
      
              // Check if it's a plan limit error and show upgrade prompt
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
          const errorMessage = error.message;
          
          if (errorMessage.includes('ACCOUNT_LIMIT_EXCEEDED')) {
            // Show toast and navigate to plans
            const { accounts } = useFinanceStore.getState();
            const current = accounts.length;
            const limit = 5;
            
                      toast.error(`Account limit exceeded! You have ${current}/${limit} accounts. Upgrade to Premium for unlimited accounts.`);
          setTimeout(() => {
            window.location.href = '/settings?tab=plans';
          }, 2000);
            
            return;
          }
          
          if (errorMessage.includes('CURRENCY_LIMIT_EXCEEDED')) {
            // Show toast and navigate to plans
            const { accounts } = useFinanceStore.getState();
            const uniqueCurrencies = new Set(accounts.map(a => a.currency)).size;
            const limit = 1;
            
            toast.error(`Currency limit exceeded! You have ${uniqueCurrencies}/${limit} currencies. Upgrade to Premium for unlimited currencies.`);
            setTimeout(() => {
              window.location.href = '/settings?tab=plans';
            }, 2000);
            
            return;
          }
        }
      
      toast.error('Failed to save account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDpsCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    handleFieldChange('has_dps', checked);
    
    if (checked) {
      setPendingDpsEnable(true);
    } else {
      // Clear DPS-related fields when disabling
      setFormData(prev => ({
        ...prev,
        dps_type: 'monthly',
        dps_amount_type: 'fixed',
        dps_fixed_amount: '',
        dps_initial_balance: ''
      }));
    }
  };

  const handleClose = () => {
    if (submitting) return;
    
    // Reset form state
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
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {account ? 'Edit Account' : 'Add New Account'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
                disabled={submitting}
                aria-describedby={errors.balance ? 'balance-error' : undefined}
                aria-invalid={!!errors.balance}
              />
            </div>
            {touched.balance && errors.balance && (
              <p id="balance-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.balance}
              </p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="account-currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency *
            </label>
            <select
              id="account-currency"
              value={formData.currency}
              onChange={(e) => handleFieldChange('currency', e.target.value)}
              className={getInputClasses('currency')}
              disabled={submitting}
            >
              {CURRENCY_OPTIONS.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
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
              disabled={submitting}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* DPS Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center mb-3">
              <input
                id="dps-enabled"
                type="checkbox"
                checked={formData.has_dps}
                onChange={handleDpsCheckbox}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={submitting}
              />
              <label htmlFor="dps-enabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable DPS (Daily Profit Sharing)
              </label>
              <Tooltip content={
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
              }>
                <div className="ml-2">
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
              </Tooltip>
            </div>

            {formData.has_dps && (
              <div className="space-y-3 pl-6 border-l-2 border-blue-200 dark:border-blue-700">
                {/* DPS Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    DPS Type
                  </label>
                  <select
                    value={formData.dps_type}
                    onChange={(e) => handleFieldChange('dps_type', e.target.value)}
                    className={getInputClasses('dps_type')}
                    disabled={submitting}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                {/* Amount Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount Type
                  </label>
                  <select
                    value={formData.dps_amount_type}
                    onChange={(e) => handleFieldChange('dps_amount_type', e.target.value)}
                    className={getInputClasses('dps_amount_type')}
                    disabled={submitting}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="custom">Custom Amount</option>
                  </select>
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
                      disabled={submitting}
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
                    disabled={submitting}
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
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={submitting || Object.keys(errors).length > 0}
            >
                             {submitting ? (
                 <>
                   <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   {account ? 'Updating...' : 'Creating...'}
                 </>
               ) : (
                account ? 'Update Account' : 'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
      
      {/* Upgrade Modal */}
      {console.log('🔧 AccountForm modalState:', modalState)}
      {modalState.isOpen && console.log('🔧 Modal should be visible!')}
      
      {/* Test div to see if this section renders */}
      {modalState.isOpen && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'red', color: 'white', padding: '20px', zIndex: 10000 }}>
          TEST MODAL - If you see this, the modal section is rendering
        </div>
      )}
      
      {/* Test button to manually trigger modal */}

      
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
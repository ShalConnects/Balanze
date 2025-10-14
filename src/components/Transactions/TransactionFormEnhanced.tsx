import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Tag } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Transaction } from '../../types';
import { toast } from 'sonner';
import { useLoadingContext } from '../../context/LoadingContext';
import { validateTransaction, TRANSACTION_TYPES, COMMON_CATEGORIES, getTransactionTypeDisplayName } from '../../utils/transactionUtils';
import { getDefaultAccountId } from '../../utils/defaultAccount';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TransactionFormEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
  accountId?: string;
}

export const TransactionFormEnhanced: React.FC<TransactionFormEnhancedProps> = ({ 
  isOpen, 
  onClose, 
  transaction, 
  accountId 
}) => {
  const { addTransaction, updateTransaction, error, accounts, categories } = useFinanceStore();
  const { wrapAsync, setLoadingMessage, isLoading } = useLoadingContext();

  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    type: transaction?.type || 'expense',
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || '',
    account_id: transaction?.account_id || accountId || getDefaultAccountId(),
    date: transaction?.date ? new Date(transaction.date) : new Date(),
    tags: transaction?.tags || [],
    is_recurring: false,
    recurring_frequency: 'monthly',
    saving_amount: transaction?.saving_amount?.toString() || '',
    donation_amount: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [newTag, setNewTag] = useState('');

  // Update form data when transaction prop changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        type: transaction.type,
        amount: transaction.amount.toString(),
        category: transaction.category,
        account_id: transaction.account_id,
        date: new Date(transaction.date),
        tags: transaction.tags || [],
        is_recurring: false,
        recurring_frequency: 'monthly',
        saving_amount: transaction.saving_amount?.toString() || '',
        donation_amount: ''
      });
    }
  }, [transaction]);

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normalClasses = "border-gray-200 focus:ring-blue-500";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  const handleFieldChange = (field: string, value: any) => {
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
      case 'description':
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        } else if (formData.description.length < 2) {
          newErrors.description = 'Description must be at least 2 characters';
        } else if (formData.description.length > 100) {
          newErrors.description = 'Description must be less than 100 characters';
        } else {
          delete newErrors.description;
        }
        break;
        
      case 'amount':
        const amount = parseFloat(formData.amount);
        if (isNaN(amount)) {
          newErrors.amount = 'Amount is required';
        } else if (amount <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        } else if (amount > 999999999) {
          newErrors.amount = 'Amount is too large';
        } else {
          delete newErrors.amount;
        }
        break;
        
      case 'category':
        if (!formData.category.trim()) {
          newErrors.category = 'Category is required';
        } else {
          delete newErrors.category;
        }
        break;
        
      case 'account_id':
        if (!formData.account_id) {
          newErrors.account_id = 'Account is required';
        } else {
          delete newErrors.account_id;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const validateForm = () => {
    const validation = validateTransaction({
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      account_id: formData.account_id,
      date: formData.date.toISOString(),
      type: formData.type as any
    });
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        if (error.includes('description')) newErrors.description = error;
        if (error.includes('amount')) newErrors.amount = error;
        if (error.includes('category')) newErrors.category = error;
        if (error.includes('account')) newErrors.account_id = error;
        if (error.includes('date')) newErrors.date = error;
        if (error.includes('type')) newErrors.type = error;
      });
      setErrors(newErrors);
      return false;
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Mark all fields as touched
    setTouched({
      description: true,
      type: true,
      amount: true,
      category: true,
      account_id: true,
      date: true,
      tags: true,
      is_recurring: true,
      recurring_frequency: true,
      saving_amount: true,
      donation_amount: true
    });
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    const wrappedSubmit = wrapAsync(async () => {
      setLoadingMessage(transaction ? 'Updating transaction...' : 'Saving transaction...');
      
      try {
        const transactionData = {
          description: formData.description.trim(),
          type: formData.type as any,
          amount: parseFloat(formData.amount),
          category: formData.category.trim(),
          account_id: formData.account_id,
          date: formData.date.toISOString(),
          tags: formData.tags,
          saving_amount: formData.saving_amount ? parseFloat(formData.saving_amount) : undefined
        };

        if (transaction) {
          await updateTransaction(transaction.id, transactionData);
          toast.success('Transaction updated successfully!');
        } else {
          await addTransaction(transactionData);
          toast.success('Transaction created successfully!');
        }
        
        onClose();
      } catch (error) {

        toast.error('Failed to save transaction. Please try again.');
      } finally {
        // Loading handled by context
      }
    });
    
    await wrappedSubmit();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleFieldChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleFieldChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleClose = () => {
    if (isLoading) return;
    
    // Reset form state
    setFormData({
      description: '',
      type: 'expense',
      amount: '',
      category: '',
      account_id: accountId || getDefaultAccountId(),
      date: new Date(),
      tags: [],
      is_recurring: false,
      recurring_frequency: 'monthly',
      saving_amount: '',
      donation_amount: ''
    });
    setErrors({});
    setTouched({});
    onClose();
  };

  const selectedAccount = accounts.find(a => a.id === formData.account_id);
  const availableCategories = categories.filter(c => c.type === formData.type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLoading}
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="transaction-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <input
                id="transaction-description"
                type="text"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                className={getInputClasses('description')}
                placeholder="e.g., Grocery shopping, Salary payment"
                disabled={isLoading}
                aria-describedby={errors.description ? 'description-error' : undefined}
                aria-invalid={!!errors.description}
              />
              {touched.description && errors.description && (
                <p id="description-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label htmlFor="transaction-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                id="transaction-type"
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className={getInputClasses('type')}
                disabled={isLoading}
              >
                {TRANSACTION_TYPES.map(type => (
                  <option key={type} value={type}>
                    {getTransactionTypeDisplayName(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="transaction-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount *
              </label>
              <div className="relative">
                <input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                  onBlur={() => handleBlur('amount')}
                  className={getInputClasses('amount')}
                  placeholder="0.00"
                  disabled={isLoading}
                  aria-describedby={errors.amount ? 'amount-error' : undefined}
                  aria-invalid={!!errors.amount}
                />
                {selectedAccount && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {selectedAccount.currency}
                  </div>
                )}
              </div>
              {touched.amount && errors.amount && (
                <p id="amount-error" className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="transaction-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                id="transaction-category"
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                onBlur={() => handleBlur('category')}
                className={getInputClasses('category')}
                disabled={isLoading}
              >
                <option value="">Select category</option>
                {availableCategories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                {COMMON_CATEGORIES[formData.type as keyof typeof COMMON_CATEGORIES]?.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {touched.category && errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Account */}
            <div>
              <label htmlFor="transaction-account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account *
              </label>
              <select
                id="transaction-account"
                value={formData.account_id}
                onChange={(e) => handleFieldChange('account_id', e.target.value)}
                onBlur={() => handleBlur('account_id')}
                className={getInputClasses('account_id')}
                disabled={isLoading}
              >
                <option value="">Select account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
              {touched.account_id && errors.account_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.account_id}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="transaction-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date *
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.date}
                  onChange={(date) => handleFieldChange('date', date)}
                  className={getInputClasses('date')}
                  disabled={isLoading}
                  maxDate={new Date()}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center mb-3">
              <Tag className="w-4 h-4 text-gray-400 mr-2" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
              </label>
            </div>
            <div className="space-y-3">
              {/* Add Tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  disabled={!newTag.trim()}
                >
                  Add
                </button>
              </div>
              
              {/* Tags List */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recurring Section (hidden for now) */}
          {/* <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center mb-3">
              <input
                id="recurring-enabled"
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => handleFieldChange('is_recurring', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={isLoading}
              />
              <label htmlFor="recurring-enabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Recurring Transaction
              </label>
              <div className="ml-2">
                <Info className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {formData.is_recurring && (
              <div className="pl-6 border-l-2 border-blue-200 dark:border-blue-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.recurring_frequency}
                  onChange={(e) => handleFieldChange('recurring_frequency', e.target.value)}
                  className={getInputClasses('recurring_frequency')}
                  disabled={isLoading}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div> */}

          {/* Additional Amounts Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Additional Amounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Saving Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Saving Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.saving_amount}
                  onChange={(e) => handleFieldChange('saving_amount', e.target.value)}
                  className={getInputClasses('saving_amount')}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>

              {/* Donation Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Donation Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.donation_amount}
                  onChange={(e) => handleFieldChange('donation_amount', e.target.value)}
                  className={getInputClasses('donation_amount')}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>
            </div>
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
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading || Object.keys(errors).length > 0}
            >
              {transaction ? 'Update Transaction' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 


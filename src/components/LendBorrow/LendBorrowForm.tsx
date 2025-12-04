import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LendBorrow, LendBorrowInput } from '../../types/index';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from 'sonner';
import { CustomDropdown } from '../Purchases/CustomDropdown';
// DatePicker loaded dynamically to reduce initial bundle size
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';
import { parseISO } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { Loader } from '../../components/common/Loader';
import { useLoadingContext } from '../../context/LoadingContext';
import { getCurrencySymbol } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface LendBorrowFormProps {
  record?: LendBorrow;
  onClose: () => void;
  onSubmit: (data: LendBorrowInput) => void;
}

export const LendBorrowForm: React.FC<LendBorrowFormProps> = ({ record, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { accounts, lendBorrowRecords } = useFinanceStore();
  const { profile } = useAuthStore();
  const { isLoading } = useLoadingContext();
  const { isMobile } = useMobileDetection();
  const [form, setForm] = useState<LendBorrowInput>({
    type: record?.type || '',
    person_name: record?.person_name || '',
    amount: record?.amount || undefined,
    currency: '', // Will be set automatically from selected account
    due_date: record?.due_date || '',
    notes: record?.notes || '',
    status: record?.status || 'active',
    partial_return_amount: record?.partial_return_amount || 0,
    partial_return_date: record?.partial_return_date || '',
    account_id: record?.account_id || profile?.default_account_id || '',
    affect_account_balance: record?.affect_account_balance ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const typeRef = useRef<HTMLInputElement | null>(null);
  const personNameRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Autocomplete state for person name
  const [showPersonNameSuggestions, setShowPersonNameSuggestions] = useState(false);
  const [personNameSuggestions, setPersonNameSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Responsive: stack fields vertically on mobile
  const fieldRowClass = 'flex flex-col sm:flex-row gap-2 sm:gap-x-4 sm:items-center';
  const fieldColClass = 'flex-1';

  // Currency will be automatically set from the selected account
  // No need for currency dropdown since it comes from the account

  // Sort accounts to show default account first
  const sortedAccountOptions = [
    ...accounts.filter(acc => acc.id === profile?.default_account_id),
    ...accounts.filter(acc => acc.id !== profile?.default_account_id)
  ];

  // Auto-set currency when account is selected
  useEffect(() => {
    if (form.account_id) {
      const selectedAccount = accounts.find(acc => acc.id === form.account_id);
      if (selectedAccount) {
        setForm(prev => ({ ...prev, currency: selectedAccount.currency }));
      }
    }
  }, [form.account_id, accounts]);

  // Autofocus first field on open
  useEffect(() => {
    if (typeRef.current) {
      typeRef.current.focus();
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.person_name.trim()) {
      newErrors.person_name = 'Person name is required';
    }
    if (!form.amount || form.amount <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!form.type) {
      newErrors.type = 'Type is required';
    }
    if (form.affect_account_balance && !form.account_id) {
      newErrors.account_id = 'Account is required when affecting account balance';
    }
    if (!form.affect_account_balance && !form.currency) {
      newErrors.currency = 'Currency is required for record-only transactions';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  // Inline validation on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateForm();
  };

  const handleDropdownBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
    if (errors[name]) setErrors((prev: Record<string, string>) => ({ ...prev, [name]: '' }));
    
    // Handle autocomplete for person name
    if (name === 'person_name') {
      generatePersonNameSuggestions(value);
    }
  };

  const handleDropdownChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
  };

  // Generate person name suggestions
  const generatePersonNameSuggestions = (input: string) => {
    if (!input.trim()) {
      setPersonNameSuggestions([]);
      setShowPersonNameSuggestions(false);
      return;
    }

    const suggestions = lendBorrowRecords
      .map(record => record.person_name)
      .filter((name, index, self) => 
        name.toLowerCase().includes(input.toLowerCase()) && 
        self.indexOf(name) === index
      )
      .slice(0, 5);

    setPersonNameSuggestions(suggestions);
    setShowPersonNameSuggestions(suggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // Handle keyboard navigation for suggestions
  const handlePersonNameKeyDown = (e: React.KeyboardEvent) => {
    if (!showPersonNameSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < personNameSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : personNameSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        const suggestion = personNameSuggestions[selectedSuggestionIndex];
        setForm(prev => ({ ...prev, person_name: suggestion }));
        setShowPersonNameSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setShowPersonNameSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setForm(prev => ({ ...prev, person_name: suggestion }));
    setShowPersonNameSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleClear = (field: 'person_name' | 'notes') => {
    setForm((prev) => ({ ...prev, [field]: '' }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setTouched((prev) => ({ ...prev, [field]: false }));
    if (field === 'person_name' && personNameRef.current) personNameRef.current.focus();
    if (field === 'notes' && notesRef.current) notesRef.current.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ person_name: true, amount: true, type: true });
    
    // Ensure currency is set from the selected account (only for account-linked records)
    if (form.affect_account_balance && form.account_id) {
      const selectedAccount = accounts.find(acc => acc.id === form.account_id);
      if (selectedAccount) {
        setForm(prev => ({ ...prev, currency: selectedAccount.currency }));
      }
    }

    // Auto-set due date to 7 days from today if not provided (for all records)
    let updatedForm = { ...form };
    if (!form.due_date || form.due_date === '') {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const dueDateString = sevenDaysFromNow.getFullYear() + '-' + 
        String(sevenDaysFromNow.getMonth() + 1).padStart(2, '0') + '-' + 
        String(sevenDaysFromNow.getDate()).padStart(2, '0');
      updatedForm = { ...updatedForm, due_date: dueDateString };
    }
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    try {
      // Add a small delay to ensure loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      await onSubmit(updatedForm);
      // Add a small delay before closing to show success state
      await new Promise(resolve => setTimeout(resolve, 300));
      onClose();
    } catch (error) {
      console.error('❌ Form submit error:', error);

      
      // Check if it's a plan limit error and show upgrade prompt
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        const errorMessage = error.message;
        
        if (errorMessage && errorMessage.includes('FEATURE_NOT_AVAILABLE') && errorMessage.includes('lend & borrow')) {
          toast.error('Lend & borrow tracking is a Premium feature. Upgrade to Premium to track loans and borrowings.');
          setTimeout(() => {
            window.location.href = '/settings?tab=plans';
          }, 2000);
          
          return;
        }
      }
      
      toast.error('Failed to save record. Please try again.');
    }
  };

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const errorClasses = "border-red-500 ring-2 ring-red-200 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normalClasses = "border-gray-200 focus:ring-blue-500";
    return `${baseClasses} ${errors[fieldName] && touched[fieldName] ? errorClasses : normalClasses}`;
  };

  // DatePicker: highlight today, allow typing, quick-select today
  const today = new Date();
  const handleDateChange = (date: Date | null) => {
    handleDropdownChange('due_date', date ? date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') : '');
  };
  const handleDateToday = () => {
    handleDropdownChange('due_date', today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'));
  };

  // Disable Add button if required fields missing or submitting
  const isFormValid = form.person_name.trim() && form.amount && form.amount > 0 && form.type && 
    (form.affect_account_balance ? form.account_id : form.currency);

  return (
    <>
      <Loader isLoading={isLoading} message="Saving lend/borrow..." />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
        {/* Modal Container */}
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-[38rem] max-h-[90vh] overflow-y-auto z-50 shadow-2xl transition-all ${isMobile ? 'pb-32' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {record ? t('lendBorrow.editLendBorrow') : t('lendBorrow.addLendBorrow')}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Balance Toggle */}
            <div className="w-full" style={{ marginTop: 0, marginBottom: '15px' }}>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 shadow-sm ${
                      form.affect_account_balance 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setForm(prev => ({ ...prev, affect_account_balance: true }));
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        From Account
                      </div>
                      <div className="text-gray-600 dark:text-gray-400" style={{ fontSize: '10px' }}>
                        Affects Balance
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 shadow-sm ${
                      !form.affect_account_balance 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setForm(prev => ({ ...prev, affect_account_balance: false, account_id: '' }));
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        Record Only
                      </div>
                      <div className="text-gray-600 dark:text-gray-400" style={{ fontSize: '10px' }}>
                        No Balance Change
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Message for Record Only */}
            {!form.affect_account_balance && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3" style={{ marginBottom: '15px' }}>
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Record Only Mode:</strong> This record won't affect account balances. You must manually select the currency for this transaction.
                  </span>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className={fieldRowClass} style={{ marginTop: 0 }}>
              <div className={fieldColClass}>
                <CustomDropdown
                  value={form.type}
                  onChange={(value) => handleDropdownChange('type', value)}
                  options={[
                    { value: 'lend', label: t('lendBorrow.lend') },
                    { value: 'borrow', label: t('lendBorrow.borrow') },
                  ]}
                  placeholder="Type *"
                  disabled={!!record}
                />
                {errors.type && touched.type ? (
                  <p className="mt-1 text-xs text-red-600 flex items-center min-h-[20px]">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.type}
                  </p>
                ) : (
                  <div className="min-h-[20px]" />
                )}
              </div>

              <div className={fieldColClass + ' relative'}>
                <input
                  ref={personNameRef}
                  name="person_name"
                  value={form.person_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handlePersonNameKeyDown}
                  onFocus={() => {
                    if (form.person_name.trim()) {
                      generatePersonNameSuggestions(form.person_name);
                    }
                  }}
                  className={getInputClasses('person_name') + ' min-w-[200px] pr-8'}
                  placeholder="Enter person's name *"
                  autoComplete="off"
                  autoFocus={!record}
                />
                {form.person_name && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => handleClear('person_name')}
                    tabIndex={-1}
                    aria-label="Clear person name"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Autocomplete suggestions */}
                {showPersonNameSuggestions && personNameSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {personNameSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          index === selectedSuggestionIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {(() => {
                          const query = form.person_name.trim();
                          const matchIndex = suggestion.toLowerCase().indexOf(query.toLowerCase());
                          if (matchIndex < 0) return suggestion;
                          const before = suggestion.slice(0, matchIndex);
                          const match = suggestion.slice(matchIndex, matchIndex + query.length);
                          const after = suggestion.slice(matchIndex + query.length);
                          return (
                            <span>
                              {before}
                              <span className="font-semibold text-blue-700 dark:text-blue-300">{match}</span>
                              {after}
                            </span>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.person_name && touched.person_name ? (
                  <p className="mt-1 text-xs text-red-600 flex items-center min-h-[20px]">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.person_name}
                  </p>
                ) : (
                  <div className="min-h-[20px]" />
                )}
              </div>
            </div>

            {/* Account Selection and Amount - Side by Side */}
            <div className={fieldRowClass} style={{ marginTop: 0 }}>
              <div className={fieldColClass}>
                {form.affect_account_balance ? (
                  <CustomDropdown
                    value={form.account_id}
                    onChange={(value) => handleDropdownChange('account_id', value)}
                    options={sortedAccountOptions
                      .map(account => ({
                        value: account.id,
                        label: `${account.name} (${account.currency}) - ${getCurrencySymbol(account.currency)}${account.calculated_balance?.toFixed(2) || '0.00'}`
                      }))
                    }
                    placeholder="Select account *"
                    disabled={!!record}
                  />
                ) : (
                  <CustomDropdown
                    value={form.currency}
                    onChange={(value) => handleDropdownChange('currency', value)}
                    options={Array.from(new Set(accounts.map(acc => acc.currency)))
                      .map(currency => ({
                        value: currency,
                        label: `${currency} - ${getCurrencySymbol(currency)}`
                      }))
                    }
                    placeholder="Select currency *"
                    disabled={!!record}
                  />
                )}
                {errors.account_id && touched.account_id ? (
                  <p className="mt-1 text-xs text-red-600 flex items-center min-h-[20px]">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.account_id}
                  </p>
                ) : errors.currency && touched.currency ? (
                  <p className="mt-1 text-xs text-red-600 flex items-center min-h-[20px]">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.currency}
                  </p>
                ) : (
                  <div className="min-h-[20px]" />
                )}
              </div>

              <div className={fieldColClass + ' relative'}>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClasses('amount') + ' min-w-[150px]'}
                  placeholder="0.00 *"
                  autoComplete="off"
                />
                {errors.amount && touched.amount ? (
                  <p className="mt-1 text-xs text-red-600 flex items-center min-h-[20px]">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.amount}
                  </p>
                ) : (
                  <div className="min-h-[20px]" />
                )}
              </div>
            </div>

            {/* Due Date - Show for all records */}
            <div className="w-full" style={{ marginTop: 0, marginBottom: '15px' }}>
              <div className={getInputClasses('due_date') + ' flex items-center bg-gray-100 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full'}>
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <DatePicker
                  selected={form.due_date ? parseISO(form.due_date) : null}
                  onChange={handleDateChange}
                  onBlur={() => handleDropdownBlur('due_date')}
                  placeholderText="Due date"
                  dateFormat="yyyy-MM-dd"
                  className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px]"
                  calendarClassName="z-50 shadow-lg border border-gray-200 rounded-lg !font-sans"
                  popperPlacement="bottom-start"
                  showPopperArrow={false}
                  wrapperClassName="w-full"
                  todayButton="Today"
                  highlightDates={[today]}
                  isClearable
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="ml-2 text-xs text-blue-600 hover:underline"
                  onClick={handleDateToday}
                  tabIndex={-1}
                >
                  Today
                </button>
              </div>
              {errors.due_date && touched.due_date && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.due_date}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="relative" style={{ marginTop: 0 }}>
              <textarea
                ref={notesRef}
                name="notes"
                value={form.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputClasses('notes') + ' w-full resize-none h-[100px] pr-8'}
                placeholder="Add any notes, description, or additional details about this transaction"
              />
              {form.notes && (
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  onClick={() => handleClear('notes')}
                  tabIndex={-1}
                  aria-label="Clear notes"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {errors.notes && touched.notes && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.notes}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {record ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}; 


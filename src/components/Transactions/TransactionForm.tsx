import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, HelpCircle } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { Transaction } from '../../types/index';
import { PurchaseAttachment } from '../../types';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { logTransactionEvent } from '../../lib/auditLogging';
import { PurchaseDetailsSection } from './PurchaseDetailsSection';
import { generateTransactionId } from '../../utils/transactionId';
import { getCurrencySymbol } from '../../utils/currency';
import { getDefaultAccountId } from '../../utils/defaultAccount';
import { CustomDropdown } from '../Purchases/CustomDropdown';
// DatePicker loaded dynamically to reduce initial bundle size
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';
import { parseISO, format } from 'date-fns';
import { CategoryModal } from '../common/CategoryModal';
import { useLoadingContext } from '../../context/LoadingContext';
import { getFilteredCategoriesForTransaction } from '../../utils/categoryFiltering';
import { useDescriptionSuggestions } from '../../hooks/useDescriptionSuggestions';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';

interface TransactionFormProps {
  accountId?: string;
  onClose: () => void;
  transactionToEdit?: Transaction;
  duplicateFrom?: Transaction;
  isOpen?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ accountId, onClose, transactionToEdit, duplicateFrom, isOpen = true }) => {
  const accounts = useFinanceStore(state => state.accounts);
  const categories = useFinanceStore(state => state.categories);
  const purchaseCategories = useFinanceStore(state => state.purchaseCategories);
  const addTransaction = useFinanceStore(state => state.addTransaction);
  const updateTransaction = useFinanceStore(state => state.updateTransaction);
  const addPurchaseCategory = useFinanceStore(state => state.addPurchaseCategory);
  const fetchAccounts = useFinanceStore(state => state.fetchAccounts);
  const addCategory = useFinanceStore(state => state.addCategory);
  const purchases = useFinanceStore(state => state.purchases);

  const { user } = useAuthStore();
  const { wrapAsync, setLoadingMessage, isLoading } = useLoadingContext();
  const { isPremiumPlan } = usePlanFeatures();
  const isEditMode = !!transactionToEdit;
  const transactionToInitialize = transactionToEdit || duplicateFrom;

  const [data, setData] = useState({
    account_id: accountId || getDefaultAccountId(),
    amount: '',
    type: '' as 'income' | 'expense' | '',
    category: '',
    description: '',
    tags: [] as string[],
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly'
  });

  const [isExpenseType, setIsExpenseType] = useState('' as 'purchase' | 'cash_withdrawal' | 'regular_expense' | '');
  // Add state for donation
  const [donationType, setDonationType] = useState<'fixed' | 'percent'>('fixed');
  const [donationValue, setDonationValue] = useState<number | undefined>(undefined);
  // Add state for recurring transaction end date
  const [recurringEndDate, setRecurringEndDate] = useState<string | undefined>(undefined);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    category_name: '',
    description: '',
    monthly_budget: 0,
    currency: 'USD',
    category_color: '#10B981'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showAddAnother, setShowAddAnother] = useState(false);

  // Purchase details state
  const [purchasePriority, setPurchasePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseAttachments, setPurchaseAttachments] = useState<PurchaseAttachment[]>([]);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false);
  const [showPurchaseNote, setShowPurchaseNote] = useState(false);

  // Check if selected category is a purchase category - memoized to prevent infinite re-renders
  const isPurchaseCategory = React.useMemo(() =>
    isExpenseType === 'purchase' && purchaseCategories.some(cat => cat.category_name === data.category),
    [isExpenseType, purchaseCategories, data.category]
  );

  // Get filtered categories based on account currency
  const filteredCategoriesData = React.useMemo(() => {
    return getFilteredCategoriesForTransaction(
      categories,
      purchaseCategories,
      accounts,
      data.account_id,
      data.type as 'income' | 'expense',
      isExpenseType
    );
  }, [categories, purchaseCategories, accounts, data.account_id, data.type, isExpenseType]);
  
  // Debug logging removed to prevent console flood

  // Add refs for auto-focus and clear input
  const amountRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLInputElement | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const descriptionSuggestions = useDescriptionSuggestions(data.description, 8);

  // Add isFormValid variable after data and errors are defined - memoized to prevent infinite re-renders
  const isFormValid = React.useMemo(() => 
    data.account_id &&
    data.amount &&
    parseFloat(data.amount) > 0 &&
    data.type &&
    data.category &&
    data.category.trim().length > 0 &&
    data.date &&
    Object.keys(errors).length === 0,
    [data.account_id, data.amount, data.type, data.category, data.date, errors, isExpenseType]
  );

  const validateForm = React.useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!data.account_id) {
      newErrors.account_id = 'Account is required';
    }
    
    if (!data.amount || parseFloat(data.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!data.type) {
      newErrors.type = 'Transaction type is required';
    }
    
    if (data.type === 'expense' && isExpenseType === 'purchase' && !data.category) {
      newErrors.category = 'Category is required for purchases';
    }
    
    if (data.type === 'expense' && isExpenseType === 'regular_expense' && !data.category) {
      newErrors.category = 'Category is required for regular expenses';
    }
    
    if (data.type === 'expense' && isExpenseType === 'cash_withdrawal') {
      if (!data.description?.trim()) {
        newErrors.description = 'Description is required for cash withdrawals';
      }
    }
    
    if (data.type === 'income' && !data.category) {
      newErrors.category = 'Category is required for income';
    }
    
    if (!data.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.account_id, data.amount, data.type, data.category, data.description, data.date, isExpenseType]);

  // Auto-validate form when data changes
  React.useEffect(() => {
    validateForm();
  }, [validateForm]);

  const getInputClasses = React.useCallback((fieldName: string) => {
    const baseClasses = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normalClasses = "border-gray-200 focus:ring-blue-500";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  }, [errors]);

  // Track the current transaction being edited to detect changes
  const currentTransactionId = useRef<string | undefined>(undefined);
  
  // Initialize form state when modal opens or transaction changes
  useEffect(() => {
    if (isOpen) {
      const transactionId = transactionToEdit?.id;
      const duplicateId = duplicateFrom?.id;
      const currentId = transactionId || duplicateId;
      
      // Check if we need to reinitialize (different transaction or new form)
      // Always reset for new transactions, or when editing/duplicating a different transaction
      if (!transactionToInitialize || currentTransactionId.current !== currentId) {
        
        // Reset all form state
        setErrors({});
        setTouched({});
        setFormSubmitted(false);
        setShowCategoryModal(false);
        setShowPurchaseDetails(false);
        setPurchaseAttachments([]);
        setShowAddAnother(false);
        setNewCategory({
          category_name: '',
          description: '',
          monthly_budget: 0,
          currency: 'USD',
          category_color: '#10B981'
        });
        
    if (transactionToEdit) {
          // Initialize for editing
      setData({
        account_id: transactionToEdit.account_id,
        amount: transactionToEdit.amount.toString(),
        type: transactionToEdit.type,
        category: transactionToEdit.category,
        description: transactionToEdit.description,
        tags: transactionToEdit.tags || [],
        date: new Date(transactionToEdit.date).toISOString().split('T')[0],
        is_recurring: transactionToEdit.is_recurring,
        recurring_frequency: (transactionToEdit.recurring_frequency as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly'
      });
          
            // Set expense type based on category
      if (transactionToEdit.type === 'expense') {
        setIsExpenseType('regular_expense');
      } else {
        setIsExpenseType('');
      }
          
          // Initialize donation values if this is an income transaction with donation
          // Fetch the actual donation record to get mode (fixed/percent) and mode_value
          if (transactionToEdit.type === 'income' && transactionToEdit.donation_amount) {
            // Use async IIFE to handle async donation record fetch
            (async () => {
              try {
                const { data: donationRecord } = await supabase
                  .from('donation_saving_records')
                  .select('mode, mode_value, amount')
                  .eq('transaction_id', transactionToEdit.id)
                  .eq('type', 'donation')
                  .limit(1)
                  .maybeSingle();

                if (donationRecord) {
                  setDonationType(donationRecord.mode || 'fixed');
                  // Use mode_value if available, otherwise use amount
                  setDonationValue(donationRecord.mode_value || donationRecord.amount || transactionToEdit.donation_amount);
                } else {
                  // Fallback to fixed if no donation record found
                  setDonationType('fixed');
                  setDonationValue(transactionToEdit.donation_amount);
                }
              } catch (error) {
                // Fallback to fixed if error fetching donation record
                setDonationType('fixed');
                setDonationValue(transactionToEdit.donation_amount);
              }
            })();
          } else {
            setDonationType('fixed');
            setDonationValue(undefined);
          }
          
          // Initialize recurring end date
          setRecurringEndDate(transactionToEdit.recurring_end_date || undefined);
          
          // Reset purchase details
          setPurchasePriority('medium');
          setPurchaseNotes('');
        } else if (duplicateFrom) {
          // Initialize for duplicating a transaction
          setData({
            account_id: duplicateFrom.account_id,
            amount: duplicateFrom.amount.toString(),
            type: duplicateFrom.type,
            category: duplicateFrom.category,
            description: duplicateFrom.description,
            tags: duplicateFrom.tags || [],
            date: new Date(duplicateFrom.date).toISOString().split('T')[0],
            is_recurring: false, // Don't duplicate recurring settings
            recurring_frequency: 'monthly'
          });
          
          // Set expense type based on category
          if (duplicateFrom.type === 'expense') {
            setIsExpenseType('regular_expense');
          } else {
            setIsExpenseType('');
          }
          
          // Initialize donation values if this is an income transaction with donation
          if (duplicateFrom.type === 'income' && duplicateFrom.donation_amount) {
            (async () => {
              try {
                const { data: donationRecord } = await supabase
                  .from('donation_saving_records')
                  .select('mode, mode_value, amount')
                  .eq('transaction_id', duplicateFrom.id)
                  .eq('type', 'donation')
                  .limit(1)
                  .maybeSingle();

                if (donationRecord) {
                  setDonationType(donationRecord.mode || 'fixed');
                  setDonationValue(donationRecord.mode_value || donationRecord.amount || duplicateFrom.donation_amount);
                } else {
                  setDonationType('fixed');
                  setDonationValue(duplicateFrom.donation_amount);
                }
              } catch (error) {
                setDonationType('fixed');
                setDonationValue(duplicateFrom.donation_amount);
              }
            })();
          } else {
            setDonationType('fixed');
            setDonationValue(undefined);
          }
          
          // Don't duplicate recurring end date
          setRecurringEndDate(undefined);
          
          // Reset purchase details
          setPurchasePriority('medium');
          setPurchaseNotes('');
        } else {
          // Initialize for new transaction
          setData({
            account_id: accountId || getDefaultAccountId(),
            amount: '',
            type: '' as 'income' | 'expense' | '',
            category: '',
            description: '',
            tags: [],
            date: new Date().toISOString().split('T')[0],
            is_recurring: false,
            recurring_frequency: 'monthly'
          });
          setIsExpenseType('');
          setDonationType('fixed');
          setDonationValue(undefined);
          setRecurringEndDate(undefined);
          setPurchasePriority('medium');
          setPurchaseNotes('');
        }
        
        // Update the current transaction ID
        currentTransactionId.current = transactionId;
      }
    } else {
      // Reset when modal closes
      currentTransactionId.current = undefined;
    }
  }, [isOpen, transactionToEdit, duplicateFrom, accountId]);


  useEffect(() => {
    // Show purchase details if this is a purchase category
    setShowPurchaseDetails(isPurchaseCategory);
  }, [isPurchaseCategory]);

  useEffect(() => {
    if (isExpenseType === 'purchase') {
      setShowPurchaseNote(true);
      const timer = setTimeout(() => setShowPurchaseNote(false), 7000);
      return () => clearTimeout(timer);
    } else {
      setShowPurchaseNote(false);
    }
  }, [isExpenseType]);

  // Ensure purchase categories are loaded when component mounts and form is open
  useEffect(() => {
    // Only fetch purchase categories if form is open, user is authenticated, and categories are empty
    if (isOpen && user && purchaseCategories.length === 0) {
      useFinanceStore.getState().fetchPurchaseCategories();
    }
  }, [isOpen, user]); // Removed purchaseCategories.length from dependencies

  // Load existing purchase data when editing a transaction
  useEffect(() => {
    if (isEditMode && transactionToEdit && isPurchaseCategory && currentTransactionId.current === transactionToEdit.id) {
      // Find the linked purchase for this transaction
      const linkedPurchase = purchases.find(p => p.transaction_id === transactionToEdit.transaction_id);
      if (linkedPurchase) {

        setPurchasePriority(linkedPurchase.priority);
        setPurchaseNotes(linkedPurchase.notes || '');
        // Note: Attachments would need to be loaded separately if needed
      }
    }
  }, [isEditMode, transactionToEdit, isPurchaseCategory]); // Removed purchases from dependencies

  // Focus amount field when form opens
  useEffect(() => {
    if (isOpen && amountRef.current && !transactionToEdit) {
      // Only focus for new transactions, not when editing
      setTimeout(() => {
    if (amountRef.current) {
      amountRef.current.focus();
    }
      }, 100);
    }
  }, [isOpen, transactionToEdit]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setErrors({});
      setTouched({});
      setFormSubmitted(false);
      setShowCategoryModal(false);
      setShowPurchaseDetails(false);
      setPurchaseAttachments([]);
      setRecurringEndDate(undefined);
      setShowAddAnother(false);
      setNewCategory({
        category_name: '',
        description: '',
        monthly_budget: 0,
        currency: 'USD',
        category_color: '#10B981'
      });
      currentTransactionId.current = undefined;
    }
  }, [isOpen]);

  // Debug logging for form state changes - removed to prevent infinite re-renders

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateForm();
  };

  const handleDropdownBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleClear = (field: 'amount' | 'description') => {
    setData((prev) => ({ ...prev, [field]: '' }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setTouched((prev) => ({ ...prev, [field]: false }));
    if (field === 'amount' && amountRef.current) amountRef.current.focus();
    if (field === 'description' && descriptionRef.current) descriptionRef.current.focus();
  };

  // Get the cash account or create one if it doesn't exist
  const getCashAccount = async () => {

    const cashAccount = accounts.find(a => a.name === 'Cash Wallet');
    if (cashAccount) {

      return cashAccount;
    }


    // Get the source account to use its currency
    const sourceAccount = accounts.find(a => a.id === data.account_id);
    const defaultCurrency = sourceAccount?.currency || 'USD';


    try {
      // Create a new cash account directly using supabase
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('accounts')
        .insert([{
          name: 'Cash Wallet',
          type: 'cash', // Use cash type if available, otherwise 'checking'
          initial_balance: 0,
          calculated_balance: 0,
          currency: defaultCurrency,
          description: 'Cash wallet for tracking physical money',
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null,
          is_active: true,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {

        throw new Error(`Failed to create cash account: ${error.message}`);
      }


      
      // Refresh accounts list
      await fetchAccounts();
      
      // Find the newly created account
      const refreshedAccounts = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'Cash Wallet')
        .single();

      if (refreshedAccounts.error) {

        throw new Error('Failed to fetch updated accounts');
      }

      const cashAccount = refreshedAccounts.data;
      if (!cashAccount) {
        throw new Error('Cash account was created but not found in refreshed list');
      }


      return {
        ...cashAccount,
        id: cashAccount.id,
        is_active: cashAccount.is_active,
        calculated_balance: Number(cashAccount.calculated_balance) || 0,
        initial_balance: Number(cashAccount.initial_balance) || 0,
      };
    } catch (error) {

      throw error;
    }
  };

  // Helper to calculate next occurrence date based on frequency
  // Handles edge cases like month-end dates properly (matches backend logic)
  const calculateNextOccurrenceDate = (currentDate: string, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): string => {
    const date = new Date(currentDate);
    const originalDay = date.getDate();
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        // Preserve the day of month, handling month-end dates
        date.setMonth(date.getMonth() + 1);
        // If the day doesn't exist in the new month (e.g., Jan 31 -> Feb), adjust to last day of month
        if (date.getDate() !== originalDay) {
          date.setDate(0); // Go to last day of previous month (which is the target month)
        }
        break;
      case 'yearly':
        // Preserve month and day, handling leap years
        const originalMonth = date.getMonth();
        date.setFullYear(date.getFullYear() + 1);
        // Handle Feb 29 -> Feb 28 in non-leap years
        if (originalMonth === 1 && originalDay === 29 && date.getMonth() === 2) {
          date.setDate(0); // Go to last day of February
        }
        break;
    }
    return date.toISOString().split('T')[0];
  };

  // Helper to upsert donation/saving records
  async function upsertDonationSavingRecords({ userId, transactionId, customTransactionId, donation, donationMode, modeValue }: {
    userId: string;
    transactionId: string;
    customTransactionId?: string;
    donation?: number;
    donationMode?: 'fixed' | 'percent';
    modeValue?: number;
  }) {
    try {
      
      // Remove old records for this transaction
      const { error: deleteError } = await supabase
        .from('donation_saving_records')
        .delete()
        .eq('transaction_id', transactionId);
      
      if (deleteError) {

      }
      
      // Insert new records if present
      const inserts = [];
      if (donation && donation > 0 && donationMode) {
        const donationRecord = {
          user_id: userId,
          transaction_id: transactionId,
          custom_transaction_id: customTransactionId,
          type: 'donation',
          amount: Math.abs(donation),
          mode: donationMode,
          mode_value: modeValue,
          status: 'pending',
        };

        inserts.push(donationRecord);
      }
      
      if (inserts.length > 0) {

        const { error } = await supabase
          .from('donation_saving_records')
          .insert(inserts)
          .select();
        if (error) {
          // Error saving donation records
        }
      } else {

      }
    } catch (err) {

    }
  }

  // Reset form with pre-filled values for "Add Another" feature
  const resetFormForAddAnother = () => {
    const currentAccountId = data.account_id;
    const currentDate = data.date;
    const currentType = data.type;
    const currentExpenseType = isExpenseType;
    
    // Reset form but keep account, date, and type
    setData({
      account_id: currentAccountId || getDefaultAccountId(),
      amount: '',
      type: currentType || '' as 'income' | 'expense' | '',
      category: '',
      description: '',
      tags: [],
      date: currentDate || new Date().toISOString().split('T')[0],
      is_recurring: false,
      recurring_frequency: 'monthly'
    });
    setIsExpenseType(currentExpenseType || '');
    setDonationType('fixed');
    setDonationValue(undefined);
    setRecurringEndDate(undefined);
    setPurchasePriority('medium');
    setPurchaseNotes('');
    setPurchaseAttachments([]);
    setErrors({});
    setTouched({});
    setFormSubmitted(false);
    setShowCategoryModal(false);
    setShowPurchaseDetails(false);
    setShowAddAnother(false);
    
    // Focus amount field
    setTimeout(() => {
      if (amountRef.current) {
        amountRef.current.focus();
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (isLoading) return; // Prevent double submission
    if (!user) return;
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form');
      return;
    }
    
    // Wrap the entire submit process with loading state
    const wrappedSubmit = wrapAsync(async () => {
      setLoadingMessage(isEditMode ? 'Updating transaction...' : 'Saving transaction...'); // Show loading message for form submission
      try {
        let donation_amount: number | undefined = undefined;

        if (data.type === 'income' && donationValue !== undefined && !isNaN(donationValue)) {
          if (donationType === 'percent') {
            // Calculate percentage of the transaction amount
            const baseAmount = Math.abs(parseFloat(data.amount));
            donation_amount = baseAmount * (donationValue / 100);
          } else {
            donation_amount = Math.abs(donationValue);
          }
          // If you want to store as negative for percent, uncomment below:
          // if (donationType === 'percent') donation_amount = -donation_amount;
        }

        if (data.type === 'expense' && isExpenseType === 'cash_withdrawal') {

          // Handle cash withdrawal
          const cashAccount = await getCashAccount();
          if (!cashAccount) {
            throw new Error('Failed to get or create cash account');
          }



          // Create withdrawal transaction
          const withdrawalData = {
            account_id: data.account_id,
            amount: parseFloat(data.amount),
            type: 'expense' as const,
            category: 'Cash Withdrawal',
            description: data.description || 'Cash Withdrawal',
            date: new Date(data.date).toISOString(),
            tags: ['cash_withdrawal', 'transfer'],
            user_id: user?.id || ''
          };



          // Create deposit transaction for cash account
          const depositData = {
            account_id: cashAccount.id,
            amount: parseFloat(data.amount),
            type: 'income' as const,
            category: 'Cash Deposit',
            description: data.description || 'Cash Withdrawal',
            date: new Date(data.date).toISOString(),
            tags: ['cash_deposit', 'transfer'],
            user_id: user?.id || ''
          };



          if (isEditMode && transactionToEdit) {
            // For cash withdrawals, we need to handle both transactions
            // This is complex because we need to find and update both withdrawal and deposit

            // TODO: Implement proper cash withdrawal editing
            // For now, just update the withdrawal transaction
            await updateTransaction(transactionToEdit.id, withdrawalData);
            // Log the transaction update
            await logTransactionEvent('update', withdrawalData, transactionToEdit);
          } else {

            const withdrawalTransactionId = generateTransactionId();
            const withdrawalResult = await addTransaction({
              ...withdrawalData,
              transaction_id: withdrawalTransactionId
            });

            const depositTransactionId = generateTransactionId();
            const depositResult = await addTransaction({
              ...depositData,
              transaction_id: depositTransactionId
            });

            
            // Log both transactions
            if (withdrawalResult) {
              await logTransactionEvent('create', { ...withdrawalData, id: withdrawalResult });
            }
            if (depositResult) {
              await logTransactionEvent('create', { ...depositData, id: depositResult });
            }
            
            // Show success toast
            showToast.success('Transaction added successfully');
            
            // For new transactions, show "Add Another" option instead of closing
            if (!isEditMode) {
              // Immediately reset form for next transaction
              const currentAccountId = data.account_id;
              const currentDate = data.date;
              const currentType = data.type;
              const currentExpenseType = isExpenseType;
              
              // Reset form but keep account, date, and type
              setData({
                account_id: currentAccountId || getDefaultAccountId(),
                amount: '',
                type: currentType || '' as 'income' | 'expense' | '',
                category: '',
                description: '',
                tags: [],
                date: currentDate || new Date().toISOString().split('T')[0],
                is_recurring: false,
                recurring_frequency: 'monthly'
              });
              setIsExpenseType(currentExpenseType || '');
              setDonationType('fixed');
              setDonationValue(undefined);
              setRecurringEndDate(undefined);
              setPurchasePriority('medium');
              setPurchaseNotes('');
              setPurchaseAttachments([]);
              setErrors({});
              setTouched({});
              setFormSubmitted(false);
              setShowCategoryModal(false);
              setShowPurchaseDetails(false);
              
              setShowAddAnother(true);
              
              // Focus amount field
              setTimeout(() => {
                if (amountRef.current) {
                  amountRef.current.focus();
                }
              }, 100);
              
              return; // Don't close the form
            }
          }
        } else {

          // Handle regular transaction
          const transactionData: any = {
            account_id: data.account_id,
            amount: parseFloat(data.amount),
            type: data.type as 'income' | 'expense',
            category: data.category,
            description: data.description,
            date: new Date(data.date).toISOString(),
            tags: data.tags,
            donation_amount,
            is_recurring: data.is_recurring,
            recurring_frequency: data.is_recurring ? data.recurring_frequency : undefined,
            user_id: user?.id || ''
          };
          
          // Add recurring transaction tracking fields if recurring
          if (data.is_recurring) {
            transactionData.next_occurrence_date = calculateNextOccurrenceDate(data.date, data.recurring_frequency);
            transactionData.recurring_end_date = recurringEndDate || undefined;
            transactionData.occurrence_count = isEditMode && transactionToEdit?.occurrence_count ? transactionToEdit.occurrence_count : 0;
            transactionData.is_paused = isEditMode && transactionToEdit?.is_paused ? transactionToEdit.is_paused : false;
          }



          if (isEditMode && transactionToEdit) {
            // For edit mode, also pass purchase details if this is a purchase category
            const purchaseDetails = isPurchaseCategory ? {
              priority: purchasePriority,
              notes: purchaseNotes,
              attachments: purchaseAttachments
            } : undefined;
            
            // Keep the original transaction_id unchanged - no new ID generation
            await updateTransaction(transactionToEdit.id, transactionData, purchaseDetails);
            
            // Log the transaction update
            await logTransactionEvent('update', transactionData, transactionToEdit);
            
            // Create donation records for income transactions
            if (data.type === 'income' && user) {
              const modeValue = donationType === 'percent' ? donationValue : donation_amount;
              await upsertDonationSavingRecords({
                userId: user.id,
                transactionId: transactionToEdit.id, // Use UUID id to match donation record's transaction_id foreign key
                customTransactionId: transactionToEdit.transaction_id, // Use transaction_id string for custom_transaction_id
                donation: donation_amount,
                donationMode: donationType,
                modeValue
              });
            }
            
            // Show success toast
            showToast.success('Transaction updated successfully');
          } else {
            const transactionId = generateTransactionId();
            
            const result = await addTransaction({
              ...transactionData,
              transaction_id: transactionId
            }, 
              // Pass purchase details if this is a purchase category
              isPurchaseCategory ? {
                priority: purchasePriority,
                notes: purchaseNotes,
                attachments: purchaseAttachments
              } : undefined
            );
            // Log the new transaction
            if (result) {
              await logTransactionEvent('create', { ...transactionData, id: result.id });
              // Create donation records for income transactions
              if (data.type === 'income' && user) {
                const modeValue = donationType === 'percent' ? donationValue : donation_amount;
                await upsertDonationSavingRecords({
                  userId: user.id,
                  transactionId: result.id, // Use DB UUID for FK
                  customTransactionId: result.transaction_id, // Pass custom transaction_id for display
                  donation: donation_amount,
                  donationMode: donationType,
                  modeValue
                });
              } else {

              }
            }
            
            // Show success toast

            showToast.success('Transaction added successfully');
            
            // For new transactions, show "Add Another" option instead of closing
            if (!isEditMode) {
              // Immediately reset form for next transaction
              const currentAccountId = data.account_id;
              const currentDate = data.date;
              const currentType = data.type;
              const currentExpenseType = isExpenseType;
              
              // Reset form but keep account, date, and type
              setData({
                account_id: currentAccountId || getDefaultAccountId(),
                amount: '',
                type: currentType || '' as 'income' | 'expense' | '',
                category: '',
                description: '',
                tags: [],
                date: currentDate || new Date().toISOString().split('T')[0],
                is_recurring: false,
                recurring_frequency: 'monthly'
              });
              setIsExpenseType(currentExpenseType || '');
              setDonationType('fixed');
              setDonationValue(undefined);
              setRecurringEndDate(undefined);
              setPurchasePriority('medium');
              setPurchaseNotes('');
              setPurchaseAttachments([]);
              setErrors({});
              setTouched({});
              setFormSubmitted(false);
              setShowCategoryModal(false);
              setShowPurchaseDetails(false);
              
              setShowAddAnother(true);
              
              // Focus amount field
              setTimeout(() => {
                if (amountRef.current) {
                  amountRef.current.focus();
                }
              }, 100);
              
              return; // Don't close the form
            }
          }
        }

        // Removed transaction notifications - only show toast for transactions
        // Only close for edit mode or if "Add Another" is not being used
        if (isEditMode || !showAddAnother) {
        onClose(); // Only close after success
        }
      } catch (error) {

        
        // Check if it's a plan limit error and show upgrade prompt
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
          const errorMessage = error.message;
          
          if (errorMessage && (errorMessage.includes('TRANSACTION_LIMIT_EXCEEDED') || errorMessage.includes('MONTHLY_TRANSACTION_LIMIT_EXCEEDED'))) {
            // Show toast and navigate to plans
            const { transactions } = useFinanceStore.getState();
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyTransactions = transactions.filter(t => {
              const transactionDate = new Date(t.date);
              return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
            }).length;
            const limit = 25; // Updated to 25 for free plan
            
            showToast.error(`Monthly transaction limit exceeded! You have ${monthlyTransactions}/${limit} transactions this month. Upgrade to Premium for unlimited transactions.`);
            setTimeout(() => {
              window.location.href = '/settings?tab=plans-usage';
            }, 2000);
            
            return;
          }
        }
        
        // Removed transaction error notifications - only show toast for errors
        showToast.error(`Failed to ${isEditMode ? 'update' : 'add'} transaction. Please try again.`);
      } finally {
      }
    });
    
    // Execute the wrapped submit function
    await wrappedSubmit();
  };


  const [showDonationTooltip, setShowDonationTooltip] = useState(false);

  // Get selected account and its currency
  const selectedAccount = accounts.find(a => a.id === data.account_id);
  const currency = selectedAccount?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);
  const amountNumber = parseFloat(data.amount) || 0;
  let donationCalculated = 0;
  if (donationType === 'percent' && donationValue !== undefined && !isNaN(donationValue)) {
    donationCalculated = amountNumber * (donationValue / 100);
  } else if (donationType === 'fixed' && donationValue !== undefined && !isNaN(donationValue)) {
    donationCalculated = donationValue;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={isLoading ? undefined : onClose}
      />
      {/* Modal Container */}
      <div
        data-tour="transaction-form"
        className="relative bg-white dark:bg-gray-800 rounded-[1rem] border border-gray-200 dark:border-gray-700 p-6 w-full max-w-[38rem] max-h-[90vh] overflow-y-auto z-50 shadow-xl transition-all"
        onClick={e => e.stopPropagation()}
        style={{ isolation: 'isolate' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Transaction' : duplicateFrom ? 'Duplicate Transaction' : 'Add Transaction'}
          </h2>
          <button 
            onClick={isLoading ? undefined : onClose} 
            className={`p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Close form"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Grid: Main Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1.15rem] gap-y-[1.40rem]">
            <div className="relative">
              <CustomDropdown
                value={data.account_id}
                onChange={(value: string) => {
                  setData({ ...data, account_id: value });
                  if (errors.account_id) setErrors({ ...errors, account_id: '' });
                }}
                options={accounts
                  .filter(account => account.isActive && !account.name.includes('(DPS)'))
                  .map((account) => ({
                    value: account.id,
                    label: `${account.name} (${getCurrencySymbol(account.currency)}${Number(account.calculated_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                  }))}
                placeholder="Select account *"
                fullWidth={true}
              />
              {errors.account_id && (touched.account_id || formSubmitted) && (
                <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.account_id}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={data.amount}
                ref={amountRef}
                onChange={(e) => {
                  setData({ ...data, amount: e.target.value });
                  if (errors.amount) setErrors({ ...errors, amount: '' });
                }}
                onBlur={handleBlur}
                className={`${getInputClasses('amount')} pr-8`}
                required
                aria-describedby={errors.amount ? 'amount-error' : undefined}
                placeholder="0.00 *"
                autoComplete="off"
              />
              {data.amount && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => handleClear('amount')}
                  tabIndex={-1}
                  aria-label="Clear amount"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {errors.amount && (touched.amount || formSubmitted) && (
                <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.amount}
                </span>
              )}
            </div>
            <div className="relative">
              <CustomDropdown
                value={data.type}
                onChange={(value: string) => {
                  const newType = value as 'income' | 'expense';
                  setData({ ...data, type: newType, category: '' });
                  if (newType === 'expense') {
                    setIsExpenseType('regular_expense');
                  } else {
                    setIsExpenseType('');
                  }
                  if (errors.type) setErrors({ ...errors, type: '' });
                }}
                options={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' },
                ]}
                placeholder="Type *"
                fullWidth={true}
              />
              {errors.type && (touched.type || formSubmitted) && (
                <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.type}
                </span>
              )}
            </div>
            {data.type === 'expense' && !isEditMode && (
              <div className="relative">
                <CustomDropdown
                  value={isExpenseType}
                  onChange={(value: string) => {
                    setIsExpenseType(value as 'purchase' | 'cash_withdrawal' | 'regular_expense');
                    if (value === 'cash_withdrawal') {
                      setData(prev => ({ ...prev, category: 'Cash Withdrawal' }));
                    } else {
                      setData(prev => ({ ...prev, category: '' }));
                    }
                  }}
                  options={[
                    { value: 'regular_expense', label: 'Regular Expense' },
                    { value: 'purchase', label: 'Purchase' },
                  ]}
                  placeholder="Expense type *"
                  fullWidth={true}
                />

              </div>
            )}
            <div className="relative">
              <CustomDropdown
                value={data.category}
                onChange={(value: string) => {
                  if (value === '__add_new__') {
                    setShowCategoryModal(true);
                  } else {
                    setData({ ...data, category: value });
                    if (errors.category) setErrors({ ...errors, category: '' });
                  }
                }}
                options={
                  data.type === 'income'
                    ? [
                        { value: '', label: 'Select category' },
                        ...filteredCategoriesData.incomeCategories.map((category) => ({
                          value: category.name,
                          label: category.name,
                        })),
                        { value: '__add_new__', label: '+ Add New Category' },
                      ]
                    : data.type === 'expense' && (isExpenseType === 'purchase' || isExpenseType === 'regular_expense')
                    ? [
                        { value: '', label: 'Select category' },
                        ...filteredCategoriesData.purchaseCategories.map((category) => ({
                          value: category.category_name,
                          label: category.category_name,
                        })),
                        { value: '__add_new__', label: '+ Add New Category' },
                      ]
                    : []
                }
                placeholder="Category *"
                fullWidth={true}
              />
              {errors.category && (touched.category || formSubmitted) && (
                <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.category}
                </span>
              )}
              {filteredCategoriesData.accountCurrency && !filteredCategoriesData.hasMatchingCategories && data.type && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  No categories found for {filteredCategoriesData.accountCurrency}. 
                  <button 
                    type="button" 
                    onClick={() => setShowCategoryModal(true)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Add a category in {filteredCategoriesData.accountCurrency}
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                name="description"
                value={data.description}
                ref={descriptionRef}
                onChange={(e) => {
                  setData({ ...data, description: e.target.value });
                  setIsSuggestionsOpen(true);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (!isSuggestionsOpen || descriptionSuggestions.length === 0) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex((prev) => Math.min(prev + 1, descriptionSuggestions.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter') {
                    if (highlightedIndex >= 0) {
                      e.preventDefault();
                      const value = descriptionSuggestions[highlightedIndex];
                      setData({ ...data, description: value });
                      setIsSuggestionsOpen(false);
                      setHighlightedIndex(-1);
                    }
                  } else if (e.key === 'Escape') {
                    setIsSuggestionsOpen(false);
                    setHighlightedIndex(-1);
                  }
                }}
                onBlur={handleBlur}
                className={`${getInputClasses('description')} pr-8`}
                placeholder="Enter name or title"
                autoComplete="off"
              />
              {isSuggestionsOpen && descriptionSuggestions.length > 0 && data.description.trim().length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm"
                >
                  {descriptionSuggestions.map((s, idx) => (
                    <li
                      key={`${s}-${idx}`}
                      role="option"
                      aria-selected={idx === highlightedIndex}
                      className={`px-3 py-2 cursor-pointer text-sm ${idx === highlightedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setData({ ...data, description: s });
                        setIsSuggestionsOpen(false);
                        setHighlightedIndex(-1);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      {(() => {
                        const q = (data.description || '').trim();
                        const i = s.toLowerCase().indexOf(q.toLowerCase());
                        if (i < 0) return s;
                        const before = s.slice(0, i);
                        const match = s.slice(i, i + q.length);
                        const after = s.slice(i + q.length);
                        return (
                          <span>
                            {before}
                            <span className="font-semibold text-blue-700 dark:text-blue-300">{match}</span>
                            {after}
                          </span>
                        );
                      })()}
                    </li>
                  ))}
                </ul>
              )}
              {data.description && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => handleClear('description')}
                  tabIndex={-1}
                  aria-label="Clear description"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {errors.description && (touched.description || formSubmitted) && (
                <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </span>
              )}
            </div>
            <div className="w-full">
              <div className={getInputClasses('date') + ' flex items-center bg-gray-100 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full'}>
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <DatePicker
                  selected={data.date ? parseISO(data.date) : null}
                  onChange={date => {
                    setData({ ...data, date: date ? format(date, 'yyyy-MM-dd') : '' });
                    if (errors.date) setErrors({ ...errors, date: '' });
                  }}
                  onBlur={() => handleDropdownBlur('date')}
                  placeholderText="Date *"
                  dateFormat="yyyy-MM-dd"
                  className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px]"
                  calendarClassName="z-[60] shadow-lg border border-gray-200 rounded-lg !font-sans"
                  popperPlacement="bottom-start"
                  showPopperArrow={false}
                  wrapperClassName="w-full"
                  todayButton="Today"
                  highlightDates={[new Date()]}
                  isClearable
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="ml-2 text-xs text-blue-600 hover:underline"
                  onClick={() => setData({ ...data, date: new Date().toISOString().split('T')[0] })}
                  tabIndex={-1}
                >
                  Today
                </button>
              </div>
              {errors.date && (touched.date || formSubmitted) && (
                <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.date}
                </span>
              )}
            </div>
          </div>

          {/* Recurring Transaction Section - Moved to be more visible */}
          {/* Only show for premium users and not for purchase transactions */}
          {data.type && isPremiumPlan && isExpenseType !== 'purchase' && (
            <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-2 bg-gray-50 dark:bg-gray-800">
              <div className="relative">
                <div className="flex items-center gap-2 mb-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="recurring"
                        checked={data.is_recurring}
                        onChange={(e) => setData({ ...data, is_recurring: e.target.checked })}
                        className="sr-only"
                      />
                      <span className={`block w-5 h-5 rounded border-2 transition-all ${
                        data.is_recurring
                          ? 'border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500'
                          : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                      }`}>
                        {data.is_recurring && (
                          <svg className="w-3 h-3 text-white absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Recurring Transaction
                    </span>
                  </label>
                </div>
              </div>
              
              {data.is_recurring && (
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Frequency *
                    </label>
                    <CustomDropdown
                      value={data.recurring_frequency}
                      onChange={(value: string) => setData({ ...data, recurring_frequency: value as 'daily' | 'weekly' | 'monthly' | 'yearly' })}
                      options={[
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'yearly', label: 'Yearly' },
                      ]}
                      placeholder="Select frequency"
                      fullWidth={true}
                      className="relative"
                      style={{ position: 'relative', zIndex: 1 }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      End Date (Optional)
                    </label>
                    <div className={getInputClasses('recurring_end_date') + ' flex items-center bg-gray-100 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full'}>
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <DatePicker
                        selected={recurringEndDate ? parseISO(recurringEndDate) : null}
                        onChange={date => setRecurringEndDate(date ? format(date, 'yyyy-MM-dd') : undefined)}
                        placeholderText="No end date (recur forever)"
                        dateFormat="yyyy-MM-dd"
                        className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px]"
                        calendarClassName="z-[100000] shadow-lg border border-gray-200 rounded-lg !font-sans"
                        popperPlacement="bottom-start"
                        showPopperArrow={false}
                        wrapperClassName="w-full"
                        isClearable
                        minDate={parseISO(data.date)}
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited recurring transactions</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Donation Option */}
          {data.type === 'income' && (
            <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-2 bg-gray-50 dark:bg-gray-800">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
                  Donation
                  <span
                    className="cursor-pointer relative group"
                    tabIndex={0}
                    onMouseEnter={() => setShowDonationTooltip(true)}
                    onMouseLeave={() => setShowDonationTooltip(false)}
                    onFocus={() => setShowDonationTooltip(true)}
                    onBlur={() => setShowDonationTooltip(false)}
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                    {showDonationTooltip && (
                      <div className="absolute z-50 left-6 top-1 max-w-xs w-fit p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg text-xs text-gray-700 dark:text-gray-100 whitespace-normal break-words"
                           style={{ minWidth: '180px', right: 'auto' }}>
                        Specify how much of this income you want to automatically donate. You can choose a fixed amount or a percentage.
                      </div>
                    )}
                  </span>
                </label>
                <div className="flex items-center gap-4 mb-2">
                  {/* Custom Radio for Fixed */}
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <span className="relative flex items-center">
                      <input
                        type="radio"
                        checked={donationType === 'fixed'}
                        onChange={() => setDonationType('fixed')}
                        className="sr-only"
                      />
                      <span className={`block w-4 h-4 rounded-full border transition
                        ${donationType === 'fixed'
                          ? 'border-blue-600 bg-white dark:border-white dark:bg-blue-600'
                          : 'border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700'}`}
                      ></span>
                      {donationType === 'fixed' && (
                        <span className="absolute left-1 top-1 w-2 h-2 rounded-full bg-blue-600 dark:bg-white"></span>
                      )}
                    </span>
                    <span className="ml-2 text-gray-700 dark:text-gray-100">Fixed</span>
                  </label>
                  {/* Custom Radio for Percent */}
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <span className="relative flex items-center">
                      <input
                        type="radio"
                        checked={donationType === 'percent'}
                        onChange={() => setDonationType('percent')}
                        className="sr-only"
                      />
                      <span className={`block w-4 h-4 rounded-full border transition
                        ${donationType === 'percent'
                          ? 'border-blue-600 bg-white dark:border-white dark:bg-blue-600'
                          : 'border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700'}`}
                      ></span>
                      {donationType === 'percent' && (
                        <span className="absolute left-1 top-1 w-2 h-2 rounded-full bg-blue-600 dark:bg-white"></span>
                      )}
                    </span>
                    <span className="ml-2 text-gray-700 dark:text-gray-100">Percent</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={donationValue === undefined ? '' : donationValue}
                    onChange={e => setDonationValue(e.target.value === '' ? undefined : Number(e.target.value))}
                    className="border rounded-lg px-3 py-2 w-full bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={donationType === 'fixed' ? 'e.g., 100' : 'e.g., 10'}
                  />
                  <span className="text-gray-500 text-lg">{donationType === 'fixed' ? currencySymbol : '%'}</span>
                </div>
                {donationValue !== undefined && donationValue !== 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {donationType === 'fixed'
                      ? `You will donate: ${currencySymbol}${donationValue}`
                      : `You will donate: ${donationValue}% (${currencySymbol}${donationCalculated.toLocaleString(undefined, { maximumFractionDigits: 2 })}) of this income`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase Details Section */}
          {data.type === 'expense' && isExpenseType === 'purchase' && (
            <PurchaseDetailsSection
              isExpanded={showPurchaseDetails}
              onToggle={() => setShowPurchaseDetails(!showPurchaseDetails)}
              priority={purchasePriority}
              onPriorityChange={setPurchasePriority}
              notes={purchaseNotes}
              onNotesChange={setPurchaseNotes}
              attachments={purchaseAttachments}
              onAttachmentsChange={setPurchaseAttachments}
              showPriority={true}
            />
          )}

            <div className="flex justify-end gap-3">
              {showAddAnother ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={resetFormForAddAnother}
                    className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                    disabled={isLoading}
                  >
                    Add Another
                  </button>
                </>
              ) : (
                <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                disabled={isLoading || !isFormValid}
              >
                {isEditMode ? 'Update' : 'Make Transaction'}
              </button>
                </>
              )}
            </div>
          {/* </div> */}
        </form>
        
        {/* Floating Purchase Note Notification */}
        {isExpenseType === 'purchase' && (
          <div className={`absolute top-4 right-4 z-50 max-w-sm transition-opacity duration-[1500ms] ease-in-out ${showPurchaseNote ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 shadow-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Purchase Option:</strong> Use this when you want to track detailed purchase information like priority, notes, and attachments. This will create both a transaction record and a purchase record for better organization.
              </p>
            </div>
          </div>
        )}
      </div>

      <CategoryModal
        open={showCategoryModal}
        initialValues={{
          ...newCategory,
          currency: filteredCategoriesData.accountCurrency || newCategory.currency || 'USD'
        }}
        isEdit={false}
        isIncomeCategory={data.type === 'income'}
        title={data.type === 'income' ? 'Add New Income Source' : 'Add New Expense Category'}
        onSave={async (values) => {
          if (data.type === 'income') {
            await addCategory({
              name: values.category_name,
              type: 'income',
              color: values.category_color || '#10B981',
              icon: '',
              description: values.description,
              currency: values.currency || 'USD',
            });
            setData({ ...data, category: values.category_name });
          } else {
            await addPurchaseCategory({
              ...values,
              currency: values.currency || 'USD',
              monthly_budget: values.monthly_budget ?? 0,
              category_color: values.category_color || '#3B82F6',
            });
            setData({ ...data, category: values.category_name });
          }
          setShowCategoryModal(false);
          setNewCategory({
            category_name: '',
            description: '',
            monthly_budget: 0,
            currency: 'USD',
            category_color: '#10B981'
          });
        }}
        onClose={() => setShowCategoryModal(false)}
      />
    </div>
  );
};


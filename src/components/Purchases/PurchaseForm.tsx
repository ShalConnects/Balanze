import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
// DatePicker loaded dynamically to reduce initial bundle size
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';
import { parseISO, format } from 'date-fns';
import { Purchase, PurchaseAttachment } from '../../types';
import { PurchaseDetailsSection } from '../Transactions/PurchaseDetailsSection';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { getCurrencySymbol } from '../../utils/currency';
import { Loader } from '../../components/common/Loader';
import { useLoadingContext } from '../../context/LoadingContext';
import { CategoryModal } from '../common/CategoryModal';
import { getDefaultAccountId } from '../../utils/defaultAccount';
import { generateTransactionId } from '../../utils/transactionId';
import { useMobileDetection } from '../../hooks/useMobileDetection';


interface PurchaseFormProps {
  record?: Purchase;
  onClose: () => void;
  isOpen?: boolean;
}

// Helper function to parse date string as local date (not UTC)
// This prevents timezone offset issues when displaying dates
const parseLocalDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
};

export const PurchaseForm: React.FC<PurchaseFormProps> = ({ record, onClose, isOpen = true }) => {
  // Get data from store
  const { 
    addPurchase, 
    updatePurchase, 
    purchaseCategories, 
    accounts, 
    fetchPurchases, 
    fetchAccounts,
    addTransaction,
    addPurchaseCategory,
    purchases
  } = useFinanceStore();
  const { user, profile } = useAuthStore();
  const { wrapAsync, setLoadingMessage, loadingMessage, isLoading } = useLoadingContext();
  const { isMobile } = useMobileDetection();

  // Form state
  const [formData, setFormData] = useState({
    item_name: record?.item_name || '',
    category: record?.category || '',
    price: record?.price ? String(record.price) : '',
    currency: record?.currency || profile?.local_currency || profile?.selected_currencies?.[0] || '',
    purchase_date: record?.purchase_date || new Date().toISOString().split('T')[0],
    status: record?.status || '' as '' | 'planned' | 'purchased' | 'cancelled',
    priority: record?.priority || 'medium' as 'low' | 'medium' | 'high',
    notes: record?.notes || ''
  });

  // Helper to check if string is a UUID
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  
  // Initialize selectedAccountId: if purchase has linked transaction, start with empty to load from transaction
  // Otherwise use record.account_id or default account
  const getInitialAccountId = (): string => {
    if (record?.transaction_id && isUUID(record.transaction_id)) {
      // For linked purchases, account will be loaded from transaction in useEffect
      return '';
    }
    return record?.account_id || getDefaultAccountId();
  };

  const [selectedAccountId, setSelectedAccountId] = useState<string>(getInitialAccountId());
  const [purchasePriority, setPurchasePriority] = useState<'low' | 'medium' | 'high'>(record?.priority || 'medium');
  const [purchaseAttachments, setPurchaseAttachments] = useState<PurchaseAttachment[]>([]);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(true);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(record || null);
  const [excludeFromCalculation, setExcludeFromCalculation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const itemNameRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  
  // Autocomplete state for item name
  const [showItemNameSuggestions, setShowItemNameSuggestions] = useState(false);
  const [itemNameSuggestions, setItemNameSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Reset account ID when record changes
  useEffect(() => {
    if (record) {
      // Reset to initial value based on whether there's a linked transaction
      if (record.transaction_id && isUUID(record.transaction_id)) {
        // For linked purchases, account will be loaded from transaction in useEffect
        setSelectedAccountId('');
      } else {
        setSelectedAccountId(record.account_id || getDefaultAccountId());
      }
    }
  }, [record?.id]);

  // Load linked transaction data when editing a purchase
  useEffect(() => {
    const loadLinkedTransactionData = async () => {
      if (record?.transaction_id) {
        // Helper to check if string is a formatted transaction ID (F1234567 format)
        const isFormattedTransactionId = (str: string) => /^F[0-9]+$/.test(str);
        
        let transactionQuery;
        
        // Check if it's a UUID (new format) or formatted ID (F1234567 format)
        if (isUUID(record.transaction_id)) {
          transactionQuery = supabase
            .from('transactions')
            .select('account_id, category, description, amount')
            .eq('id', record.transaction_id)
            .single();
        } else if (isFormattedTransactionId(record.transaction_id)) {
          transactionQuery = supabase
            .from('transactions')
            .select('account_id, category, description, amount')
            .eq('transaction_id', record.transaction_id)
            .single();
        }
        
        if (transactionQuery) {
          try {
            const { data: linkedTransaction, error } = await transactionQuery;
            
            if (linkedTransaction && !error) {
              // Update form data with transaction data
              setFormData(prev => ({
                ...prev,
                category: linkedTransaction.category || prev.category,
                item_name: linkedTransaction.description || prev.item_name,
                price: linkedTransaction.amount ? String(linkedTransaction.amount) : prev.price
              }));
              
              // Set the account ID from the linked transaction
              if (linkedTransaction.account_id) {
                setSelectedAccountId(linkedTransaction.account_id);
              }
              
              // Set excludeFromCalculation to false since it's linked to a transaction
              setExcludeFromCalculation(false);
            } else {
              // If no linked transaction found, fall back to record.account_id or default
              if (!record?.account_id) {
                setSelectedAccountId(getDefaultAccountId());
              } else {
                setSelectedAccountId(record.account_id);
              }
            }
          } catch (err) {
            // On error, fall back to record.account_id or default
            if (!record?.account_id) {
              setSelectedAccountId(getDefaultAccountId());
            } else {
              setSelectedAccountId(record.account_id);
            }
          }
        } else {
          // If transaction_id format is not recognized, use fallback
          if (!record?.account_id) {
            setSelectedAccountId(getDefaultAccountId());
          } else {
            setSelectedAccountId(record.account_id);
          }
        }
      } else if (record && !record.transaction_id) {
        // For purchases without linked transactions, use record.account_id or default
        if (record.account_id) {
          setSelectedAccountId(record.account_id);
        } else {
          setSelectedAccountId(getDefaultAccountId());
        }
      }
    };

    if (isOpen && record) {
      loadLinkedTransactionData();
    }
  }, [record?.transaction_id, record?.id, record?.account_id, isOpen, accounts]);

  // Autofocus on first field when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => itemNameRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load purchase categories when form opens
  useEffect(() => {
    if (isOpen && user && purchaseCategories.length === 0) {
      useFinanceStore.getState().fetchPurchaseCategories();
    }
  }, [isOpen, user, purchaseCategories.length]);

  // Generate item name suggestions
  const generateItemNameSuggestions = (input: string) => {
    if (!input.trim()) {
      setItemNameSuggestions([]);
      setShowItemNameSuggestions(false);
      return;
    }

    // Combine purchases and transactions for more comprehensive suggestions
    const allSuggestions = [
      ...purchases.map(p => p.item_name),
      ...(useFinanceStore.getState().transactions || []).map(t => t.description)
    ];

    const suggestions = allSuggestions
      .filter((name, index, self) => 
        name.toLowerCase().includes(input.toLowerCase()) && 
        self.indexOf(name) === index
      )
      .slice(0, 5);

    setItemNameSuggestions(suggestions);
    setShowItemNameSuggestions(suggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  };



  // Validation logic
  const validateForm = (dataOverride?: typeof formData, accountIdOverride?: string) => {
    const data = dataOverride || formData;
    const accountId = accountIdOverride !== undefined ? accountIdOverride : selectedAccountId;
    
    const newErrors: { [key: string]: string } = {};
    
    if (!data.item_name || !data.item_name.trim()) {
      newErrors.item_name = 'Item name is required.';
    }
    
    if (!data.category) {
      newErrors.category = 'Category is required.';
    }
    
    if (!data.status) {
      newErrors.status = 'Status is required.';
    }
    
    if (!data.purchase_date) {
      newErrors.purchase_date = 'Purchase date is required.';
    }
    
    // For planned and purchased purchases, validate price
    if (data.status === 'planned' || data.status === 'purchased') {
      if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
        newErrors.price = 'Price is required.';
      }
    }
    
    // For purchased purchases, also validate account
    if (data.status === 'purchased') {
      // Only require account if not excluding from calculation
      if (!excludeFromCalculation && !accountId) {
        newErrors.account = 'Account is required.';
      }
    }
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (e: React.FocusEvent<any>) => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
  };

  const handleFormChange = (name: string, value: string) => {
    setFormData(f => {
      const next = { ...f, [name]: value };
      validateForm(next);
      return next;
    });
    setTouched(t => ({ ...t, [name]: true }));
    
    // Handle autocomplete for item name
    if (name === 'item_name') {
      generateItemNameSuggestions(value);
    }
  };

  const handleAccountChange = (val: string) => {
    setSelectedAccountId(val);
    // Clear the category when account changes to avoid showing incompatible categories
    setFormData(f => ({ ...f, category: '' }));
    setTouched(t => ({ ...t, account: true }));
    validateForm(formData, val);
  };

  // Handle keyboard navigation for suggestions
  const handleItemNameKeyDown = (e: React.KeyboardEvent) => {
    if (!showItemNameSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < itemNameSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : itemNameSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = itemNameSuggestions[selectedSuggestionIndex];
          setFormData(f => ({ ...f, item_name: selectedSuggestion }));
          setShowItemNameSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowItemNameSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setFormData(f => ({ ...f, item_name: suggestion }));
    setShowItemNameSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const isFormValid = () => {
    // Check if all required fields are filled
    const hasRequiredFields = 
      formData.item_name && 
      formData.item_name.trim() &&
      formData.category && 
      formData.status && 
      formData.purchase_date;
    
    // For planned purchases, require price as well
    if (formData.status === 'planned') {
      const isValid = hasRequiredFields && formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0;
      return isValid;
    }
    
    if (formData.status === 'purchased') {
      const hasValidPrice = formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0;
      // If excluding from calculation, account is not required
      if (excludeFromCalculation) {
        return hasRequiredFields && hasValidPrice;
      }
      return hasRequiredFields && hasValidPrice && selectedAccountId;
    }
    
    return hasRequiredFields;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    await handleSubmit();
  };

  const handleSubmit = wrapAsync(async () => {
    console.log('🔍 PurchaseForm handleSubmit called');
    if (isLoading || isSubmittingRef.current) return;
    
    // Set submission flag to prevent double submission
    isSubmittingRef.current = true;
    
    // Set loading message
    setLoadingMessage(editingPurchase ? 'Updating purchase...' : 'Saving purchase...');

    let createdTransactionId: string | null = null;
    
    try {
        if (editingPurchase) {
          // Handle updating existing purchase
          const updateData: Partial<Purchase> = {
            item_name: formData.item_name,
            category: formData.category,
            purchase_date: formData.purchase_date,
            status: (formData.status || 'planned') as 'planned' | 'purchased' | 'cancelled',
            priority: formData.priority,
            notes: formData.notes || '',
            currency: formData.currency,
            exclude_from_calculation: excludeFromCalculation
          };

          updateData.price = parseFloat(formData.price);
          
          // Include account_id if it's changed and purchase is purchased
          if (formData.status === 'purchased' && !excludeFromCalculation && selectedAccountId) {
            updateData.account_id = selectedAccountId;
          }

          await updatePurchase(editingPurchase.id, updateData);

          // Handle attachments for editing
          if (purchaseAttachments.length > 0) {
            for (const att of purchaseAttachments) {
              if (!att.id.startsWith('temp_')) continue;
              
              if (att.file && (att.file_path.startsWith('blob:') || att.id.startsWith('temp_'))) {
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('attachments')
                  .upload(`purchases/${editingPurchase.id}/${att.file_name}`, att.file, { upsert: true });
                
                if (uploadError) {
                  continue;
                }
                
                if (!uploadError && uploadData && uploadData.path) {
                  const { publicUrl } = supabase.storage.from('attachments').getPublicUrl(uploadData.path).data;
                  const attachmentData = {
                    purchase_id: editingPurchase.id,
                    user_id: user?.id || '',
                    file_name: att.file_name,
                    file_path: publicUrl,
                    file_size: att.file_size,
                    file_type: att.file_type,
                    mime_type: att.mime_type,
                    created_at: new Date().toISOString(),
                  };
                  const { error: insertError } = await supabase.from('purchase_attachments').insert(attachmentData);
                  if (insertError) {
                    // Handle error silently
                  }
                }
              }
            }
          }

          // If changing from planned to purchased, create a transaction
          if (editingPurchase.status === 'planned' && formData.status === 'purchased' && !excludeFromCalculation) {
            if (!selectedAccountId) {
              throw new Error('Account is required when changing purchase status to purchased');
            }
            
            const selectedAccount = accounts.find(a => a.id === selectedAccountId);
            if (!selectedAccount) {
              throw new Error('Selected account not found');
            }
            
            // Validate account is active
            if (!selectedAccount.isActive) {
              throw new Error('Selected account is not active');
            }
            
            const transactionData = {
              account_id: selectedAccountId,
              amount: parseFloat(formData.price),
              type: 'expense' as 'expense',
              category: formData.category,
              description: formData.item_name,
              date: formData.purchase_date,
              tags: ['purchase'],
              user_id: user?.id || '',
            };
            
            const transactionId = await addTransaction(transactionData, undefined);

            if (transactionId) {
              await supabase
                .from('purchases')
                .update({ transaction_id: transactionId })
                .eq('id', editingPurchase.id);
            }
          }

          setEditingPurchase(null);
          await fetchPurchases();
          await fetchAccounts();

          if (excludeFromCalculation) {
            toast.success('Purchase updated successfully (excluded from calculation)!');
          } else {
            toast.success('Purchase updated successfully!');
          }
        } else {
          // Handle creating new purchase
          if (formData.status === 'planned') {
            const purchaseData = {
              item_name: formData.item_name,
              category: formData.category,
              price: parseFloat(formData.price),
              purchase_date: formData.purchase_date,
              status: 'planned' as const,
              priority: formData.priority,
              notes: formData.notes || '',
              currency: formData.currency
            };
            
            await addPurchase(purchaseData);
            toast.success('Planned purchase added successfully!');
          } else {
            if (excludeFromCalculation) {
              const purchaseData = {
                item_name: formData.item_name,
                category: formData.category,
                price: parseFloat(formData.price),
                purchase_date: formData.purchase_date,
                status: 'purchased' as const,
                priority: formData.priority,
                notes: formData.notes || '',
                currency: formData.currency,
                user_id: user?.id || '',
                exclude_from_calculation: true
              };
              // Use addPurchase function to ensure proper error handling
              await addPurchase(purchaseData);

              // Attachments will be handled by the addPurchase function

              await fetchPurchases();
              await fetchAccounts();
              toast.success('Purchase added successfully (excluded from calculation)!');
            } else {
              // Create purchase and transaction when From Account is selected
              if (!selectedAccountId) {
                throw new Error('Account is required for purchased purchases');
              }
              
              const selectedAccount = accounts.find(a => a.id === selectedAccountId);
              if (!selectedAccount) {
                throw new Error('Selected account not found');
              }
              
              // Validate account is active
              if (!selectedAccount.isActive) {
                throw new Error('Selected account is not active');
              }
              
              console.log('🔍 PurchaseForm creating transaction first...');
              try {
                // Generate transaction_id for the transaction
                const transactionId = generateTransactionId();
                
                // First create the transaction to get its ID
                const { data: transactionData, error: transactionError } = await supabase
                  .from('transactions')
                  .insert({
                    account_id: selectedAccountId,
                    amount: parseFloat(formData.price),
                    type: 'expense',
                    category: formData.category,
                    description: formData.item_name,
                    date: formData.purchase_date,
                    tags: ['purchase'],
                    user_id: user?.id || '',
                    transaction_id: transactionId,
                  })
                  .select('id')
                  .single();
                
                if (transactionError) {
                  console.log('❌ Transaction creation failed:', transactionError);
                  throw new Error(transactionError.message);
                }
                
                console.log('✅ Transaction created with ID:', transactionData.id);
                createdTransactionId = transactionData.id;
                
                // Then create the purchase with the transaction_id
                console.log('🔍 PurchaseForm creating purchase with transaction_id...');
                await addPurchase({
                  item_name: formData.item_name,
                  category: formData.category,
                  price: parseFloat(formData.price),
                  currency: selectedAccount.currency,
                  purchase_date: formData.purchase_date,
                  status: formData.status || 'planned',
                  priority: formData.priority || 'medium',
                  notes: formData.notes || '',
                  exclude_from_calculation: excludeFromCalculation,
                  transaction_id: transactionData.id
                });
                
                console.log('✅ PurchaseForm purchase created with transaction link');
                toast.success('Purchase added successfully!');
              } catch (error) {
                console.log('❌ PurchaseForm error:', error);
                // Don't cleanup here - let outer catch handle it to avoid double cleanup
                throw error; // Re-throw to be caught by the outer try-catch
              }
            }
          }
        }

        // Reset form only on success
        setFormData({
          item_name: '',
          category: '',
          price: '',
          currency: profile?.local_currency || profile?.selected_currencies?.[0] || '',
          purchase_date: new Date().toISOString().split('T')[0],
          status: '',
          priority: 'medium',
          notes: ''
        });
        setSelectedAccountId('');
        setPurchaseAttachments([]);
        setFieldErrors({});
        setTouched({});
        setEditingPurchase(null);
        setExcludeFromCalculation(false);
        
        // Add a small delay to ensure the loader animation is visible
        await new Promise(resolve => setTimeout(resolve, 1000));
        onClose();
      } catch (error) {
        // Cleanup orphaned transaction if it was created
        if (createdTransactionId) {
          try {
            await supabase.from('transactions').delete().eq('id', createdTransactionId);
            console.log('🧹 Cleaned up orphaned transaction:', createdTransactionId);
          } catch (cleanupError) {
            console.error('❌ Failed to cleanup orphaned transaction:', cleanupError);
          }
        }
        // Check if it's a plan limit error and show upgrade prompt
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
          const errorMessage = error.message;
          
          if (errorMessage && errorMessage.includes('PURCHASE_LIMIT_EXCEEDED')) {
            // Show toast and navigate to plans
            const { purchases } = useFinanceStore.getState();
            const currentCount = purchases.length;
            const limit = 50; // Updated to 50 for free plan
            
            toast.error(`Purchase limit exceeded! You have ${currentCount}/${limit} purchases. Upgrade to Premium for unlimited purchases.`);
            setTimeout(() => {
              window.location.href = '/settings?tab=plans-usage';
            }, 2000);
            
            return;
          }
        }
        
        // Provide more specific error message
        const errorMessage = error && typeof error === 'object' && 'message' in error 
          ? (error.message as string) 
          : 'Failed to save purchase. Please try again.';
        
        if (createdTransactionId && errorMessage.includes('PURCHASE_LIMIT_EXCEEDED')) {
          toast.error('Purchase limit exceeded. Transaction was not created.');
        } else if (createdTransactionId) {
          toast.error('Failed to create purchase. Transaction has been cleaned up.');
        } else {
          toast.error(errorMessage);
        }
      } finally {
        // Reset submission flag
        isSubmittingRef.current = false;
      }
  });

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      <Loader isLoading={isLoading} message={loadingMessage} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => {
          if (!isLoading) {
            onClose();
            setEditingPurchase(null);
          }
        }} />
        <div className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-[38rem] max-h-[90vh] overflow-y-auto z-50 shadow-xl transition-all ${isMobile ? 'pb-32' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{editingPurchase ? 'Edit Purchase' : 'Add Purchase'}</h2>
            <button
              onClick={() => {
                onClose();
                setEditingPurchase(null);
              }}
              className={`p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Close form"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Payment Method Selection - Only for new purchases */}
          {!editingPurchase && (
            <div className="mb-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                 <div className="grid grid-cols-2 gap-3">
                   <div 
                     className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                       !excludeFromCalculation 
                         ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                         : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                     }`}
                     onClick={() => !isLoading && setExcludeFromCalculation(false)}
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
                     className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                       excludeFromCalculation 
                         ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                         : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                     }`}
                     onClick={() => !isLoading && setExcludeFromCalculation(true)}
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
          )}
          <form onSubmit={handleFormSubmit} className="space-y-7">
            {/* Grid: Main Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1.15rem] gap-y-[1.40rem]">
              {/* Item Name */}
              <div className="relative">
                <input
                  id="item_name"
                  name="item_name"
                  type="text"
                  autoComplete="off"
                  ref={itemNameRef}
                  value={formData.item_name}
                  onChange={e => {
                    handleFormChange('item_name', e.target.value);
                  }}
                  onKeyDown={handleItemNameKeyDown}
                  onBlur={() => {
                    handleBlur({ target: { name: 'item_name' } } as React.FocusEvent<any>);
                    // Delay hiding suggestions to allow clicks
                    setTimeout(() => setShowItemNameSuggestions(false), 150);
                  }}
                  onFocus={() => {
                    if (formData.item_name.trim()) {
                      generateItemNameSuggestions(formData.item_name);
                    }
                  }}
                  className={`w-full px-4 pr-[32px] text-[14px] h-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-gray-100 font-medium ${fieldErrors.item_name && touched.item_name ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                  placeholder="Enter item name *"
                  required
                  disabled={isLoading}
                />
                {formData.item_name && (
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => handleFormChange('item_name', '')} tabIndex={-1} aria-label="Clear item name">
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Autocomplete suggestions */}
                {showItemNameSuggestions && itemNameSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {itemNameSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          index === selectedSuggestionIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {(() => {
                          const query = formData.item_name.trim();
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
                
                {fieldErrors.item_name && touched.item_name && (
                  <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.item_name}</span>
                )}
              </div>

              {/* Status */}
              <div className="relative">
                <CustomDropdown
                  options={editingPurchase && editingPurchase.status === 'planned'
                    ? [
                        { label: 'Purchased', value: 'purchased' },
                        { label: 'Planned', value: 'planned' },
                        { label: 'Cancelled', value: 'cancelled' },
                      ]
                    : [
                        { label: 'Purchased', value: 'purchased' },
                        { label: 'Planned', value: 'planned' },
                      ]}
                  value={formData.status}
                  onChange={val => {
                    setFormData(f => {
                      const next = { ...f, status: val as '' | 'planned' | 'purchased' | 'cancelled' };
                      validateForm(next);
                      return next;
                    });
                    setTouched(t => ({ ...t, status: true }));
                  }}
                  onBlur={() => {
                    setTouched(t => ({ ...t, status: true }));
                  }}
                  placeholder="Select status *"
                  disabled={!!(editingPurchase && editingPurchase.status === 'purchased') || isLoading}
                  fullWidth={true}
                  summaryMode={true}
                />
                {fieldErrors.status && touched.status && (
                  <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.status}</span>
                )}
              </div>
                {/* Account field - only show for purchased (not planned, not cancelled) */}
                {(formData.status !== 'planned' && formData.status !== 'cancelled') && !excludeFromCalculation && (
                  <div className="relative">
                    <CustomDropdown
                      options={accounts.filter(acc => acc.isActive && !acc.name.includes('(DPS)')).map(acc => ({
                        label: `${acc.name} (${getCurrencySymbol(acc.currency)}${Number(acc.calculated_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
                        value: acc.id
                      }))}
                      value={selectedAccountId}
                      onChange={val => {
                        handleAccountChange(val);
                      }}
                      onBlur={() => {
                        setTouched(t => ({ ...t, account: true }));
                      }}
                      placeholder="Select Account *"
                      fullWidth={true}
                      disabled={isLoading}
                    />
                    {fieldErrors.account && touched.account && (
                      <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.account}</span>
                    )}
                  </div>
                )}
              
              {/* Currency dropdown - show for planned purchases or when excluding from calculation */}
              {(formData.status === 'planned' || excludeFromCalculation) && (
                <div className="relative">
                  <CustomDropdown
                    options={
                      profile?.selected_currencies && profile.selected_currencies.length > 0
                        ? profile.selected_currencies.map(currency => ({
                            value: currency,
                            label: `${currency} (${getCurrencySymbol(currency)})`
                          }))
                        : profile?.local_currency ? [
                            { 
                              value: profile.local_currency, 
                              label: `${profile.local_currency} (${getCurrencySymbol(profile.local_currency)})` 
                            }
                          ] : []
                    }
                    value={formData.currency}
                    onChange={val => {
                      setFormData(f => ({ ...f, currency: val, category: '' }));
                    }}
                    placeholder="Select Currency *"
                    fullWidth={true}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              {/* Category - show for planned and purchased (not cancelled) */}
              {formData.status !== 'cancelled' && (
                <div className="relative">
                  <CustomDropdown
                    value={formData.category}
                    onChange={(val: string) => {
                      if (val === '__add_new__') {
                        setShowCategoryModal(true);
                      } else {
                        setFormData(f => {
                          const next = { ...f, category: val };
                          validateForm(next);
                          return next;
                        });
                        setTouched(t => ({ ...t, category: true }));
                      }
                    }}
                    onBlur={() => {
                      setTouched(t => ({ ...t, category: true }));
                    }}
                    options={[
                      { value: '', label: 'Select category' },
                      ...purchaseCategories
                        .filter(cat => {
                          // For planned purchases or when excluding from calculation, use formData.currency
                          // Otherwise, filter by account currency
                          const targetCurrency = (formData.status === 'planned' || excludeFromCalculation) 
                            ? formData.currency 
                            : accounts.find(a => a.id === selectedAccountId)?.currency;
                          return cat.currency === targetCurrency;
                        })
                        .map(cat => ({ label: cat.category_name, value: cat.category_name })),
                      { value: '__add_new__', label: '+ Add New Category' },
                    ]}
                    placeholder="Select category *"
                    fullWidth={true}
                    summaryMode={true}
                    disabled={isLoading}
                  />
                  {fieldErrors.category && touched.category && (
                    <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.category}</span>
                  )}
                  {(() => {
                    const targetCurrency = (formData.status === 'planned' || excludeFromCalculation) 
                      ? formData.currency 
                      : accounts.find(a => a.id === selectedAccountId)?.currency;
                    const hasMatchingCategories = purchaseCategories.some(cat => cat.currency === targetCurrency);
                    
                    if (targetCurrency && !hasMatchingCategories) {
                      return (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <span>⚠️</span>
                          No categories found for {targetCurrency}. 
                          <button 
                            type="button" 
                            onClick={() => setShowCategoryModal(true)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Add a category in {targetCurrency}
                          </button>
                        </div>
                      );
                    }
                    
                    
                    return null;
                  })()}
                </div>
              )}
              
              {/* Price field - show for planned and purchased (not cancelled) */}
              {(formData.status === 'planned' || formData.status === 'purchased') && (
                <div className="relative flex-1 min-w-0">
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => {
                      handleFormChange('price', e.target.value);
                    }}
                    onBlur={handleBlur}
                    className={`w-full px-4 pr-[32px] text-[14px] h-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-gray-100 font-medium ${fieldErrors.price && touched.price ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    placeholder="0.00 *"
                    required
                    autoComplete="off"
                    disabled={isLoading}
                  />
                  {formData.price && (
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => handleFormChange('price', '')} tabIndex={-1} aria-label="Clear price">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-gray-500 text-sm absolute right-8 top-2">
                    {formData.status === 'planned' || excludeFromCalculation 
                      ? formData.currency 
                      : (accounts.find(a => a.id === selectedAccountId)?.currency || '')}
                  </span>
                  {fieldErrors.price && touched.price && (
                    <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.price}</span>
                  )}
                </div>
              )}
              {/* Purchase Date (if not cancelled) */}
              {formData.status !== 'cancelled' && (
                <div className="w-full relative">
                  <div className={`flex items-center bg-gray-100 dark:bg-gray-700 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full border border-gray-200 dark:border-gray-600 ${fieldErrors.purchase_date && (touched.purchase_date) ? 'border-red-500 dark:border-red-500' : ''}`}>
                    <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <DatePicker
                      selected={formData.purchase_date ? parseLocalDate(formData.purchase_date) : null}
                      onChange={date => {
                        handleFormChange('purchase_date', date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      onBlur={() => { setTouched(t => ({ ...t, purchase_date: true })); }}
                      placeholderText="Purchase date *"
                      dateFormat="yyyy-MM-dd"
                      className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      calendarClassName="z-[60] shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg !font-sans bg-white dark:bg-gray-800"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      wrapperClassName="w-full"
                      highlightDates={[new Date()]}
                      isClearable
                      autoComplete="off"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="ml-2 text-xs text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => handleFormChange('purchase_date', new Date().toISOString().split('T')[0])}
                      tabIndex={-1}
                    >
                      Today
                    </button>
                  </div>
                  {fieldErrors.purchase_date && touched.purchase_date && (
                    <span className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.purchase_date}</span>
                  )}
                </div>
              )}
            </div>
            {/* Purchase Details Section */}
            <div className="mt-2">
              <PurchaseDetailsSection
                isExpanded={showPurchaseDetails}
                onToggle={() => setShowPurchaseDetails(!showPurchaseDetails)}
                priority={purchasePriority}
                onPriorityChange={setPurchasePriority}
                notes={formData.notes}
                onNotesChange={val => setFormData(f => ({ ...f, notes: val }))}
                attachments={purchaseAttachments}
                onAttachmentsChange={setPurchaseAttachments}
                showPriority={true}
              />
            </div>
            {/* Action Buttons Row */}
            <div className="flex flex-row items-center justify-end gap-3 mt-[20px]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setEditingPurchase(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px] shadow-md hover:shadow-lg"
                disabled={isLoading || !isFormValid()}
              >
                {editingPurchase ? 'Update Purchase' : 'Add Purchase'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CategoryModal
        open={showCategoryModal}
        initialValues={{
          category_name: '',
          description: '',
          monthly_budget: 0,
          currency: (excludeFromCalculation ? formData.currency : accounts.find(a => a.id === selectedAccountId)?.currency) || profile?.local_currency || profile?.selected_currencies?.[0] || '',
          category_color: '#3B82F6'
        }}
        isEdit={false}
        onSave={async (values) => {
          await addPurchaseCategory({
            ...values,
            currency: values.currency || profile?.local_currency || profile?.selected_currencies?.[0] || '',
            monthly_budget: values.monthly_budget ?? 0,
            category_color: values.category_color || '#3B82F6',
          });
          setFormData(f => ({ ...f, category: values.category_name }));
          setShowCategoryModal(false);
        }}
        onClose={() => {
          setShowCategoryModal(false);
        }}
        title="Add New Expense Category"
        isIncomeCategory={false}
      />
    </>
  );
}; 


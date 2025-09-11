import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO } from 'date-fns';
import { Purchase, PurchaseAttachment, PurchaseCategory } from '../../types';
import { PurchaseDetailsSection } from '../Transactions/PurchaseDetailsSection';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { getCurrencySymbol } from '../../utils/currency';
import { Loader } from '../../components/common/Loader';
import { useLoadingContext } from '../../context/LoadingContext';
import { CategoryModal } from '../common/CategoryModal';


interface PurchaseFormProps {
  record?: Purchase;
  onClose: () => void;
  isOpen?: boolean;
}

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
    addPurchaseCategory
  } = useFinanceStore();
  const { user, profile } = useAuthStore();
  const { wrapAsync, setLoadingMessage, loadingMessage } = useLoadingContext();

  // Form state
  const [formData, setFormData] = useState({
    item_name: record?.item_name || '',
    category: record?.category || '',
    price: record?.price ? String(record.price) : '',
    currency: record?.currency || 'USD',
    purchase_date: record?.purchase_date || new Date().toISOString().split('T')[0],
    status: record?.status || '' as '' | 'planned' | 'purchased' | 'cancelled',
    priority: record?.priority || 'medium' as 'low' | 'medium' | 'high',
    notes: record?.notes || ''
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string>(record?.account_id || '');
  const [purchasePriority, setPurchasePriority] = useState<'low' | 'medium' | 'high'>(record?.priority || 'medium');
  const [purchaseAttachments, setPurchaseAttachments] = useState<PurchaseAttachment[]>([]);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(true);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(record || null);
  const [submitting, setSubmitting] = useState(false);
  const [excludeFromCalculation, setExcludeFromCalculation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    category_name: '',
    description: '',
    monthly_budget: 0,
    currency: 'USD',
    category_color: '#3B82F6'
  });
  const itemNameRef = useRef<HTMLInputElement>(null);

  // Autofocus on first field when modal opens
  useEffect(() => {
    // console.log('PurchaseForm: useEffect triggered, isOpen =', isOpen);
    if (isOpen) {
      console.log('PurchaseForm: Form is opening, editingPurchase =', editingPurchase);
      setTimeout(() => itemNameRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load purchase categories when form opens
  useEffect(() => {
    if (isOpen && user && purchaseCategories.length === 0) {
      useFinanceStore.getState().fetchPurchaseCategories();
    }
  }, [isOpen, user, purchaseCategories.length]);



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
  };

  const handleAccountChange = (val: string) => {
    setSelectedAccountId(val);
    // Clear the category when account changes to avoid showing incompatible categories
    setFormData(f => ({ ...f, category: '' }));
    setTouched(t => ({ ...t, account: true }));
    validateForm(formData, val);
  };

  const isFormValid = () => {
    console.log('isFormValid called with:', {
      item_name: formData.item_name,
      category: formData.category,
      status: formData.status,
      purchase_date: formData.purchase_date,
      price: formData.price,
      selectedAccountId: selectedAccountId
    });
    
    // Check if all required fields are filled
    const hasRequiredFields = 
      formData.item_name && 
      formData.item_name.trim() &&
      formData.category && 
      formData.status && 
      formData.purchase_date;
    
    console.log('hasRequiredFields:', hasRequiredFields);
    
    // For planned purchases, require price as well
    if (formData.status === 'planned') {
      const isValid = hasRequiredFields && formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0;
      console.log('Planned purchase validation:', {
        hasRequiredFields,
        hasPrice: formData.price,
        isPriceValid: formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0,
        isValid
      });
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
    if (submitting) return;
    
    console.log('PurchaseForm: handleFormSubmit called, submitting:', submitting);
    console.log('PurchaseForm: editingPurchase =', editingPurchase);
    
    console.log('PurchaseForm: Form validation result:', validateForm());
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    console.log('PurchaseForm: calling handleSubmit');
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    console.log('PurchaseForm: handleSubmit called, submitting:', submitting);
    
    // Set submitting state immediately to show loading
    console.log('PurchaseForm: Setting submitting to true');
    setSubmitting(true);
    setLoadingMessage(editingPurchase ? 'Updating purchase...' : 'Saving purchase...');
    console.log('PurchaseForm: Loading message set to:', editingPurchase ? 'Updating purchase...' : 'Saving purchase...');
    
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

          if (formData.status !== 'planned') {
            updateData.price = parseFloat(formData.price);
          } else {
            updateData.price = 0;
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
                  console.error('Upload error:', uploadError);
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
                    console.error('Attachment insert error:', insertError);
                  }
                }
              }
            }
          }

          // If changing from planned to purchased, create a transaction
          if (editingPurchase.status === 'planned' && formData.status === 'purchased') {
            const selectedAccount = accounts.find(a => a.id === selectedAccountId);
            if (selectedAccount) {
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
              price: 0,
              purchase_date: formData.purchase_date,
              status: 'planned' as const,
              priority: formData.priority,
              notes: formData.notes || '',
              currency: 'USD'
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
                currency: formData.currency || 'USD',
                user_id: user?.id || '',
                exclude_from_calculation: true
              };
              const { data: newPurchase, error: purchaseError } = await supabase
                .from('purchases')
                .insert(purchaseData)
                .select()
                .single();
              
              if (purchaseError) {
                console.error('Purchase insert error:', purchaseError);
                toast.error('Failed to add purchase. Please try again.');
                return;
              }

              // Handle attachments for new purchase
              if (purchaseAttachments.length > 0 && newPurchase) {
                for (const att of purchaseAttachments) {
                  if (att.file && att.file_path.startsWith('blob:')) {
                    const { data: uploadData, error: uploadError } = await supabase.storage
                      .from('attachments')
                      .upload(`purchases/${newPurchase.id}/${att.file_name}`, att.file, { upsert: true });
                    
                    if (uploadError) {
                      console.error('Upload error:', uploadError);
                      continue;
                    }
                    
                    if (!uploadError && uploadData && uploadData.path) {
                      const { publicUrl } = supabase.storage.from('attachments').getPublicUrl(uploadData.path).data;
                      const attachmentData = {
                        purchase_id: newPurchase.id,
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
                        console.error('Attachment insert error:', insertError);
                      }
                    }
                  }
                }
              }

              await fetchPurchases();
              await fetchAccounts();
              toast.success('Purchase added successfully (excluded from calculation)!');
            } else {
              // Normal flow: create transaction and link purchase
              const selectedAccount = accounts.find(a => a.id === selectedAccountId);
              if (!selectedAccount) throw new Error('Selected account not found');
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
              // Add transaction and get transactionId - this will automatically create a purchase record
              const transactionId = await addTransaction(transactionData, {
                priority: (formData.status || 'planned') === 'purchased' ? formData.priority : 'medium',
                notes: formData.notes || '',
                attachments: purchaseAttachments, // Pass attachments to be handled by addTransaction
              });
              if (transactionId) {
                toast.success('Purchase added successfully!');
              }
            }
          }
        }

        // Reset form
        setFormData({
          item_name: '',
          category: '',
          price: '',
          currency: 'USD',
          purchase_date: new Date().toISOString().split('T')[0],
          status: '',
          priority: 'medium',
          notes: ''
        });
        setSelectedAccountId('');
        setPurchaseAttachments([]);
        setFieldErrors({});
        setTouched({});
        setFormSubmitted(false);
        setEditingPurchase(null);
        setExcludeFromCalculation(false);
        
        // Add a small delay to ensure the loader animation is visible
        await new Promise(resolve => setTimeout(resolve, 1000));
        onClose();
      } catch (error) {
        console.error('Error submitting purchase:', error);
        toast.error('Failed to save purchase. Please try again.');
      } finally {
        setSubmitting(false);
      }
  };

  // Don't render if not open
  // console.log('PurchaseForm: Rendering, isOpen =', isOpen, 'submitting =', submitting);
  if (!isOpen) return null;

  return (
    <>
      <Loader isLoading={submitting} message={loadingMessage} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => {
          if (!submitting) {
            onClose();
            setEditingPurchase(null);
          }
        }} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-[38rem] max-h-[90vh] overflow-y-auto z-50 shadow-xl transition-all" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{editingPurchase ? 'Edit Purchase' : 'Add Purchase'}</h2>
            <button
              onClick={() => {
                onClose();
                setEditingPurchase(null);
              }}
              className={`p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Close form"
              disabled={submitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Exclude from Calculation Option - Only for new purchases */}
          {!editingPurchase && (
            <div 
              className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 mb-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              onClick={() => !submitting && setExcludeFromCalculation(!excludeFromCalculation)}
            >
              <input
                type="checkbox"
                id="excludeFromCalculation"
                checked={excludeFromCalculation}
                onChange={(e) => setExcludeFromCalculation(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={submitting}
              />
              <label htmlFor="excludeFromCalculation" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                <span className="font-medium">Exclude from account balance calculation</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check this if the purchase was already made using this account. This will not create a transaction record or affect your account balance.
                </span>
              </label>
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
                  onBlur={handleBlur}
                  className={`w-full px-4 pr-[32px] text-[14px] h-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-gray-100 font-medium ${fieldErrors.item_name && touched.item_name ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                  placeholder="Enter item name *"
                  required
                  disabled={submitting}
                />
                {formData.item_name && (
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => handleFormChange('item_name', '')} tabIndex={-1} aria-label="Clear item name">
                    <X className="w-4 h-4" />
                  </button>
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
                  disabled={!!(editingPurchase && editingPurchase.status === 'purchased') || submitting}
                  fullWidth={true}
                  summaryMode={true}
                />
                {fieldErrors.status && touched.status && (
                  <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.status}</span>
                )}
              </div>
              {/* Account & Price (only if not planned/cancelled) */}
              {(formData.status !== 'planned' && formData.status !== 'cancelled') && (
                <>
                  {/* Account field - only show if not excluding from calculation */}
                  {!excludeFromCalculation && (
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
                      disabled={submitting}
                    />
                    {fieldErrors.account && touched.account && (
                      <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.account}</span>
                    )}
                  </div>
                  )}
                  
                  {/* Currency dropdown - only show when excluding from calculation */}
                  {excludeFromCalculation && (
                    <div className="relative">
                      <CustomDropdown
                        options={
                          profile?.selected_currencies && profile.selected_currencies.length > 0
                            ? profile.selected_currencies.map(currency => ({
                                value: currency,
                                label: `${currency} (${getCurrencySymbol(currency)})`
                              }))
                            : [
                                { 
                                  value: profile?.local_currency || 'USD', 
                                  label: `${profile?.local_currency || 'USD'} (${getCurrencySymbol(profile?.local_currency || 'USD')})` 
                                }
                              ]
                        }
                        value={formData.currency}
                        onChange={val => {
                          setFormData(f => ({ ...f, currency: val, category: '' }));
                        }}
                        placeholder="Select Currency *"
                        fullWidth={true}
                        disabled={submitting}
                      />
                    </div>
                  )}
                  
                  {/* Category */}
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
                            // When excluding from calculation, filter by manually selected currency
                            // Otherwise, filter by account currency
                            const targetCurrency = excludeFromCalculation ? formData.currency : accounts.find(a => a.id === selectedAccountId)?.currency;
                            return cat.currency === targetCurrency;
                          })
                          .map(cat => ({ label: cat.category_name, value: cat.category_name })),
                        { value: '__add_new__', label: '+ Add New Category' },
                      ]}
                      placeholder="Select category *"
                      fullWidth={true}
                      summaryMode={true}
                      disabled={submitting}
                    />
                    {fieldErrors.category && touched.category && (
                      <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.category}</span>
                    )}
                    {(() => {
                      const targetCurrency = excludeFromCalculation ? formData.currency : accounts.find(a => a.id === selectedAccountId)?.currency;
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
                      
                      if (excludeFromCalculation && targetCurrency) {
                        return (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                            <span>ℹ️</span>
                            Categories filtered by selected currency: {targetCurrency}
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                  
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
                      disabled={submitting}
                    />
                    {formData.price && (
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => handleFormChange('price', '')} tabIndex={-1} aria-label="Clear price">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-gray-500 text-sm absolute right-8 top-2">
                      {excludeFromCalculation ? formData.currency : (accounts.find(a => a.id === selectedAccountId)?.currency || '')}
                    </span>
                    {fieldErrors.price && touched.price && (
                      <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.price}</span>
                    )}
                  </div>
                </>
              )}
              {/* Purchase Date (if not cancelled) */}
              {formData.status !== 'cancelled' && (
                <div className="w-full relative">
                  <div className={`flex items-center bg-gray-100 dark:bg-gray-700 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full border border-gray-200 dark:border-gray-600 ${fieldErrors.purchase_date && (touched.purchase_date) ? 'border-red-500 dark:border-red-500' : ''}`}>
                    <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <DatePicker
                      selected={formData.purchase_date ? parseISO(formData.purchase_date) : null}
                      onChange={date => {
                        handleFormChange('purchase_date', date ? date.toISOString().split('T')[0] : '');
                      }}
                      onBlur={() => { setTouched(t => ({ ...t, purchase_date: true })); }}
                      placeholderText="Purchase date *"
                      dateFormat="yyyy-MM-dd"
                      className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      calendarClassName="z-50 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg !font-sans bg-white dark:bg-gray-800"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      wrapperClassName="w-full"
                      todayButton="Today"
                      highlightDates={[new Date()]}
                      isClearable
                      autoComplete="off"
                      disabled={submitting}
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
                    <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{fieldErrors.purchase_date}</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-[20px]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setEditingPurchase(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px] shadow-md hover:shadow-lg"
                disabled={(() => {
                  const disabled = submitting || !isFormValid();
                  console.log('Button disabled state:', { submitting, isFormValid: isFormValid(), disabled });
                  return disabled;
                })()}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {submitting ? (editingPurchase ? 'Updating...' : 'Adding...') : (editingPurchase ? 'Update Purchase' : 'Add Purchase')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CategoryModal
        open={showCategoryModal}
        initialValues={{
          ...newCategory,
          currency: (excludeFromCalculation ? formData.currency : accounts.find(a => a.id === selectedAccountId)?.currency) || newCategory.currency || 'USD'
        }}
        isEdit={false}
        onSave={async (values) => {
          await addPurchaseCategory({
            ...values,
            currency: values.currency || 'USD',
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
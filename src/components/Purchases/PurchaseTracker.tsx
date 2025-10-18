import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Calendar,
  Tag,
  Edit,
  Trash2,
  Eye,
  Image,
  FileText,
  File,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  Edit2,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Purchase, PurchaseCategory } from '../../types';
import { format, parseISO } from 'date-fns';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';
import { ShowOnDashboardBanner } from '../common/ShowOnDashboardBanner';
import { PurchaseDetailsSection } from '../Transactions/PurchaseDetailsSection';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { PurchaseAttachment } from '../../types';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CustomDropdown } from './CustomDropdown';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLoadingContext } from '../../context/LoadingContext';
import { Loader } from '../common/Loader';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';
import { getDefaultAccountId } from '../../utils/defaultAccount';

import { useNotificationsStore } from '../../stores/notificationsStore';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { CategoryModal } from '../common/CategoryModal';
import { PurchaseCardSkeleton, PurchaseTableSkeleton, PurchaseSummaryCardsSkeleton, PurchaseFiltersSkeleton } from './PurchaseSkeleton';

const currencySymbols: Record<string, string> = {
  USD: '$',
  BDT: '৳',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  ALL: 'L', // Albanian Lek
  INR: '₹',
  CAD: '$',
  AUD: '$',
  // Add more as needed
};
const getCurrencySymbol = (currency: string) => currencySymbols[currency] || currency;

// Add this helper function if not present
function formatFileSize(bytes: number) {
  if (!bytes) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// Helper function to determine tooltip text based on notes and attachments
const getTooltipText = (hasNotes: boolean, hasAttachments: boolean): string => {
  if (hasNotes && hasAttachments) {
    return 'Has both notes and attachments';
  } else if (hasNotes) {
    return 'Has note';
  } else if (hasAttachments) {
    return 'Has attachment';
  }
  return '';
};

// Helper function to determine if eye icon should be shown
const shouldShowEyeIcon = (hasNotes: boolean, hasAttachments: boolean): boolean => {
  return hasNotes || hasAttachments;
};

export const PurchaseTracker: React.FC = () => {
  const {
    purchases,
    purchaseCategories,
    loading,
    error,
    fetchPurchases,
    fetchPurchaseCategories,
    addPurchase,
    updatePurchase,
    deletePurchase,
    bulkUpdatePurchases,
    getMultiCurrencyPurchaseAnalytics,
    accounts,
    fetchAccounts,
    addTransaction,
    deleteTransaction,
    transactions,
  } = useFinanceStore();
  const { user, profile } = useAuthStore();
  const { t } = useTranslation();
  const { fetchNotifications } = useNotificationsStore();
  const { wrapAsync, setLoadingMessage, loadingMessage } = useLoadingContext();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { showPurchaseForm, setShowPurchaseForm } = useFinanceStore();
  const navigate = useNavigate();

  // Widget visibility state - hybrid approach (localStorage + database)
  const [showPurchasesWidget, setShowPurchasesWidget] = useState(() => {
    const saved = localStorage.getItem('showPurchasesWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Memoize fetch functions to prevent infinite loops
  const fetchPurchasesCallback = useCallback(() => {
    useFinanceStore.getState().fetchPurchases();
  }, []);

  const fetchPurchaseCategoriesCallback = useCallback(() => {
    useFinanceStore.getState().fetchPurchaseCategories();
  }, []);

  const fetchAccountsCallback = useCallback(() => {
    useFinanceStore.getState().fetchAccounts();
  }, []);

  // Record selection functionality
  const {
    selectedRecord,
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: purchases,
    recordIdField: 'id',
    scrollToRecord: true
  });



  // Debug logging for purchases data - removed for production


  // Fetch data when component mounts
  useEffect(() => {
    if (user) {
      fetchPurchasesCallback();
      fetchPurchaseCategoriesCallback();
      fetchAccountsCallback();
    }
  }, [user, fetchPurchasesCallback, fetchPurchaseCategoriesCallback, fetchAccountsCallback]);

  // Load user preferences for Purchases widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showPurchasesWidget', true);
          setShowPurchasesWidget(showWidget);
          localStorage.setItem('showPurchasesWidget', JSON.stringify(showWidget));
        } catch (error) {

          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Show Purchases widget on dashboard
  const handleShowPurchasesWidget = async () => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showPurchasesWidget', JSON.stringify(true));
    setShowPurchasesWidget(true);
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await setPreference(user.id, 'showPurchasesWidget', true);
        toast.success('Purchases widget will be shown on dashboard!', {
          description: 'You can hide it again from the dashboard'
        });
      } catch (error) {

        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
  };

  // Fetch attachment counts for all purchases
  useEffect(() => {
    const fetchAttachmentCounts = async () => {
      if (purchases.length === 0) return;
      
      try {
        const purchaseIds = purchases.map(p => p.id);
        const { data: attachmentCounts, error } = await supabase
          .from('purchase_attachments')
          .select('purchase_id')
          .in('purchase_id', purchaseIds);
        
        if (!error && attachmentCounts) {
          const counts: Record<string, number> = {};
          attachmentCounts.forEach(att => {
            counts[att.purchase_id] = (counts[att.purchase_id] || 0) + 1;
          });
          setPurchaseAttachmentCounts(counts);
        }
      } catch (err) {

      }
    };

    fetchAttachmentCounts();
  }, [purchases]);

  // Check if categories exist and redirect to settings if needed
  const checkCategoriesAndRedirect = () => {
    const hasExpenseCategories = purchaseCategories.length > 0;
    
    if (!hasExpenseCategories) {
      toast.error('Please add expense categories first before creating purchases', {
        description: 'You need expense categories to create purchases.',
        action: {
          label: 'Go to Settings',
          onClick: () => navigate('/settings?tab=categories')
        }
      });
      return false;
    }
    return true;
  };

  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  // Initialize date range for "This Month" by default
  const getThisMonthDateRange = () => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: first.toISOString().slice(0, 10),
      end: last.toISOString().slice(0, 10)
    };
  };

  // Function to get readable date range label
  const getDateRangeLabel = () => {
    if (!filters.dateRange.start || !filters.dateRange.end) {
      return 'All Time';
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Check if it's today
    if (filters.dateRange.start === todayStr && filters.dateRange.end === todayStr) {
      return 'Today';
    }

    // Check if it's this week
    const day = today.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === mondayStr && filters.dateRange.end === sundayStr) {
      return 'This Week';
    }

    // Check if it's this month
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstOfMonthStr = firstOfMonth.toISOString().slice(0, 10);
    const lastOfMonthStr = lastOfMonth.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfMonthStr && filters.dateRange.end === lastOfMonthStr) {
      return 'This Month';
    }

    // Check if it's last month
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const firstOfLastMonthStr = firstOfLastMonth.toISOString().slice(0, 10);
    const lastOfLastMonthStr = lastOfLastMonth.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfLastMonthStr && filters.dateRange.end === lastOfLastMonthStr) {
      return 'Last Month';
    }

    // Check if it's this year
    const firstOfYear = new Date(today.getFullYear(), 0, 1);
    const lastOfYear = new Date(today.getFullYear(), 11, 31);
    
    const firstOfYearStr = firstOfYear.toISOString().slice(0, 10);
    const lastOfYearStr = lastOfYear.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfYearStr && filters.dateRange.end === lastOfYearStr) {
      return 'This Year';
    }

    // If none match, show custom range
    return 'Custom Range';
  };

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    priority: 'all' as 'all' | 'low' | 'medium' | 'high',
    currency: '' as string,
    dateRange: getThisMonthDateRange()
  });

  // Mobile filter states
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    search: '',
    category: 'all',
    priority: 'all' as 'all' | 'low' | 'medium' | 'high',
    currency: '' as string,
    dateRange: { start: '', end: '' }
  });

  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    price: '',
    currency: profile?.local_currency || profile?.selected_currencies?.[0] || '',
    purchase_date: new Date().toISOString().split('T')[0],
    status: '' as '' | 'planned' | 'purchased' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesToView, setNotesToView] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Autocomplete state for item name
  const [showItemNameSuggestions, setShowItemNameSuggestions] = useState(false);
  const [itemNameSuggestions, setItemNameSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(getDefaultAccountId());
  const [purchasePriority, setPurchasePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [purchaseAttachments, setPurchaseAttachments] = useState<PurchaseAttachment[]>([]);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(true);

  // Add state for the selected purchase for the modal
  const [selectedPurchaseForModal, setSelectedPurchaseForModal] = useState<Purchase | null>(null);

  // Add state for modal attachments
  const [modalAttachments, setModalAttachments] = useState<PurchaseAttachment[]>([]);

  // Add state for inline file viewer
  const [viewingFile, setViewingFile] = useState<PurchaseAttachment | null>(null);
  const [imageZoom, setImageZoom] = useState(100);

  // Add state to track attachment counts for each purchase
  const [purchaseAttachmentCounts, setPurchaseAttachmentCounts] = useState<Record<string, number>>({});

  // Add submitting state to prevent double submissions
  const [submitting, setSubmitting] = useState(false);

  // Exclude from calculation state (only for add form, purchased status)
  const [excludeFromCalculation, setExcludeFromCalculation] = useState(false);

  // Selected purchase parameter handling
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPurchaseId = searchParams.get('selected');
  const selectedPurchaseRef = useRef<HTMLDivElement>(null);

  // Scroll to selected purchase when component mounts
  useEffect(() => {
    if (selectedPurchaseId && selectedPurchaseRef.current) {
      setTimeout(() => {
        selectedPurchaseRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Remove the selected parameter after scrolling
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('selected');
          return newParams;
        });
      }, 500);
    }
  }, [selectedPurchaseId, setSearchParams]);

  // Get multi-currency analytics
  const multiCurrencyAnalytics = getMultiCurrencyPurchaseAnalytics();
  
  // Get all unique currencies from accounts
  const accountCurrencies = Array.from(new Set(accounts.map(a => a.currency)));
  // Only show selected_currencies if available, else all from accounts
  const currencyOptions = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return accountCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);
  const availableCurrencies = currencyOptions.length > 0 ? currencyOptions : multiCurrencyAnalytics.byCurrency.map(analytics => analytics.currency);



  // Set default currency to user's default (first account's currency)
  useEffect(() => {
    if (availableCurrencies.length > 0 && (!selectedCurrency || !availableCurrencies.includes(selectedCurrency))) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrency]);

  // Mobile filter functionality
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(filters);
    }
  }, [showMobileFilterMenu, filters]);

  const handleCloseModal = () => {
    setTempFilters({
      search: '',
      category: 'all',
      priority: 'all',
      currency: '',
      dateRange: { start: '', end: '' }
    });
    setShowMobileFilterMenu(false);
  };

  // Handle Escape key to close mobile filter modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMobileFilterMenu) {
        handleCloseModal();
      }
    };

    if (showMobileFilterMenu) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMobileFilterMenu]);
  
  // Get analytics for selected currency or all currencies combined
  const getAnalyticsForCurrency = (currency: string) => {
    const analytics = multiCurrencyAnalytics.byCurrency.find(a => a.currency === currency);
    return analytics || {
      total_spent: 0,
      monthly_spent: 0,
      planned_count: 0,
      purchased_count: 0,
      currency: currency
    };
  };

  const currentAnalytics = getAnalyticsForCurrency(selectedCurrency);

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    // If a record is selected via deep link, prioritize showing only that record
    if (hasSelection && isFromSearch && selectedRecord) {
      return [selectedRecord];
    }

    return purchases.filter(purchase => {
      const matchesSearch = purchase.item_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           purchase.notes?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.category === 'all' || purchase.category === filters.category;
      const matchesPriority = filters.priority === 'all' || purchase.priority === filters.priority;
      const matchesCurrency = filters.currency === '' || purchase.currency === filters.currency;
      
      let matchesDate = true;
      if (filters.dateRange.start && filters.dateRange.end) {
        const purchaseDate = new Date(purchase.purchase_date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        matchesDate = purchaseDate >= startDate && purchaseDate <= endDate;
      }

      return matchesSearch && matchesCategory && matchesPriority && matchesCurrency && matchesDate;
    });
  }, [purchases, filters, hasSelection, isFromSearch, selectedRecord]);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'BDT') {
      return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (!currency) return amount.toString();
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      return amount.toString();
    }
  };

  // Add state for field errors and touched fields
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const itemNameRef = useRef<HTMLInputElement>(null);

  // Autofocus on first field when modal opens
  useEffect(() => {
    if (showPurchaseForm) {
      setTimeout(() => itemNameRef.current?.focus(), 100);
    }
  }, [showPurchaseForm]);

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
    
    // For non-planned purchases, also validate price and account
    if (data.status !== 'planned' && data.status !== 'cancelled') {
      if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
        newErrors.price = 'Price is required.';
      }
      
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
    // handleFormChange - removed for production
    setFormData(f => {
      const next = { ...f, [name]: value };
      // Validate with the next value immediately
      validateForm(next);
      return next;
    });
    setTouched(t => ({ ...t, [name]: true }));
    
    // Handle autocomplete for item name
    if (name === 'item_name') {
      generateItemNameSuggestions(value);
    }
  };

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

  const handleAccountChange = (val: string) => {
    setSelectedAccountId(val);
    // Clear the category when account changes to avoid showing incompatible categories
    setFormData(f => ({ ...f, category: '' }));
    setTouched(t => ({ ...t, account: true })); // Mark as touched on change
    // Validate with the new account ID immediately
    validateForm(formData, val);
  };

  // Check if form is valid (all required fields filled)
  const isFormValid = () => {
    const hasRequiredFields = formData.item_name && formData.category && formData.status && formData.purchase_date;
    
    // For non-planned purchases, also require price and account
    if (formData.status !== 'planned' && formData.status !== 'cancelled') {
      // If excluding from calculation, account is not required
      if (excludeFromCalculation) {
        return hasRequiredFields && formData.price;
      }
      return hasRequiredFields && formData.price && selectedAccountId;
    }
    
    return hasRequiredFields;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true); // Mark form as submitted
    // Mark all fields as touched
    const newTouched = { item_name: true, category: true, status: true, price: true, account: true, purchase_date: true };
    setTouched(newTouched);
    
    // Validate form
    if (!validateForm()) {
      return; // Stop if validation fails
    }
    
    // Call original handleSubmit
    await handleSubmit(e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 handleSubmit called');
    // handleSubmit called - removed for production
    if (submitting) return; // Prevent double submission
    
    // Form validation data - removed for production
    
    console.log('🔍 Form data:', formData);
    // Basic validation for all purchases
    if (!formData.item_name || !formData.category || !formData.purchase_date) {
      console.log('❌ Validation failed - missing required fields');
      // Basic validation failed - removed for production
      alert('Please fill all required fields.');
      return;
    }
    console.log('✅ Basic validation passed');
    
    // Additional validation for non-planned purchases
    if (formData.status !== 'planned' && formData.status !== 'cancelled') {
      if (!formData.price) {
        // Price validation failed - removed for production
        alert('Please fill all required fields (Price is required for non-planned purchases).');
        return;
      }
      console.log('✅ Price validation passed');
      
      // Only require account if not excluding from calculation
      if (!excludeFromCalculation && !selectedAccountId) {
        // Account validation failed - removed for production
        alert('Please fill all required fields (Account is required for non-planned purchases).');
        return;
      }
    }
    
    // All validation passed - removed for production
    
    console.log('✅ All validation passed - proceeding with purchase creation');
    setSubmitting(true);
    setLoadingMessage(editingPurchase ? 'Updating purchase...' : 'Saving purchase...');
    
    try {
      console.log('🔍 Inside try block - editingPurchase:', editingPurchase);
      if (editingPurchase) {
        console.log('🔍 Updating existing purchase');
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

        // If changing from planned to purchased/cancelled, add price
        if (formData.status !== 'planned') {
          updateData.price = parseFloat(formData.price);
        } else {
          updateData.price = 0; // Reset price for planned purchases
        }

        // Update the purchase
        await updatePurchase(editingPurchase.id, updateData);

        // Handle attachments for editing
        if (purchaseAttachments.length > 0) {
          for (const att of purchaseAttachments) {
            // Skip if attachment already exists (has a real ID, not temp_)
            if (!att.id.startsWith('temp_')) continue;
            
            // Checking attachment for upload - removed for production
            
            // Checking attachment for upload (exclude flow) - removed for production
            
            if (att.file && (att.file_path.startsWith('blob:') || att.id.startsWith('temp_'))) {
              // Uploading attachment - removed for production
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

                } else {
                  // Attachment uploaded successfully - removed for production
                }
              }
            }
          }
        }

        // If changing from planned to purchased, create a transaction and link it to the existing purchase
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
            
            // Don't create transactions automatically
            // Users can manually create transactions if they want to affect account balance
            // This prevents conflicts with transaction limits
          }
        }

        setEditingPurchase(null);
        
        // Refresh purchases to show updated status immediately
        await fetchPurchases();
        await fetchAccounts();

        // Show success toast only
        if (excludeFromCalculation) {
          toast.success('Purchase updated successfully (excluded from calculation)!');
        } else {
          toast.success('Purchase updated successfully!');
        }
      } else {
        console.log('🔍 Creating new purchase');
        // Handle creating new purchase
        console.log('🔍 Form status:', formData.status);
        if (formData.status === 'planned') {
          console.log('🔍 Creating planned purchase');
          // For planned purchases, use the store's addPurchase function
          const purchaseData = {
            item_name: formData.item_name,
            category: formData.category,
            price: 0, // No price for planned purchases
            purchase_date: formData.purchase_date,
            status: 'planned' as const,
            priority: formData.priority,
            notes: formData.notes || '',
            currency: formData.currency // Use form's selected currency
          };
          
          try {
            console.log('🔍 Attempting to add purchase...');
          await addPurchase(purchaseData);
            console.log('✅ Purchase added successfully!');
          toast.success('Planned purchase added successfully!');
          } catch (error) {
            console.log('❌ Error adding purchase:', error);
            // Check if it's a plan limit error and show upgrade prompt
            if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
              const errorMessage = error.message;
              console.log('🔍 Error message:', errorMessage);
              
              if (errorMessage && errorMessage.includes('PURCHASE_LIMIT_EXCEEDED')) {
                console.log('🚫 Purchase limit exceeded!');
                // Show toast and navigate to plans
                const currentCount = purchases.length;
                const limit = 50; // Updated to 50 for free plan
                
                toast.error(`Purchase limit exceeded! You have ${currentCount}/${limit} purchases. Upgrade to Premium for unlimited purchases.`);
                setTimeout(() => {
                  window.location.href = '/settings?tab=plans-usage';
                }, 2000);
                
                return;
              }
            }
            
            console.log('❌ Generic error - showing generic error message');
            toast.error('Failed to add purchase. Please try again.');
            return;
          }
        } else {
          console.log('🔍 Creating purchased/cancelled purchase');
          // For purchased/cancelled items, handle excludeFromCalculation
          console.log('🔍 excludeFromCalculation:', excludeFromCalculation);
          if (excludeFromCalculation) {
            console.log('🔍 Creating purchase with excludeFromCalculation');
            // Add purchase only, no transaction
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
            const { data: newPurchase, error: purchaseError } = await supabase
              .from('purchases')
              .insert(purchaseData)
              .select()
              .single();
            
            if (purchaseError) {
              throw new Error(purchaseError.message);
            }
            
            // Upload attachments if any
            if (newPurchase && purchaseAttachments.length > 0) {
              for (const att of purchaseAttachments) {
                if (att.file && (att.file_path.startsWith('blob:') || att.id.startsWith('temp_'))) {
                  // Uploading attachment - removed for production
                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('attachments')
                    .upload(`purchases/${newPurchase.id}/${att.file_name}`, att.file, { upsert: true });
                  
                  if (uploadError) {

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

                    } else {
                      // Attachment uploaded successfully - removed for production
                    }
                  }
                }
              }
            }
            
            await fetchPurchases();
            // Success toast moved inside try-catch block
          } else {
            console.log('🔍 Creating purchase with normal flow (no excludeFromCalculation)');
            // Normal flow: create transaction and link purchase
            console.log('🔍 Finding selected account:', selectedAccountId);
            const selectedAccount = accounts.find(a => a.id === selectedAccountId);
            console.log('🔍 Selected account found:', selectedAccount);
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
            // Don't create transactions automatically
            // Users can manually create transactions if they want to affect account balance
            // This prevents conflicts with transaction limits
            console.log('🔍 Skipping transaction creation - calling addPurchase directly');
            
            // Create purchase directly without creating transaction
            const purchaseData = {
              item_name: formData.item_name,
              category: formData.category,
              price: parseFloat(formData.price),
              purchase_date: formData.purchase_date,
              status: formData.status || 'purchased',
              priority: formData.priority || 'medium',
              notes: formData.notes || '',
              currency: formData.currency
            };
            
            console.log('🔍 Calling addPurchase with data:', purchaseData);
            await addPurchase(purchaseData);
            console.log('✅ Purchase created successfully!');
            toast.success('Purchase added successfully!');
          }
        }
      }
      
      // Reset form data and close modal only after all operations are complete
    setFormData({
      item_name: '',
      category: '',
        price: '',
        currency: '',
      purchase_date: new Date().toISOString().split('T')[0],
        status: '' as '' | 'planned' | 'purchased' | 'cancelled',
      priority: 'medium',
      notes: ''
    });
          setSelectedAccountId('');
    setPurchaseAttachments([]);
    
    // Add a small delay to ensure the loader animation is visible
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowPurchaseForm(false);
  setExcludeFromCalculation(false);
    } catch (error) {
      // Check if it's a plan limit error and show upgrade prompt
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        const errorMessage = error.message;
        
        if (errorMessage && errorMessage.includes('PURCHASE_LIMIT_EXCEEDED')) {
          // Show toast and navigate to plans
          const currentCount = purchases.length;
          const limit = 50; // Updated to 50 for free plan
          
          toast.error(`Purchase limit exceeded! You have ${currentCount}/${limit} purchases. Upgrade to Premium for unlimited purchases.`);
          setTimeout(() => {
            window.location.href = '/settings?tab=plans-usage';
          }, 2000);
          
          return;
        }
      }

      if (editingPurchase) {
        toast.error('Failed to update purchase. Please try again.');
      } else {
        toast.error('Failed to add purchase. Please try again.');
      }
      // Removed createNotification for purchase errors
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkAction = async (action: 'mark_purchased' | 'mark_cancelled' | 'delete') => {
    if (selectedPurchases.length === 0) return;

    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedPurchases.length} purchase(s)?`)) {
        return;
      }
      
      // Wrap the bulk delete process with loading state
      const wrappedBulkDelete = wrapAsync(async () => {
        setLoadingMessage('Deleting purchases...');
        let allSucceeded = true;
        for (const id of selectedPurchases) {
          try {
            const purchase = purchases.find(p => p.id === id);
            if (purchase && purchase.transaction_id) {
              const linkedTransaction = transactions.find(t => t.transaction_id === purchase.transaction_id);
              if (linkedTransaction) {
                await deleteTransaction(linkedTransaction.id);
              }
            }
            await deletePurchase(id);
          } catch (err) {
            allSucceeded = false;
          }
        }
        if (allSucceeded) {
          toast.success('Selected purchases deleted successfully!');
        } else {
          toast.error('Failed to delete some purchases. Please try again.');
        }
      });
      
      // Execute the wrapped bulk delete function
      await wrappedBulkDelete();
    } else {
      const status = action === 'mark_purchased' ? 'purchased' : 'cancelled';
      
      // Wrap the bulk update process with loading state
      const wrappedBulkUpdate = wrapAsync(async () => {
        setLoadingMessage('Updating purchases...');
        await bulkUpdatePurchases(selectedPurchases, { status });
        toast.success('Selected purchases updated successfully!');
      });
      
      // Execute the wrapped bulk update function
      await wrappedBulkUpdate();
    }
    setSelectedPurchases([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPurchases(filteredPurchases.map(p => p.id));
    } else {
      setSelectedPurchases([]);
    }
  };

  const handleSelectPurchase = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPurchases([...selectedPurchases, id]);
    } else {
      setSelectedPurchases(selectedPurchases.filter(p => p !== id));
    }
  };

  const getStatusBadge = (status: Purchase['status']) => {
    const config = {
      planned: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      purchased: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { color, icon: Icon } = config[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: Purchase['priority']) => {
    const config = {
      low: { color: 'bg-gray-100 text-gray-800' },
      medium: { color: 'bg-blue-100 text-blue-800' },
      high: { color: 'bg-red-100 text-red-800' }
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config[priority].color}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  // For custom currency dropdown
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  // Hide currency menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    }
    if (showCurrencyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCurrencyMenu]);

  // Custom dropdown states for filter bar
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showFilterCurrencyMenu, setShowFilterCurrencyMenu] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);
  const filterCurrencyMenuRef = useRef<HTMLDivElement>(null);

  // Hide filter dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
          if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) setShowCategoryMenu(false);
    if (priorityMenuRef.current && !priorityMenuRef.current.contains(event.target as Node)) setShowPriorityMenu(false);
    if (filterCurrencyMenuRef.current && !filterCurrencyMenuRef.current.contains(event.target as Node)) setShowFilterCurrencyMenu(false);
    }
    if (showCategoryMenu || showPriorityMenu || showFilterCurrencyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryMenu, showPriorityMenu, showFilterCurrencyMenu]);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  const getFileIcon = (fileType: string) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileType)) {
      return <Image className="w-4 h-4" />;
    } else if (fileType === 'pdf') {
      return <FileText className="w-4 h-4" />;
    } else if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(fileType)) {
      return <FileText className="w-4 h-4" />;
    } else if (['xls', 'xlsx', 'csv', 'ods'].includes(fileType)) {
      return <FileText className="w-4 h-4" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileType)) {
      return <File className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  // Handle attachment download
  const handleDownloadAttachment = async (filePath: string, fileName: string) => {
    try {
      // Check if we're in a Capacitor app (Android/iOS)
      const isCapacitor = !!(window as any).Capacitor;
      
      if (isCapacitor) {
        // For Android/iOS apps, use system browser for downloads
        try {
          // Check if Capacitor Browser is available in the global scope
          const capacitorBrowser = (window as any).Capacitor?.Plugins?.Browser;
          
          if (capacitorBrowser && typeof capacitorBrowser.open === 'function') {
            // Use Capacitor Browser plugin to open in system browser
            await capacitorBrowser.open({ url: filePath });
            toast.success('File opened in browser for download');
          } else {
            // For Android WebView, open in system browser using window.open
            const newWindow = window.open(filePath, '_blank', 'noopener,noreferrer');
            if (newWindow) {
              toast.info('File opened in browser. You can download it from there.');
            } else {
              // For Android WebView, try multiple approaches
              try {
                // Method 1: Try to fetch and create blob (works better in Android WebView)
                const response = await fetch(filePath, {
                  method: 'GET',
                  mode: 'cors',
                  credentials: 'omit'
                });
                
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = fileName;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  
                  // Clean up
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  
                  toast.success('Download completed!');
                } else {
                  throw new Error('Failed to fetch file');
                }
              } catch (fetchError) {
                // Fetch method failed, trying direct link - removed for production
                
                // Method 2: Direct link approach
                const link = document.createElement('a');
                link.href = filePath;
                link.download = fileName;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.display = 'none';
                document.body.appendChild(link);
                
                // Try to trigger the download
                link.click();
                
                // Clean up
                setTimeout(() => {
                  document.body.removeChild(link);
                }, 100);
                
                toast.info('Download initiated. Check your Downloads folder or browser downloads.');
              }
            }
          }
        } catch (capacitorError) {
          // Capacitor download failed, trying fallback - removed for production
          
          // Fallback: Open in system browser
          const newWindow = window.open(filePath, '_blank', 'noopener,noreferrer');
          if (newWindow) {
            toast.info('File opened in browser. You can download it from there.');
          } else {
            throw new Error('Unable to open file. Please check your app settings.');
          }
        }
      } else {
        // For regular browsers, use the standard download method
        try {
          // First try: Direct download link (works for same-origin files)
          const link = document.createElement('a');
          link.href = filePath;
          link.download = fileName;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Download started!');
        } catch (directError) {
          // Direct download failed, trying fetch method - removed for production
          
          // Second try: Fetch and blob method (for CORS-enabled files)
          const response = await fetch(filePath, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast.success('Download completed!');
        }
      }
    } catch (error) {

      toast.error(`Download failed: ${error.message}. Please try opening the file in a new tab.`);
    }
  };

  // Add at the top, after useState:
  const plannedCountAll = purchases.filter(p => p.status === 'planned').length;

  // --- Currency Filter: Default to user's preferred currency if available ---
  useEffect(() => {
    // Use selected_currencies if available, otherwise fallback to local_currency
    const userCurrencies = profile?.selected_currencies && profile.selected_currencies.length > 0
      ? profile.selected_currencies
      : profile?.local_currency
        ? [profile.local_currency]
        : [];
    if (
      availableCurrencies.length > 0 &&
      userCurrencies.length > 0 &&
      userCurrencies.some(c => availableCurrencies.includes(c)) &&
      (!filters.currency || !availableCurrencies.includes(filters.currency))
    ) {
      // Prefer primary/local_currency if present in selected, else first selected
      const defaultCurrency = userCurrencies.includes(profile?.local_currency || '') && availableCurrencies.includes(profile?.local_currency || '')
        ? profile?.local_currency
        : userCurrencies.find(c => availableCurrencies.includes(c)) || availableCurrencies[0];
      setFilters(f => ({ ...f, currency: defaultCurrency! }));
      setSelectedCurrency(defaultCurrency!);
    } else if (availableCurrencies.length > 0 && (!filters.currency || !availableCurrencies.includes(filters.currency))) {
      setFilters(f => ({ ...f, currency: availableCurrencies[0] }));
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [profile, availableCurrencies, filters.currency]);

// --- Date Filter UI: Match Transactions Page ---
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(filters.dateRange.start ? filters.dateRange.start.slice(0, 10) : '');
  const [customEnd, setCustomEnd] = useState(filters.dateRange.end ? filters.dateRange.end.slice(0, 10) : '');
  const presetDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler for preset dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target as Node)) {
        setShowPresetDropdown(false);
      }
    }
    if (showPresetDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPresetDropdown]);

  // Preset date range handler
  const handlePresetRange = (preset: string) => {
    const today = new Date();
    if (preset === 'custom') {
      setShowPresetDropdown(false);
      setShowCustomModal(true);
      setCustomStart(filters.dateRange.start ? filters.dateRange.start.slice(0, 10) : '');
      setCustomEnd(filters.dateRange.end ? filters.dateRange.end.slice(0, 10) : '');
      return;
    }
    setShowCustomModal(false);
    let start = '', end = '';
    switch (preset) {
      case 'today':
        start = today.toISOString().slice(0, 10);
        end = today.toISOString().slice(0, 10);
        break;
      case 'thisWeek': {
        const day = today.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        start = monday.toISOString().slice(0, 10);
        end = sunday.toISOString().slice(0, 10);
        break;
      }
      case 'thisMonth': {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
        break;
      }
      case 'lastMonth': {
        const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const last = new Date(today.getFullYear(), today.getMonth(), 0);
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
        break;
      }
      case 'thisYear': {
        const first = new Date(today.getFullYear(), 0, 1);
        const last = new Date(today.getFullYear(), 11, 31);
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
        break;
      }
      case 'allTime':
        start = '';
        end = '';
        break;
      default:
        break;
    }
    setFilters(f => ({ ...f, dateRange: { start, end } }));
  };

  if (!selectedCurrency) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">No currency selected or available.</div>;
  }

  if (availableCurrencies.length === 0) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">No accounts or currencies found. Please add an account first.</div>;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Smooth skeleton for purchases page */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700" style={{ paddingBottom: '13px' }}>
          {/* Filters skeleton */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <PurchaseFiltersSkeleton />
          </div>
          
          {/* Summary cards skeleton */}
          <div className="p-4">
            <PurchaseSummaryCardsSkeleton />
          </div>
          
          {/* Responsive skeleton - Desktop table, Mobile cards */}
          <div className="hidden md:block p-4">
            <PurchaseTableSkeleton rows={6} />
          </div>
          <div className="md:hidden">
            <PurchaseCardSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-[300px] flex items-center justify-center text-red-600 text-xl">{error}</div>;
  }

  // Disable all fields in the edit form if editingPurchase.exclude_from_calculation is true
  const isExcluded = !!(editingPurchase && editingPurchase.exclude_from_calculation);

  // For analytics cards, use the table filter currency:
  const analyticsCurrency = filters.currency || profile?.local_currency || profile?.selected_currencies?.[0] || '';
  const totalSpent = filteredPurchases.reduce((sum, p) => sum + (p.status === 'purchased' ? Number(p.price) : 0), 0);
  const monthlySpent = filteredPurchases.filter(p => p.status === 'purchased' && new Date(p.purchase_date).getMonth() === new Date().getMonth() && new Date(p.purchase_date).getFullYear() === new Date().getFullYear()).reduce((sum, p) => sum + Number(p.price), 0);
  const purchasedCount = filteredPurchases.filter(p => p.status === 'purchased').length;
  const plannedCount = filteredPurchases.filter(p => p.status === 'planned').length;

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Sort function
  const sortData = (data: Purchase[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'item_name':
          aValue = a.item_name.toLowerCase();
          bValue = b.item_name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'price':
          aValue = Number(a.price);
          bValue = Number(b.price);
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'date':
          aValue = new Date(a.purchase_date).getTime();
          bValue = new Date(b.purchase_date).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  return (
    <div className="space-y-6">
      <ShowOnDashboardBanner
        isVisible={!showPurchasesWidget}
        onShow={handleShowPurchasesWidget}
        title="Purchases Widget Hidden"
        description="The Purchases widget is currently hidden on your dashboard."
        buttonText="Show on Dashboard"
        icon={Eye}
      />

      {/* Unified Filters and Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ paddingBottom: '13px' }}>
        {/* Filters Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">

          <div>
            <div className="relative">
                              <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${filters.search ? 'text-blue-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
                  filters.search 
                    ? 'border-blue-300 dark:border-blue-600' 
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
                style={filters.search ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                placeholder="Search purchases…"
              />
            </div>
          </div>

          {/* Selection Filter */}
          {hasSelection && selectedRecord && (
            <SelectionFilter
              label="Selected"
              value={selectedRecord.item_name || 'Purchase'}
              onClear={clearSelection}
            />
          )}

          {/* Mobile Filter and Add Purchase Buttons */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilterMenu(true)}
              className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                (filters.category !== 'all' || filters.priority !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end)
                  ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={(filters.category !== 'all' || filters.priority !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end) ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                // Purchase form button clicked - removed for production
                if (checkCategoriesAndRedirect()) {
                  setShowPurchaseForm(true);
                }
              }}
              className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
              disabled={submitting}
              title="Add Purchase"
              aria-label="Add Purchase"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:block">
              <div className="relative" ref={filterCurrencyMenuRef}>
                <button
                  onClick={() => setShowFilterCurrencyMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.currency 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.currency ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{filters.currency || currencyOptions[0]}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showFilterCurrencyMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {currencyOptions.map(currency => (
                      <button
                        key={currency}
                        onClick={() => { setFilters({ ...filters, currency }); setShowFilterCurrencyMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.currency === currency ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                )}
          </div>
          </div>



          <div className="hidden md:block">
              <div className="relative" ref={categoryMenuRef}>
                <button
                  onClick={() => setShowCategoryMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.category !== 'all' 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.category !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{filters.category === 'all' ? 'All Categories' : filters.category}</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showCategoryMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => { setFilters({ ...filters, category: 'all' }); setShowCategoryMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.category === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                    >
                      All Categories
                    </button>
              {purchaseCategories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => { setFilters({ ...filters, category: category.category_name }); setShowCategoryMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.category === category.category_name ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                      >
                  {category.category_name}
                      </button>
              ))}
                  </div>
                )}
              </div>
          </div>

          <div className="hidden md:block">
              <div className="relative" ref={priorityMenuRef}>
                <button
                  onClick={() => setShowPriorityMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.priority !== 'all' 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.priority !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{filters.priority === 'all' ? 'All Priorities' : filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showPriorityMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {(['all', 'low', 'medium', 'high'] as const).map(priority => (
                      <button
                        key={priority}
                        onClick={() => { setFilters({ ...filters, priority: priority as 'all' | 'low' | 'medium' | 'high' }); setShowPriorityMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${(filters.priority as string) === priority ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                      >
                        {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
          </div>
            {/* Date Filter Dropdown and Modal (matches Transactions page) */}
            <div className="relative hidden md:block">
              <button
                className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                  filters.dateRange.start && filters.dateRange.end 
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                } ${showPresetDropdown ? 'ring-2 ring-blue-500' : ''}`}
                style={filters.dateRange.start && filters.dateRange.end ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                onClick={() => setShowPresetDropdown(v => !v)}
                type="button"
              >
                <span>{getDateRangeLabel()}</span>
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPresetDropdown && (
                <div ref={presetDropdownRef} className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('today'); setShowPresetDropdown(false); }}>Today</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisWeek'); setShowPresetDropdown(false); }}>This Week</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisMonth'); setShowPresetDropdown(false); }}>This Month</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('lastMonth'); setShowPresetDropdown(false); }}>Last Month</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisYear'); setShowPresetDropdown(false); }}>This Year</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('allTime'); setShowPresetDropdown(false); }}>All Time</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('custom'); }}>Custom Range…</button>
                </div>
              )}
              {/* Custom Range Modal */}
              {showCustomModal && (
                <>
                  <style>{`
                    .react-datepicker, .react-datepicker * {
                      font-family: 'Manrope', sans-serif !important;
                    }
                  `}</style>
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowCustomModal(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-xs w-full mx-4 shadow-xl flex flex-col items-center">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Select Custom Date Range</h3>
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                          <DatePicker
                            selected={customStart ? new Date(customStart) : null}
                            onChange={date => setCustomStart(date ? date.toISOString().slice(0, 10) : '')}
                            selectsStart
                            startDate={customStart ? new Date(customStart) : null}
                            endDate={customEnd ? new Date(customEnd) : null}
                            maxDate={customEnd ? new Date(customEnd) : undefined}
                            dateFormat="MM/dd/yyyy"
                            className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded w-full font-sans text-gray-900 dark:text-gray-100"
                            placeholderText="Select start date"
                            isClearable
                            showPopperArrow={false}
                            popperPlacement="bottom"
                            autoComplete="off"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                          <DatePicker
                            selected={customEnd ? new Date(customEnd) : null}
                            onChange={date => setCustomEnd(date ? date.toISOString().slice(0, 10) : '')}
                            selectsEnd
                            startDate={customStart ? new Date(customStart) : null}
                            endDate={customEnd ? new Date(customEnd) : null}
                            minDate={customStart ? new Date(customStart) : undefined}
                            dateFormat="MM/dd/yyyy"
                            className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded w-full font-sans text-gray-900 dark:text-gray-100"
                            placeholderText="Select end date"
                            isClearable
                            showPopperArrow={false}
                            popperPlacement="bottom"
                            autoComplete="off"
                          />
                        </div>
                        {customStart && customEnd && new Date(customEnd) < new Date(customStart) && (
                          <div className="text-xs text-red-500 mt-1">End date cannot be before start date.</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-6 w-full">
                        <button
                          className="flex-1 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100"
                          onClick={() => setShowCustomModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="flex-1 py-2 rounded bg-gradient-primary hover:bg-gradient-primary-hover text-white disabled:opacity-50"
                          disabled={!!(customStart && customEnd && new Date(customEnd) < new Date(customStart))}
                          onClick={() => {
                            setFilters(f => ({ ...f, dateRange: {
                              start: customStart ? new Date(customStart).toISOString() : '',
                              end: customEnd ? new Date(customEnd).toISOString() : ''
                            }}));
                            setShowCustomModal(false);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {(filters.search || filters.category !== 'all' || filters.priority !== 'all' || (filters.currency && filters.currency !== (profile?.local_currency || profile?.selected_currencies?.[0])) || getDateRangeLabel() !== 'This Month') && (
              <button
                onClick={() => setFilters({ search: '', category: 'all', priority: 'all', currency: '', dateRange: getThisMonthDateRange() })}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                title="Clear all filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}

            {/* Add Purchase Button moved here */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Desktop Add Purchase Button */}
              <button
                onClick={() => {
                  // Purchase form button clicked - removed for production
                  if (checkCategoriesAndRedirect()) {
                    setShowPurchaseForm(true);
                  }
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-primary text-white rounded-md hover:bg-gradient-primary-hover transition-colors whitespace-nowrap h-8 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
                disabled={submitting}
                title="Add Purchase"
                aria-label="Add Purchase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Purchase</span>
              </button>


            </div>
          </div>
        </div>
        {/* Analytics Cards Grid - moved inside table container */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(totalSpent, analyticsCurrency)}
                </p>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                  {(() => {
                    const avgSpent = purchasedCount > 0 ? totalSpent / purchasedCount : 0;
                    return `Avg ${formatCurrency(avgSpent, analyticsCurrency)} per purchase`;
                  })()}
                </p>
              </div>
              <span className="text-purple-600" style={{ fontSize: '1.2rem' }}>
                {getCurrencySymbol(analyticsCurrency)}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{purchasedCount}</p>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                  {(() => {
                    const totalPurchases = purchasedCount + plannedCountAll;
                    const completionRate = totalPurchases > 0 ? Math.round((purchasedCount / totalPurchases) * 100) : 0;
                    return `Completion Rate: ${completionRate}%`;
                  })()}
                </p>
              </div>
              <CheckCircle className="text-purple-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Planned</p>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{plannedCountAll}</p>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                  {(() => {
                    const today = new Date();
                    const overdueCount = filteredPurchases.filter(p => 
                      p.status === 'planned' && 
                      new Date(p.purchase_date) < today
                    ).length;
                    return `Overdue: ${overdueCount} item${overdueCount !== 1 ? 's' : ''}`;
                  })()}
                </p>
              </div>
              <Clock className="text-purple-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
            </div>
          </div>
        </div>
        {/* Desktop Table View */}
        <div className="xl:block hidden overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('item_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Item Name</span>
                    {getSortIcon('item_name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    {getSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Price</span>
                    {getSortIcon('price')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Priority</span>
                    {getSortIcon('priority')}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchase records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Start tracking your purchases and shopping lists by adding your first item
                    </p>
                  </td>
                </tr>
              ) : (
                sortData(filteredPurchases).map((purchase) => {
                  const isSelected = selectedId === purchase.id;
                  const isFromSearchSelection = isFromSearch && isSelected;
                  
                  return (
                    <tr 
                      key={purchase.id} 
                      id={`purchase-${purchase.id}`}
                      ref={isSelected ? selectedRecordRef : null}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                        isSelected 
                          ? isFromSearchSelection 
                            ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                            : 'ring-2 ring-blue-500 ring-opacity-50'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-2">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div 
                              className="text-sm font-medium text-gray-900 dark:text-white"
                            >
                              {purchase.item_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2 text-left">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: purchaseCategories.find(c => c.category_name === purchase.category)?.category_color || '#6B7280'
                            }}
                          />
                          <span className="text-sm text-gray-900 dark:text-white">{purchase.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2 text-center text-gray-900 dark:text-gray-100">
                        {formatCurrency(purchase.price, purchase.currency)}
                      </td>
                      <td className="px-6 py-2 text-center">
                        {getStatusBadge(purchase.status)}
                      </td>
                      <td className="px-6 py-2 text-center">
                        {getPriorityBadge(purchase.priority)}
                      </td>
                      <td className="px-6 py-2 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          {(() => {
                            const hasNotes = purchase.notes && purchase.notes.trim().length > 0;
                            const hasAttachments = purchaseAttachmentCounts[purchase.id] > 0;
                            const shouldShow = shouldShowEyeIcon(hasNotes, hasAttachments);
                            const tooltipText = getTooltipText(hasNotes, hasAttachments);
                            
                            if (!shouldShow) return null;
                            
                            return (
                              <div className="relative group">
                                <button
                                  onClick={async () => {
                                    setSelectedPurchaseForModal(purchase);
                                    setShowNotesModal(true);
                                    // Fetch existing attachments for this purchase
                                    try {
                                      // Loading modal attachments for purchase - removed for production
                                      const { data: existingAttachments, error: attachmentsError } = await supabase
                                        .from('purchase_attachments')
                                        .select('*')
                                        .eq('purchase_id', purchase.id);
                                      
                                      // Modal attachments query result - removed for production
                                      
                                      if (!attachmentsError && existingAttachments) {
                                        setModalAttachments(existingAttachments);
                                        // Loaded modal attachments - removed for production
                                      } else {
                                        // No modal attachments found or error - removed for production
                                        setModalAttachments([]);
                                      }
                                    } catch (err) {

                                      setModalAttachments([]);
                                    }
                                  }}
                                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <Eye className="w-4 h-4 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
                                </button>
                                <div className="absolute right-[-15px] bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border border-gray-700">
                                  {tooltipText}
                                  <div className="absolute bottom-0 right-4 transform translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45 border-r border-b border-gray-700"></div>
                                </div>
                              </div>
                            );
                          })()}
                          <button
                            onClick={async () => {
                              setEditingPurchase(purchase);
                              setFormData({
                                item_name: purchase.item_name,
                                category: purchase.category,
                                price: purchase.price.toString(),
                                currency: purchase.currency,
                                purchase_date: purchase.purchase_date,
                                status: purchase.status,
                                priority: purchase.priority,
                                notes: purchase.notes || ''
                              });
                              
                              // Set the exclude from calculation state based on the purchase data
                              setExcludeFromCalculation(purchase.exclude_from_calculation || false);
                              
                              // Load existing attachments for this purchase
                              try {
                                // Loading attachments for purchase - removed for production
                                const { data: existingAttachments, error: attachmentsError } = await supabase
                                  .from('purchase_attachments')
                                  .select('*')
                                  .eq('purchase_id', purchase.id);
                                
                                // Attachments query result - removed for production
                                
                                if (!attachmentsError && existingAttachments) {
                                  setPurchaseAttachments(existingAttachments);
                                  // Loaded existing attachments - removed for production
                                } else {
                                  // No attachments found or error - removed for production
                                  setPurchaseAttachments([]);
                                }
                              } catch (err) {

                                setPurchaseAttachments([]);
                              }
                              
                              // Load account information from linked transaction or purchase record
                              if (purchase.account_id) {
                                // For excluded purchases, use the account_id stored in the purchase record
                                setSelectedAccountId(purchase.account_id);
                                // Loaded account from purchase record - removed for production
                              } else if (purchase.transaction_id) {
                                // For normal purchases, load from linked transaction
                                try {
                                  const { data: linkedTransaction, error } = await supabase
                                    .from('transactions')
                                    .select('account_id')
                                    .eq('transaction_id', purchase.transaction_id)
                                    .single();
                                  
                                  if (linkedTransaction && !error) {
                                    setSelectedAccountId(linkedTransaction.account_id);
                                    // Loaded account from linked transaction - removed for production
                                  } else {
                                    // No linked transaction found for purchase - removed for production
                                    setSelectedAccountId('');
                                  }
                                } catch (err) {

                                  setSelectedAccountId('');
                                }
                              } else {
                                setSelectedAccountId('');
                              }
                              
                              setShowPurchaseForm(true);
                            }}
                            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setPurchaseToDelete(purchase); setShowDeleteModal(true); }}
                            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
                      </table>
            </div>
          </div>

        {/* Mobile Card View */}
        <div className="lg:hidden max-h-[500px] overflow-y-auto">
          <div className="space-y-4 px-2.5">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchase records found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start tracking your purchases and shopping lists by adding your first item
                </p>
              </div>
            ) : (
              sortData(filteredPurchases).map((purchase) => {
                const isSelected = selectedPurchaseId === purchase.id;
                return (
                  <div 
                    key={purchase.id} 
                    id={`purchase-${purchase.id}`}
                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  >
                    {/* Card Header - Item Name and Date */}
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex-1">
                        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">
                          {purchase.item_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(purchase.price, purchase.currency)}
                      </div>
                    </div>

                    {/* Card Body - Category and Status */}
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: purchaseCategories.find(c => c.category_name === purchase.category)?.category_color || '#6B7280'
                          }}
                        />
                        <span className="text-sm text-gray-900 dark:text-white">{purchase.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(purchase.status)}
                        {getPriorityBadge(purchase.priority)}
                      </div>
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {(() => {
                        const hasNotes = purchase.notes && purchase.notes.trim().length > 0;
                        const hasAttachments = purchaseAttachmentCounts[purchase.id] > 0;
                        const shouldShow = shouldShowEyeIcon(hasNotes, hasAttachments);
                        const tooltipText = getTooltipText(hasNotes, hasAttachments);
                        
                        return (
                          <>
                            {shouldShow && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {tooltipText}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {shouldShow && (
                                <div className="relative group">
                                  <button
                                    onClick={async () => {
                                      setSelectedPurchaseForModal(purchase);
                                      setShowNotesModal(true);
                                      // Fetch existing attachments for this purchase
                                      try {
                                        // Loading modal attachments for purchase - removed for production
                                        const { data: existingAttachments, error: attachmentsError } = await supabase
                                          .from('purchase_attachments')
                                          .select('*')
                                          .eq('purchase_id', purchase.id);
                                        
                                        // Modal attachments query result - removed for production
                                        
                                        if (!attachmentsError && existingAttachments) {
                                          setModalAttachments(existingAttachments);
                                          // Loaded modal attachments - removed for production
                                        } else {
                                          // No modal attachments found or error - removed for production
                                          setModalAttachments([]);
                                        }
                                      } catch (err) {

                                        setModalAttachments([]);
                                      }
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="absolute right-[-15px] bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border border-gray-700">
                                    {tooltipText}
                                    <div className="absolute bottom-0 right-4 transform translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45 border-r border-b border-gray-700"></div>
                                  </div>
                                </div>
                              )}
                              <button
                          onClick={async () => {
                            setEditingPurchase(purchase);
                            setFormData({
                              item_name: purchase.item_name,
                              category: purchase.category,
                              price: purchase.price.toString(),
                              currency: purchase.currency,
                              purchase_date: purchase.purchase_date,
                              status: purchase.status,
                              priority: purchase.priority,
                              notes: purchase.notes || ''
                            });
                            
                            // Set the exclude from calculation state based on the purchase data
                            setExcludeFromCalculation(purchase.exclude_from_calculation || false);
                            
                            // Load existing attachments for this purchase
                            try {
                              // Loading attachments for purchase - removed for production
                              const { data: existingAttachments, error: attachmentsError } = await supabase
                                .from('purchase_attachments')
                                .select('*')
                                .eq('purchase_id', purchase.id);
                              
                              // Attachments query result - removed for production
                              
                              if (!attachmentsError && existingAttachments) {
                                setPurchaseAttachments(existingAttachments);
                                // Loaded existing attachments - removed for production
                              } else {
                                // No attachments found or error - removed for production
                                setPurchaseAttachments([]);
                              }
                            } catch (err) {

                              setPurchaseAttachments([]);
                            }
                            
                            // Load account information from linked transaction or purchase record
                            if (purchase.account_id) {
                              // For excluded purchases, use the account_id stored in the purchase record
                              setSelectedAccountId(purchase.account_id);
                              // Loaded account from purchase record - removed for production
                            } else if (purchase.transaction_id) {
                              // For normal purchases, load from linked transaction
                              try {
                                const { data: linkedTransaction, error } = await supabase
                                  .from('transactions')
                                  .select('account_id')
                                  .eq('transaction_id', purchase.transaction_id)
                                  .single();
                                
                                if (linkedTransaction && !error) {
                                  setSelectedAccountId(linkedTransaction.account_id);
                                  // Loaded account from linked transaction - removed for production
                                } else {
                                  // No linked transaction found for purchase - removed for production
                                  setSelectedAccountId('');
                                }
                              } catch (err) {

                                setSelectedAccountId('');
                              }
                            } else {
                              setSelectedAccountId('');
                            }
                            
                            setShowPurchaseForm(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setPurchaseToDelete(purchase); setShowDeleteModal(true); }}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tablet Stacked Table View */}
        <div className="hidden lg:block xl:hidden max-h-[500px] overflow-y-auto">
          <div className="space-y-4 px-2.5">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchase records found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start tracking your purchases and shopping lists by adding your first purchase
                </p>
              </div>
            ) : (
              filteredPurchases.map((purchase) => {
                const category = purchaseCategories.find(c => c.category_name === purchase.category);
                const isSelected = selectedId === purchase.id;
                const isFromSearchSelection = isFromSearch && isSelected;
                
                
                return (
                  <div
                    key={purchase.id}
                    id={`purchase-${purchase.id}`}
                    ref={isSelected ? selectedRecordRef : null}
                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                      isSelected 
                        ? isFromSearchSelection 
                          ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                          : 'ring-2 ring-blue-500 ring-opacity-50'
                        : ''
                    }`}
                  >
                    {/* Row 1: Item Name, Date, Price, Actions */}
                    <div className="grid grid-cols-12 gap-2 p-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="col-span-4">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {purchase.item_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {formatCurrency(purchase.price, purchase.currency)}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {purchase.status}
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button
                          onClick={async () => {
                            setSelectedPurchaseForModal(purchase);
                            setShowNotesModal(true);
                            // Fetch existing attachments for this purchase
                            try {
                              // Loading modal attachments for purchase - removed for production
                              const { data: existingAttachments, error: attachmentsError } = await supabase
                                .from('purchase_attachments')
                                .select('*')
                                .eq('purchase_id', purchase.id);
                              
                              // Modal attachments query result - removed for production
                              
                              if (!attachmentsError && existingAttachments) {
                                setModalAttachments(existingAttachments);
                                // Loaded modal attachments - removed for production
                              } else {
                                // No modal attachments found or error - removed for production
                                setModalAttachments([]);
                              }
                            } catch (err) {

                              setModalAttachments([]);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View Notes and Attachments"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            setEditingPurchase(purchase);
                            setFormData({
                              item_name: purchase.item_name,
                              category: purchase.category,
                              price: purchase.price.toString(),
                              currency: purchase.currency,
                              purchase_date: purchase.purchase_date,
                              status: purchase.status,
                              priority: purchase.priority,
                              notes: purchase.notes || ''
                            });
                            setExcludeFromCalculation(purchase.exclude_from_calculation || false);
                            setShowPurchaseForm(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit purchase"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setPurchaseToDelete(purchase); setShowDeleteModal(true); }}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete purchase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Row 2: Category, Account, Notes */}
                    <div className="grid grid-cols-12 gap-2 p-3">
                      <div className="col-span-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Category</div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {purchase.category || 'Uncategorized'}
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Priority</div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {purchase.priority.charAt(0).toUpperCase() + purchase.priority.slice(1)}
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Notes</div>
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {purchase.notes || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <>
            <Loader isLoading={submitting} message={loadingMessage} />
            <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => {
            setShowPurchaseForm(false);
            setEditingPurchase(null);
          }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-[38rem] max-h-[90vh] overflow-y-auto z-50 shadow-xl transition-all" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{editingPurchase ? 'Edit Purchase' : 'Add Purchase'}</h2>
              <button
                onClick={() => {
                  setShowPurchaseForm(false);
                  setEditingPurchase(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close form"
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
                          onClick={() => !submitting && setExcludeFromCalculation(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm">💳</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                From Account
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Affects Balance
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div 
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            excludeFromCalculation 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                          }`}
                          onClick={() => !submitting && setExcludeFromCalculation(true)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm">📝</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                Record Only
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                No Balance Change
                              </div>
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
                    className={`w-full px-4 pr-[32px] text-[14px] h-10 border rounded-lg focus:ring-2 focus-ring-gradient outline-none transition-colors bg-gray-100 font-medium ${fieldErrors.item_name && touched.item_name ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                    placeholder="Enter item name *"
                    required
                    disabled={isExcluded}
                  />
                  {formData.item_name && !isExcluded && (
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
                    disabled={isExcluded || !!(editingPurchase && editingPurchase.status === 'purchased')}
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
                          disabled={isExcluded}
                          fullWidth={true}
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
                          disabled={submitting}
                        />
                      </div>
                    )}
                    
                    {/* Category */}
                    <div className="relative">
                      <CustomDropdown
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
                        value={formData.category}
                        onChange={val => {
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
                        placeholder="Select category *"
                        disabled={isExcluded}
                        fullWidth={true}
                        summaryMode={true}
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
                        className={`w-full px-4 pr-[32px] text-[14px] h-10 border rounded-lg focus:ring-2 focus-ring-gradient outline-none transition-colors bg-gray-100 font-medium ${fieldErrors.price && touched.price ? 'border-red-500 ring-red-200' : 'border-gray-300'}`}
                        placeholder="0.00 *"
                        required
                        disabled={isExcluded}
                        autoComplete="off"
                      />
                      {formData.price && !isExcluded && (
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
                    <div className={`flex items-center bg-gray-100 dark:bg-gray-700 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full border border-gray-200 dark:border-gray-600 ${fieldErrors.purchase_date && (touched.purchase_date) ? 'border-red-500 dark:border-red-500' : ''}`}>                <svg className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                    setShowPurchaseForm(false);
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
                  disabled={submitting || !isFormValid()}
                >
                  {submitting ? <span className="loader mr-2" /> : null}
                  {submitting ? (editingPurchase ? 'Updating...' : 'Adding...') : (editingPurchase ? 'Update Purchase' : 'Make Purchase')}
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}

      {/* Combined Purchase Details & File Viewer Modal */}
      {showNotesModal && selectedPurchaseForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => { setShowNotesModal(false); setSelectedPurchaseForModal(null); setModalAttachments([]); setViewingFile(null); setImageZoom(100); }} />
          <div className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out ${
            viewingFile 
              ? 'w-[80vw] h-[80vh] animate-in zoom-in-95' 
              : 'p-6 max-w-[35rem] w-full animate-in zoom-in-95'
          }`}>
            {/* Cross icon at top right */}
            <button
              onClick={() => { setShowNotesModal(false); setSelectedPurchaseForModal(null); setModalAttachments([]); setViewingFile(null); setImageZoom(100); }}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none z-20"
              aria-label="Close"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {!viewingFile ? (
              /* Purchase Details View */
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Purchase Details</h2>
                {selectedPurchaseForModal.notes && selectedPurchaseForModal.notes.trim().length > 0 && (
                  <div className="mb-4 whitespace-pre-line text-gray-800 dark:text-gray-200 text-sm max-h-40 overflow-y-auto">
                    <strong>Notes:</strong>
                    <div className="ql-editor dark:text-gray-200" dangerouslySetInnerHTML={{ __html: selectedPurchaseForModal.notes }} />
                  </div>
                )}
                {modalAttachments.length > 0 &&
                  <div className="mb-4">
                    <strong className="text-gray-900 dark:text-gray-100">Attachments:</strong>
                    <div className="grid grid-cols-1 gap-3">
                      {modalAttachments.map((att, idx) => (
                        <div
                          key={att.id || idx}
                          className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                          {/* Thumbnail or Icon */}
                          {att.mime_type?.startsWith('image/') ? (
                            <a href={att.file_path} target="_blank" rel="noopener noreferrer">
                              <img src={att.file_path} alt={att.file_name} className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-600" />
                            </a>
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                              {getFileIcon(att.file_type)}
                            </div>
                          )}

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={att.file_name}>
                              {att.file_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{att.mime_type || att.file_type}{att.file_size ? ` • ${formatFileSize(att.file_size)}` : ''}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setViewingFile(att)}
                              className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" 
                              title="View"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDownloadAttachment(att.file_path, att.file_name)}
                              className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" 
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              </div>
            ) : (
              /* File Viewer View */
              <div className="h-full flex flex-col animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  {/* Left side - Back button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setViewingFile(null)}
                      className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none p-1"
                      aria-label="Back to attachments"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {viewingFile.file_name}
                    </h3>
                  </div>
                  
                  {/* Right side - Empty for now */}
                  <div></div>
                </div>
                
                {/* File Content */}
                <div className="p-4 h-[calc(80vh-120px)] overflow-auto bg-gray-100 dark:bg-gray-800">
                  {viewingFile.mime_type?.startsWith('image/') ? (
                    <div className="flex justify-center overflow-auto">
                      <img 
                        src={viewingFile.file_path} 
                        alt={viewingFile.file_name}
                        className="max-w-full object-contain rounded-lg shadow-lg transition-transform duration-200"
                        style={{ transform: `scale(${imageZoom / 100})` }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex flex-col items-center justify-center p-8 text-center">
                                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                                <p class="text-gray-500 dark:text-gray-400">Unable to load image</p>
                                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">The image may be corrupted or the file path is invalid</p>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : viewingFile.file_type === 'pdf' || viewingFile.mime_type === 'application/pdf' ? (
                    <div className="w-full h-[calc(80vh-160px)] bg-white dark:bg-gray-700 rounded-lg overflow-auto">
                      {/* PDF Fallback - Show custom message instead of iframe */}
                      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">PDF Preview Not Available</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                          PDFs cannot be displayed inline due to browser security restrictions
                        </p>
                        <div className="flex gap-3">
                          <a 
                            href={viewingFile.file_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            Open in New Tab
                          </a>
                          <button 
                            onClick={() => handleDownloadAttachment(viewingFile.file_path, viewingFile.file_name)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-900 rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        {getFileIcon(viewingFile.file_type)}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">Preview not available for this file type</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                        {viewingFile.file_name} ({formatFileSize(viewingFile.file_size || 0)})
                      </p>
                      <div className="flex gap-3">
                        <a 
                          href={viewingFile.file_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Open in New Tab
                        </a>
                        <button 
                          onClick={() => handleDownloadAttachment(viewingFile.file_path, viewingFile.file_name)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Zoom Controls - Bottom Center */}
                {(viewingFile.mime_type?.startsWith('image/') || viewingFile.file_type === 'pdf' || viewingFile.mime_type === 'application/pdf') && (
                  <div className="flex justify-center items-center p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setImageZoom(Math.max(25, imageZoom - 25))}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="Zoom Out"
                      >
                        -
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-center font-medium">
                        {imageZoom}%
                      </span>
                      <button
                        onClick={() => setImageZoom(Math.min(300, imageZoom + 25))}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="Zoom In"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setImageZoom(100)}
                        className="px-3 py-2 text-sm bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-300 dark:hover:bg-blue-600"
                        title="Reset Zoom"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!purchaseToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);
          if (purchaseToDelete) {
            // Wrap the single delete process with loading state
            const wrappedDelete = wrapAsync(async () => {
              setLoadingMessage('Deleting purchase...');
              try {
                if (purchaseToDelete.transaction_id) {
                  const linkedTransaction = transactions.find(t => t.transaction_id === purchaseToDelete.transaction_id);
                  if (linkedTransaction) {
                    await deleteTransaction(linkedTransaction.id);
                  }
                }
                await deletePurchase(purchaseToDelete.id);
                toast.success('Purchase deleted successfully!');
              } catch (err) {
                toast.error('Failed to delete purchase. Please try again.');
              }
              setPurchaseToDelete(null);
            });
            
            // Execute the wrapped delete function
            await wrappedDelete();
          }
        }}
        title="Delete Purchase"
        message={`Are you sure you want to delete ${purchaseToDelete?.item_name}? This will also remove the linked transaction and update the account balance.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-800">Purchase Details:</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div><span className="font-medium">Item:</span> {purchaseToDelete?.item_name}</div>
              <div><span className="font-medium">Price:</span> {purchaseToDelete ? formatCurrency(purchaseToDelete.price, purchaseToDelete.currency) : ''}</div>
              <div><span className="font-medium">Account:</span> {purchaseToDelete?.account_id ? accounts.find(a => a.id === purchaseToDelete.account_id)?.name || 'N/A' : 'N/A'}</div>
          </div>
          </>
        }
        confirmLabel="Delete Purchase"
        cancelLabel="Cancel"
      />

      {/* Mobile Filter Modal */}
      {showMobileFilterMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] md:hidden">
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[calc(100vw-2rem)] max-w-xs p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFilters(tempFilters);
                    setShowMobileFilterMenu(false);
                  }}
                  className={`p-1 rounded-full transition-colors ${
                    (tempFilters.category !== 'all' || tempFilters.priority !== 'all' || tempFilters.currency || tempFilters.dateRange.start || tempFilters.dateRange.end)
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-gray-400'
                  }`}
                  title="Apply Filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Clear All"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select filters and click ✓ to apply</p>

            {/* Filter Options */}
            <div className="space-y-4">
              {/* Currency Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Currency</h4>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, currency: '' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.currency === ''
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  {currencyOptions.map(currency => (
                    <button
                      key={currency}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, currency });
                      }}
                      className={`rounded-full px-2 py-1 text-xs transition-colors ${
                        tempFilters.currency === currency
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Category</h4>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, category: 'all' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.category === 'all'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Categories
                  </button>
                  {purchaseCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, category: category.category_name });
                      }}
                      className={`rounded-full px-2 py-1 text-xs transition-colors ${
                        tempFilters.category === category.category_name
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.category_name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Priority</h4>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, priority: 'all' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.priority === 'all'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Priorities
                  </button>
                  {(['low', 'medium', 'high'] as const).map(priority => (
                    <button
                      key={priority}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, priority });
                      }}
                      className={`rounded-full px-2 py-1 text-xs transition-colors ${
                        tempFilters.priority === priority
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Date Range</h4>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, dateRange: { start: '', end: '' } });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      !tempFilters.dateRange.start && !tempFilters.dateRange.end
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Dates
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const today = new Date().toISOString().slice(0, 10);
                      setTempFilters({ ...tempFilters, dateRange: { start: today, end: today } });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.dateRange.start === new Date().toISOString().slice(0, 10) && tempFilters.dateRange.end === new Date().toISOString().slice(0, 10)
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const { start, end } = getThisMonthDateRange();
                      setTempFilters({ ...tempFilters, dateRange: { start, end } });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.dateRange.start === getThisMonthDateRange().start && tempFilters.dateRange.end === getThisMonthDateRange().end
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    This Month
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        open={showCategoryModal}
        initialValues={{
          category_name: '',
          description: '',
          monthly_budget: 0,
          currency: formData.currency || profile?.local_currency || profile?.selected_currencies?.[0] || '',
          category_color: '#3B82F6'
        }}
        isEdit={false}
        onSave={async (values) => {
          await useFinanceStore.getState().addPurchaseCategory({
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
    </div>
  );
};


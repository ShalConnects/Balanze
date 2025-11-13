import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { format } from 'date-fns';
import { Search, Filter, Download, TrendingUp, Heart, CheckCircle, HelpCircle, Clock, Plus, Copy, ChevronUp, ChevronDown, Trash2, Eye, Star, FileText, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tooltip } from '../components/common/Tooltip';
import { useAuthStore } from '../store/authStore';
import { DonationCardSkeleton, DonationTableSkeleton, DonationSummaryCardsSkeleton, DonationFiltersSkeleton } from '../components/Donations/DonationSkeleton';
import { ManualDonationModal } from '../components/common/ManualDonationModal';
import { DonationInfoModal } from '../components/Donations/DonationInfoModal';
import { DeleteConfirmationModal } from '../components/common/DeleteConfirmationModal';
import { toast } from 'sonner';
import { getPreference, setPreference } from '../lib/userPreferences';
import { useRecordSelection } from '../hooks/useRecordSelection';
import { SelectionFilter } from '../components/common/SelectionFilter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DonationsSavingsPage: React.FC = () => {
  const { 
    donationSavingRecords, 
    deleteDonationSavingRecord,
    transactions,
    accounts,
    loading,
    setDonationSavingRecords
  } = useFinanceStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'fixed' | 'percent'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'donated' | 'pending'>('all');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterDateRange, setFilterDateRange] = useState<'1month' | '3months' | '6months' | '1year' | 'allTime'>('1month');

  // Mobile filter states
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    searchTerm: '',
    filterMode: 'all' as 'all' | 'fixed' | 'percent',
    filterStatus: 'all' as 'all' | 'donated' | 'pending',
    filterCurrency: '',
    filterDateRange: '1month' as '1month' | '3months' | '6months' | '1year' | 'allTime'
  });

  // Manual donation modal state
  const [showManualDonationModal, setShowManualDonationModal] = useState(false);
  
  // Donation info modal state
  const [showDonationInfo, setShowDonationInfo] = useState(false);
  
  // Android download modal state
  const [showAndroidDownloadModal, setShowAndroidDownloadModal] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState<any>(null);
  const [, setDeleteConfirmId] = useState<string | null>(null);

  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Widget visibility state - hybrid approach (localStorage + database)
  const [, setShowDonationsSavingsWidget] = useState(() => {
    const saved = localStorage.getItem('showDonationsSavingsWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Check if donations widget is hidden
  const [isDonationsSavingsWidgetHidden, setIsDonationsSavingsWidgetHidden] = useState(() => {
    const saved = localStorage.getItem('showDonationsSavingsWidget');
    return saved !== null ? !JSON.parse(saved) : false;
  });
  const [isRestoringWidget, setIsRestoringWidget] = useState(false);

  // Record selection functionality
  const {
    selectedRecord,
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: donationSavingRecords,
    recordIdField: 'id',
    scrollToRecord: true
  });

  // Refs for dropdown menus
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // State for dropdown menus
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
  const sortData = (data: any[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'original_amount':
          const transactionA = transactions.find(t => t.id === a.transaction_id);
          const transactionB = transactions.find(t => t.id === b.transaction_id);
          aValue = transactionA ? transactionA.amount : 0;
          bValue = transactionB ? transactionB.amount : 0;
          break;
        case 'donation_amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'mode':
          aValue = a.mode.toLowerCase();
          bValue = b.mode.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
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

  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);
  
  // Android detection
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroidApp = isAndroid && isCapacitor;

  // Memoize fetch function to prevent infinite loops
  const fetchDonationSavingRecordsCallback = useCallback(() => {
    useFinanceStore.getState().fetchDonationSavingRecords();
  }, []);

  // Get all unique currencies from accounts
  const allRecordCurrencies = Array.from(new Set(
    donationSavingRecords.map(record => {
      const transaction = transactions.find(t => t.id === record.transaction_id);
      const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
      return account ? account.currency : null;
    }).filter((c): c is string => Boolean(c))
  ));

  // Get available currencies from user's profile and accounts as fallback
  const availableCurrencies = profile?.selected_currencies && profile.selected_currencies.length > 0
    ? profile.selected_currencies
    : Array.from(new Set(accounts.map(acc => acc.currency)));

  // Filter currencies based on user's selected currencies, with fallback to available currencies
  const recordCurrencies = profile?.selected_currencies && profile.selected_currencies.length > 0
    ? allRecordCurrencies.filter(currency => profile.selected_currencies?.includes?.(currency))
    : allRecordCurrencies.length > 0 
      ? allRecordCurrencies 
      : availableCurrencies;

  // Set default currency filter to user's preferred currency if available and valid
  useEffect(() => {
    if (!filterCurrency && recordCurrencies.length > 0) {
      // Prefer local_currency if available in selected currencies, else first available
      const defaultCurrency = profile?.local_currency && recordCurrencies.includes(profile.local_currency)
        ? profile.local_currency
        : recordCurrencies[0];
      setFilterCurrency(defaultCurrency);
    }
  }, [profile, recordCurrencies, filterCurrency, availableCurrencies]);

  useEffect(() => {
    if (user) {
      fetchDonationSavingRecordsCallback();
    }
  }, [user, fetchDonationSavingRecordsCallback]);

  // Load user preferences for Donations & Savings widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showDonationsSavingsWidget', true);
          setShowDonationsSavingsWidget(showWidget);
          localStorage.setItem('showDonationsSavingsWidget', JSON.stringify(showWidget));
        } catch (error) {

          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Show Donations & Savings widget on dashboard
  const handleShowDonationsSavingsWidget = useCallback(async () => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showDonationsSavingsWidget', JSON.stringify(true));
    setShowDonationsSavingsWidget(true);
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await setPreference(user.id, 'showDonationsSavingsWidget', true);
        toast.success('Donations & Savings widget will be shown on dashboard!', {
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
  }, [user?.id, setShowDonationsSavingsWidget]);

  // Function to restore donations widget to dashboard
  const handleShowDonationsSavingsWidgetFromPage = useCallback(async () => {
    console.log('Restoring Donations & Savings widget to dashboard');
    setIsRestoringWidget(true);
    
    try {
      // Use the existing function that has proper database sync
      await handleShowDonationsSavingsWidget();
      
      // Update local state
      setIsDonationsSavingsWidgetHidden(false);
      
      console.log('Donations & Savings widget restored, new state:', false);
    } finally {
      setIsRestoringWidget(false);
    }
  }, [handleShowDonationsSavingsWidget]);

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setShowModeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add click outside handler for currency menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add click outside handler for date menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node)) {
        setShowDateMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add click outside handler for export menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle status handler
  type DonationRecord = {
    id: string;
    status: string;
    [key: string]: any;
  };
  const handleToggleStatus = async (record: DonationRecord) => {
    // Disable status toggle for manual donations
    if (!record.transaction_id) {
      toast.error('Cannot change status for manual donations');
      return;
    }
    
    const newStatus = record.status === 'donated' ? 'pending' : 'donated';
    // Optimistically update UI
    if (typeof setDonationSavingRecords === 'function') {
      setDonationSavingRecords(prev =>
        prev.map(r =>
          r.id === record.id ? { ...r, status: newStatus } : r
        )
      );
    } else if (Array.isArray(donationSavingRecords)) {
      // If using Zustand or similar, update via the store if possible
      if (typeof useFinanceStore.getState === 'function' && typeof useFinanceStore.setState === 'function') {
        useFinanceStore.setState({
          donationSavingRecords: donationSavingRecords.map(r =>
            r.id === record.id ? { ...r, status: newStatus } : r
          )
        });
      }
    }
    // Update in DB
    await supabase
      .from('donation_saving_records')
      .update({ status: newStatus })
      .eq('id', record.id);
    // Optionally: re-fetch in the background for consistency
    // fetchDonationSavingRecords();
  };

  const handleDeleteDonation = async (recordId: string) => {
    try {
      const result = await deleteDonationSavingRecord(recordId);
      if (result.success) {
        toast.success('Manual donation deleted successfully');
        setDeleteConfirmId(null);
      } else {
        toast.error(result.error || 'Failed to delete donation');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete donation');
    }
  };

  // Currency symbol map
  const currencySymbols: Record<string, string> = {
    USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', ALL: 'L', INR: '₹', CAD: '$', AUD: '$'
  };

  // Filter records by selected currency
  const filteredCurrencyRecords = filterCurrency
    ? donationSavingRecords.filter(record => {
        // For manual donations (no transaction_id), check currency from note
        if (!record.transaction_id) {
          const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
          const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
          return manualCurrency === filterCurrency;
        }
        
        // For regular donations, check currency from linked transaction
        const transaction = transactions.find(t => t.id === record.transaction_id);
        const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
        return account && account.currency === filterCurrency;
      })
    : donationSavingRecords; // Show all records when no currency filter is applied

  // Date filtering logic
  const getDateRangeFilter = () => {
    const now = new Date();
    const monthsAgo = new Date();
    
    switch (filterDateRange) {
      case '1month':
        monthsAgo.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        monthsAgo.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        monthsAgo.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        monthsAgo.setFullYear(now.getFullYear() - 1);
        break;
      case 'allTime':
        // For all time, set a very old date to include all records
        monthsAgo.setFullYear(1900);
        break;
      default:
        monthsAgo.setMonth(now.getMonth() - 1);
    }
    
    return { startDate: monthsAgo, endDate: now };
  };

  // Filter records by date range
  const { startDate, endDate } = getDateRangeFilter();
  const filteredByDateRecords = filteredCurrencyRecords.filter(record => {
    const recordDate = new Date(record.created_at);
    return recordDate >= startDate && recordDate <= endDate;
  });

  // Sort records: pending first, then by date (newest first)
  const sortedRecords = [...filteredByDateRecords].sort((a, b) => {
    // First priority: pending records come first
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    
    // Second priority: by date (newest first)
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  // Only sum donated records for analytics (filtered by currency and date)
  const donatedRecords = sortedRecords.filter(r => r.status === 'donated');
  const pendingRecords = sortedRecords.filter(r => r.status === 'pending');
  
  const analytics = {
    total_donated: donatedRecords.reduce((sum, r) => sum + (r.amount || 0), 0),
    top_month: (() => {
      // Calculate top month from filtered records
      const monthlyTotals: Record<string, number> = {};
      
      donatedRecords.forEach(record => {
        const monthKey = format(new Date(record.created_at), 'yyyy-MM');
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (record.amount || 0);
      });
      
      const topMonth = Object.entries(monthlyTotals)
        .sort(([, a], [, b]) => b - a)[0];
      
      return topMonth ? topMonth[0] : null;
    })(),
  };

  const filteredRecords = React.useMemo(() => {
    // If a record is selected via deep link, prioritize showing only that record
    if (hasSelection && isFromSearch && selectedRecord) {
      return [selectedRecord];
    }

    const filtered = sortedRecords.filter(record => {
      const displayTransactionId = transactions.find(t => t.id === record.transaction_id)?.transaction_id || '';
      const manualTransactionId = record.custom_transaction_id || '';
      const matchesSearch = searchTerm === '' || 
        (record.note?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((record.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
        (displayTransactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (`#${displayTransactionId}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (manualTransactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (`#${manualTransactionId}`.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMode = filterMode === 'all' || record.mode === filterMode;
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      
      return matchesSearch && matchesMode && matchesStatus;
    });
    
    return sortData(filtered);
  }, [sortedRecords, searchTerm, filterMode, filterStatus, sortConfig, transactions, hasSelection, isFromSearch, selectedRecord]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };


  const getModeBadge = (mode: 'fixed' | 'percent', modeValue?: number, currency?: string) => {
    if (mode === 'percent') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">{typeof modeValue === 'number' ? `${modeValue}%` : '%'}</span>
      );
    }
    // For fixed, show the amount with currency symbol if available
    const symbol = currency ? (currencySymbols[currency] || currency) : '';
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">{typeof modeValue === 'number' ? `${symbol}${modeValue}` : 'Fixed'}</span>
    );
  };

  const exportData = async (exportFormat: 'csv' | 'pdf' = 'csv') => {
    const data = filteredRecords.map(record => ({
      Date: formatDate(record.created_at),
      Type: record.type,
      Amount: formatCurrency(record.amount),
      Mode: record.mode,
      Transaction: record.transaction_id,
      Note: record.note || '-'
    }));

    if (exportFormat === 'csv') {
      const csvContent = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      // Check if we're in a Capacitor app (Android/iOS)
      const isCapacitor = !!(window as any).Capacitor;
      
      if (isCapacitor) {
        // For Android/iOS apps, open in system browser for download
        try {
          const capacitorBrowser = (window as any).Capacitor?.Plugins?.Browser;
          
          if (capacitorBrowser && typeof capacitorBrowser.open === 'function') {
            // Use Capacitor Browser plugin to open in system browser
            await capacitorBrowser.open({ url });
            toast.success('CSV opened in browser for download');
          } else {
            // For Android WebView, open in system browser using window.open
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            if (newWindow) {
              toast.info('CSV opened in browser. Use browser menu to download.');
            } else {
              throw new Error('Unable to open CSV in browser');
            }
          }
        } catch (capacitorError) {
          console.error('Capacitor CSV export error:', capacitorError);
          // Fallback to regular download
          const link = document.createElement('a');
          link.href = url;
          link.download = `donations-savings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('CSV exported successfully!');
        }
      } else {
        // For regular browsers, use standard download
        const link = document.createElement('a');
        link.href = url;
        link.download = `donations-savings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported successfully!');
      }
    } else if (exportFormat === 'pdf') {
      await exportToPDF(data);
    }
  };

  const exportToPDF = async (data: any[]) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Donations & Savings Report', 14, 22);
      
      // Add export metadata
      let yPosition = 30;
      doc.setFontSize(10);
      doc.text(`Exported: ${new Date().toLocaleString()}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Records: ${data.length}`, 14, yPosition);
      
      // Add filter information if filters are active
      const hasActiveFilters = searchTerm || filterMode !== 'all' || filterStatus !== 'all' || filterCurrency || filterDateRange !== '1month';
      if (hasActiveFilters) {
        yPosition += 6;
        doc.text('Applied Filters:', 14, yPosition);
        yPosition += 6;
        
        if (searchTerm) {
          doc.text(`• Search: "${searchTerm}"`, 20, yPosition);
          yPosition += 5;
        }
        if (filterMode !== 'all') {
          doc.text(`• Mode: ${filterMode}`, 20, yPosition);
          yPosition += 5;
        }
        if (filterStatus !== 'all') {
          doc.text(`• Status: ${filterStatus}`, 20, yPosition);
          yPosition += 5;
        }
        if (filterCurrency) {
          doc.text(`• Currency: ${filterCurrency}`, 20, yPosition);
          yPosition += 5;
        }
        if (filterDateRange !== '1month') {
          doc.text(`• Date Range: ${filterDateRange}`, 20, yPosition);
          yPosition += 5;
        }
        
        yPosition += 10;
      }
      
      // Add financial summary
      const totalDonations = data.filter(d => d.Type === 'donation').length;
      const totalSavings = data.filter(d => d.Type === 'saving').length;
      const totalAmount = data.reduce((sum, record) => {
        const amount = parseFloat(record.Amount.replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.text('Summary:', 14, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.text(`Total Donations: ${totalDonations}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Total Savings: ${totalSavings}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, yPosition);
      yPosition += 10;
      
      // Prepare table data
      const headers = [['Date', 'Type', 'Amount', 'Mode', 'Transaction', 'Note']];
      const rows = data.map(record => [
        record.Date,
        record.Type,
        record.Amount,
        record.Mode,
        record.Transaction,
        record.Note
      ]);
      
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: yPosition,
        margin: { top: yPosition },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      const filename = `donations-savings-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      // Check if we're in a Capacitor app (Android/iOS)
      const isCapacitor = !!(window as any).Capacitor;
      
      if (isCapacitor) {
        // For Android/iOS apps, use system browser for downloads
        try {
          // Generate PDF as blob
          const pdfBlob = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          // Check if Capacitor Browser is available
          const capacitorBrowser = (window as any).Capacitor?.Plugins?.Browser;
          
          if (capacitorBrowser && typeof capacitorBrowser.open === 'function') {
            // Use Capacitor Browser plugin to open in system browser
            await capacitorBrowser.open({ url: pdfUrl });
            toast.success('PDF opened in browser for download');
          } else {
            // For Android WebView, open in system browser using window.open
            const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
            if (newWindow) {
              toast.info('PDF opened in browser. Use browser menu to download.');
            } else {
              throw new Error('Unable to open PDF in browser');
            }
          }
        } catch (capacitorError) {
          console.error('Capacitor PDF export error:', capacitorError);
          // Fallback to regular download
          doc.save(filename);
          toast.success('PDF exported successfully!');
        }
      } else {
        // For regular browsers, use standard download
        doc.save(filename);
        toast.success('PDF exported successfully!');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  // Add a helper function at the top of the component
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Mobile filter functionality
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters({
        searchTerm,
        filterMode,
        filterStatus,
        filterCurrency,
        filterDateRange
      });
    }
  }, [showMobileFilterMenu, searchTerm, filterMode, filterStatus, filterCurrency, filterDateRange]);

  const handleCloseModal = () => {
    setTempFilters({
      searchTerm: '',
      filterMode: 'all',
      filterStatus: 'all',
      filterCurrency: '',
      filterDateRange: '1month'
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

  const handleCopyTransactionId = (transactionId: string) => {
    if (!transactionId) return;
    navigator.clipboard.writeText(transactionId);
    toast.success('Transaction ID copied to clipboard');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Smooth skeleton for donations page */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
          {/* Filters skeleton */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <DonationFiltersSkeleton />
          </div>
          
          {/* Summary cards skeleton */}
          <div className="p-4">
            <DonationSummaryCardsSkeleton />
          </div>
          
          {/* Responsive skeleton - Desktop table, Mobile cards */}
          <div className="hidden md:block p-4">
            <DonationTableSkeleton rows={6} />
          </div>
          <div className="md:hidden">
            <DonationCardSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }

  const currencySymbol = filterCurrency ? (currencySymbols[filterCurrency] || filterCurrency) : '';

  return (
    <div className="dark:bg-gray-900">

      {/* Unified Table View */}
      <div className="space-y-6">

        {/* Unified Filters and Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
          {/* Filters Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full" style={{ marginBottom: 0 }}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div>
                  <div className="relative">
                    <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${searchTerm ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors ${
                        searchTerm 
                          ? 'border-blue-300 dark:border-blue-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={searchTerm ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                      placeholder="Search by transaction ID or note..."
                    />
                  </div>
                </div>

                {/* Selection Filter */}
                {hasSelection && selectedRecord && (
                  <SelectionFilter
                    label="Selected"
                    value={selectedRecord.type === 'donation' ? 'Donation' : 'Saving'}
                    onClear={clearSelection}
                  />
                )}

                {/* Mobile Filter and Export Buttons */}
                <div className="md:hidden flex items-center gap-2">
                  <button
                    onClick={() => setShowMobileFilterMenu(true)}
                    className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                      (filterMode !== 'all' || filterStatus !== 'all' || filterCurrency || filterDateRange !== '1month')
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={(filterMode !== 'all' || filterStatus !== 'all' || filterCurrency || filterDateRange !== '1month') ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    title="Filters"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                  {isDonationsSavingsWidgetHidden && (
                    <button
                      onClick={handleShowDonationsSavingsWidgetFromPage}
                      disabled={isRestoringWidget}
                      className="px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
                      title="Show Donations & Savings Widget on Dashboard"
                      aria-label="Show Donations & Savings Widget on Dashboard"
                    >
                      {isRestoringWidget ? (
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  )}
                  <div className="relative hidden md:block" ref={exportMenuRef}>
                    <button
                      onClick={() => {
                        if (isAndroidApp) {
                          setShowAndroidDownloadModal(true);
                        } else {
                          setShowExportMenu(!showExportMenu);
                        }
                      }}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-2 py-1.5 h-8 w-8 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                      title="Export"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {showExportMenu && !isAndroidApp && (
                      <div className="absolute right-0 top-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[120px]">
                        <button
                          onClick={() => {
                            exportData('csv');
                            setShowExportMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          CSV
                        </button>
                        <button
                          onClick={() => {
                            exportData('pdf');
                            setShowExportMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowManualDonationModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1.5 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center text-[13px] h-8 w-8 shadow-sm hover:shadow-md"
                    title="Quick Donate"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Currency Filter */}
                <div className="relative hidden md:block" ref={currencyMenuRef}>
                  <button
                    onClick={() => setShowCurrencyMenu(v => !v)}
                    className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                      filterCurrency 
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={filterCurrency ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  >
                    <span>{filterCurrency === '' ? (recordCurrencies.length > 0 ? 'All Currencies' : 'No Currencies') : filterCurrency}</span>
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCurrencyMenu && (
                    <div className="absolute left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {recordCurrencies.map(currency => (
                        <button
                          key={currency}
                          onClick={() => { setFilterCurrency(currency); setShowCurrencyMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterCurrency === currency ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                        >
                          {currency}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mode Filter */}
                <div className="relative hidden md:block" ref={modeMenuRef}>
                  <button
                    onClick={() => setShowModeMenu(v => !v)}
                    className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                      filterMode !== 'all' 
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={filterMode !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  >
                    <span>{capitalize(filterMode === 'all' ? 'All Modes' : filterMode)}</span>
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showModeMenu && (
                    <div className="absolute left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => { setFilterMode('all'); setShowModeMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterMode === 'all' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        All Modes
                      </button>
                      <button
                        onClick={() => { setFilterMode('fixed'); setShowModeMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterMode === 'fixed' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        Fixed
                      </button>
                      <button
                        onClick={() => { setFilterMode('percent'); setShowModeMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterMode === 'percent' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        Percentage
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="relative hidden md:block" ref={statusMenuRef}>
                  <button
                    onClick={() => setShowStatusMenu(v => !v)}
                    className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                      filterStatus !== 'all' 
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={filterStatus !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  >
                    <span>{capitalize(filterStatus === 'all' ? 'All Status' : filterStatus)}</span>
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStatusMenu && (
                    <div className="absolute left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => { setFilterStatus('all'); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterStatus === 'all' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        All Status
                      </button>
                      <button
                        onClick={() => { setFilterStatus('donated'); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterStatus === 'donated' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        Donated
                      </button>
                      <button
                        onClick={() => { setFilterStatus('pending'); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterStatus === 'pending' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        Pending
                      </button>
                    </div>
                  )}
                </div>

                {/* Date Filter */}
                <div className="relative hidden md:block" ref={dateMenuRef}>
                  <button
                    onClick={() => setShowDateMenu(v => !v)}
                    className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                      filterDateRange 
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={filterDateRange ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  >
                                        <span>{filterDateRange === '1month' ? '1 Month' :
                          filterDateRange === '3months' ? '3 Months' :
                          filterDateRange === '6months' ? '6 Months' :
                          filterDateRange === '1year' ? '1 Year' :
                          filterDateRange === 'allTime' ? 'All Time' : '1 Month'}</span>
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDateMenu && (
                    <div className="absolute left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => { setFilterDateRange('1month'); setShowDateMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterDateRange === '1month' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        1 Month
                      </button>
                      <button
                        onClick={() => { setFilterDateRange('3months'); setShowDateMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterDateRange === '3months' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        3 Months
                      </button>
                      <button
                        onClick={() => { setFilterDateRange('6months'); setShowDateMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterDateRange === '6months' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        6 Months
                      </button>
                      <button
                        onClick={() => { setFilterDateRange('1year'); setShowDateMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterDateRange === '1year' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        1 Year
                      </button>
                      <button
                        onClick={() => { setFilterDateRange('allTime'); setShowDateMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 ${filterDateRange === 'allTime' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        All Time
                      </button>
                    </div>
                  )}
                </div>

                {/* Clear Filters */}
                {(searchTerm || filterMode !== 'all' || filterStatus !== 'all' || filterDateRange !== '1month') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterMode('all');
                      setFilterStatus('all');
                      setFilterDateRange('1month');
                    }}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
        </div>
            <div className="flex-grow" />
            {/* Action Buttons in filter row */}
            <div className="hidden md:flex items-center gap-2">
              {isDonationsSavingsWidgetHidden && (
                <button
                  onClick={handleShowDonationsSavingsWidgetFromPage}
                  disabled={isRestoringWidget}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Show Donations & Savings Widget on Dashboard"
                  aria-label="Show Donations & Savings Widget on Dashboard"
                >
                  {isRestoringWidget ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => {
                    if (isAndroidApp) {
                      setShowAndroidDownloadModal(true);
                    } else {
                      setShowExportMenu(!showExportMenu);
                    }
                  }}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                  aria-label="Export"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {showExportMenu && !isAndroidApp && (
                  <div className="absolute right-0 top-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[120px]">
                    <button
                      onClick={() => {
                        exportData('csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={() => {
                        exportData('pdf');
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowManualDonationModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 h-8 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-1.5 text-[13px] shadow-sm hover:shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Donate</span>
              </button>
            </div>
            </div>
      </div>

          {/* Summary Cards - Matching Account Page Style */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-3">
            {/* Total Donated Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Donated</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {currencySymbol}{analytics.total_donated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    {donatedRecords.length} donations
                  </p>
                  </div>
                <Heart className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
              </div>
            </div>

            {/* Total Pending Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Pending</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {currencySymbol}{pendingRecords.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    {pendingRecords.length} pending
                  </p>
                  </div>
                <Clock className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
              </div>
            </div>

            {/* Top Month Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Top Month</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {analytics.top_month ? format(new Date(analytics.top_month + '-01'), 'MMM yyyy') : '-'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    Best performance
                  </p>
                  </div>
                <TrendingUp className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
              </div>
            </div>

            {/* Impact Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Impact</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {Math.floor(donatedRecords.length * 2.5)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    people helped
                  </p>
                  </div>
                <Star className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
              </div>
            </div>

            {/* Hidden placeholder to maintain 5-grid layout */}
            <div className="hidden">
            </div>
          </div>



          {/* Recent Activity Timeline - Hidden */}
          {/* <div className="p-3">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-lg border border-slate-200/50 dark:border-slate-600/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Activity</h3>
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(() => {
                  // Get recent 5 activities (donations and savings)
                  const recentActivities = [...donatedRecords, ...pendingRecords]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5);
                  
                  if (recentActivities.length === 0) {
                    return (
                      <div className="text-center py-4">
                        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">No recent activity</p>
                      </div>
                    );
                  }
                  
                  return recentActivities.map((activity, index) => {
                    const isDonated = activity.status === 'donated';
                    const isSaving = activity.type === 'saving';
                    
                    return (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${
                          isDonated 
                            ? 'bg-green-500' 
                            : isSaving 
                              ? 'bg-blue-500' 
                              : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                              {isSaving ? 'Savings Goal' : 'Donation'} - {activity.note?.replace(/\(?Currency:\s*[A-Z]{3}\)?/g, '').trim() || 'No description'}
                            </p>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                              {format(new Date(activity.created_at), 'MMM dd')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-sm font-semibold ${
                              isDonated 
                                ? 'text-green-600 dark:text-green-400' 
                                : isSaving 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {currencySymbol}{activity.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isDonated 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                : isSaving 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {isDonated ? 'Completed' : isSaving ? 'Active' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div> */}
          
          {/* Desktop Table View */}
          <div className="hidden xl:block overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 text-[14px]">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {getSortIcon('date')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSort('original_amount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Original Amount</span>
                        {getSortIcon('original_amount')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSort('donation_amount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Donation Amount</span>
                        {getSortIcon('donation_amount')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSort('mode')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Mode</span>
                        {getSortIcon('mode')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        Transaction
                        <Tooltip content={
                          <>This is the reference ID generated for each transaction. You can use it to cross-reference with the main Transactions page.</>
                        }>
                          <span tabIndex={0} className="inline-flex items-center">
                        <HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </span>
                        </Tooltip>
                      </span>
                    </th>
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                </tr>
              </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRecords.length === 0 ? (
                  <tr>
                      <td colSpan={7} className="py-16 text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <Heart className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No donation records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Start tracking your donations and savings by adding your first record
                    </p>
                  </td>
                  </tr>
                ) : (
                    filteredRecords.map((record) => {
                    const transaction = transactions.find(t => t.id === record.transaction_id);
                    const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
                    
                    // For manual donations, extract currency from note
                    let currency = 'USD';
                    if (!record.transaction_id) {
                      const currencyMatch = record.note?.match(/Currency:\s*([A-Z]{3})/);
                      currency = currencyMatch ? currencyMatch[1] : 'USD';
                    } else {
                      currency = account ? account.currency : 'USD';
                    }
                    
                    const isSelected = selectedId === record.id;
                    const isFromSearchSelection = isFromSearch && isSelected;
                    
                    return (
                        <tr 
                          key={record.id} 
                          ref={isSelected ? selectedRecordRef : null}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            isSelected 
                              ? isFromSearchSelection 
                                ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                                : 'ring-2 ring-blue-500 ring-opacity-50'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(record.created_at)}
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {transaction ? `${currencySymbols[currency] || currency}${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                              record.note ? 
                                <span title={record.note.replace(/\(?Currency:\s*[A-Z]{3}\)?/, '').trim()}>
                                  {(record.note.replace(/\(?Currency:\s*[A-Z]{3}\)?/, '').trim() || 'Manual Donation').substring(0, 30)}
                                  {(record.note.replace(/\(?Currency:\s*[A-Z]{3}\)?/, '').trim() || 'Manual Donation').length > 30 ? '...' : ''}
                                </span>
                                : 'Manual Donation'
                            }
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {`${currencySymbols[currency] || currency}${record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!record.transaction_id ? '-' : getModeBadge(record.mode, record.mode_value, currency)}
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {transaction ? (
                              <span className="inline-flex items-center gap-1">
                                #{transaction.transaction_id}
                                <button
                                  type="button"
                                  onClick={() => transaction.transaction_id && handleCopyTransactionId(transaction.transaction_id)}
                                  className="ml-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                                  title="Copy transaction ID"
                                  aria-label="Copy transaction ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </span>
                            ) : record.custom_transaction_id ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-blue-600 dark:text-blue-400">#{record.custom_transaction_id}</span>
                                <button
                                  type="button"
                                  onClick={() => record.custom_transaction_id && handleCopyTransactionId(record.custom_transaction_id)}
                                  className="ml-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                                  title="Copy manual donation ID"
                                  aria-label="Copy manual donation ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {!record.transaction_id ? (
                              // Manual donations - show static status
                              <span
                                className={
                                  record.status === 'donated'
                                    ? "inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-xs"
                                    : "inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-semibold text-xs"
                                }
                              >
                                {record.status === 'donated' ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                                    Donated
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                                    Pending
                                  </>
                                )}
                              </span>
                            ) : (
                              // Regular donations - show clickable button
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(record)}
                                className={
                                  record.status === 'donated'
                                    ? "inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-xs hover:bg-green-100 dark:hover:bg-green-900/50 transition"
                                    : "inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-semibold text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition"
                                }
                                aria-label={record.status === 'donated' ? "Mark as Pending" : "Mark as Donated"}
                                title={record.status === 'donated' ? "Mark as Pending" : "Mark as Donated"}
                              >
                                {record.status === 'donated' ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                                    Donated
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                                    Pending
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {record.transaction_id && (
                                <Tooltip content="Transaction-linked donation info" placement="top">
                                  <button
                                    onClick={() => setShowDonationInfo(true)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                    aria-label="Transaction-linked donation info"
                                  >
                                    <Info className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                              )}
                              {!record.transaction_id && (
                                <Tooltip content="Delete manual donation" placement="top">
                                  <button
                                    onClick={() => {
                                      setDonationToDelete(record);
                                      setShowDeleteModal(true);
                                    }}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                              )}
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

          {/* Tablet Stacked Table View */}
          <div className="hidden lg:block xl:hidden max-h-[500px] overflow-y-auto">
            <div className="space-y-4 px-2.5">
              {filteredRecords.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No donation records found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Start tracking your donations and savings by adding your first record
                  </p>
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const transaction = transactions.find(t => t.id === record.transaction_id);
                  const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
                  
                  // For manual donations, extract currency from note
                  let currency = 'USD';
                  if (!record.transaction_id) {
                    const currencyMatch = record.note?.match(/Currency:\s*([A-Z]{3})/);
                    currency = currencyMatch ? currencyMatch[1] : 'USD';
                  } else {
                    currency = account ? account.currency : 'USD';
                  }
                  
                  return (
                    <div key={record.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Row 1: Date, Original Amount, Donation Amount */}
                      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(record.created_at)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original Amount</div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {transaction ? `${currencySymbols[currency] || currency}${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                              record.note ? 
                                <span title={record.note.replace(/\(?Currency:\s*[A-Z]{3}\)?/, '').trim()}>
                                  {(record.note.replace(/\(?Currency:\s*[A-Z]{3}\)?/, '').trim() || 'Manual Donation').substring(0, 25)}
                                  {(record.note.replace(/\(?Currency:\s*[A-Z]{3}\)?/, '').trim() || 'Manual Donation').length > 25 ? '...' : ''}
                                </span>
                                : 'Manual Donation'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Donation Amount</div>
                          <div className="text-sm font-bold text-green-600 dark:text-green-400">
                            {`${currencySymbols[currency] || currency}${record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Mode, Transaction ID, Status */}
                      <div className="grid grid-cols-3 gap-4 p-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mode</div>
                          <div>{!record.transaction_id ? '-' : getModeBadge(record.mode, record.mode_value, currency)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transaction ID</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {transaction ? (
                              <span className="inline-flex items-center gap-1">
                                #{transaction.transaction_id}
                                <button
                                  type="button"
                                  onClick={() => transaction.transaction_id && handleCopyTransactionId(transaction.transaction_id)}
                                  className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                                  title="Copy transaction ID"
                                  aria-label="Copy transaction ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </span>
                            ) : record.custom_transaction_id ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-blue-600 dark:text-blue-400">#{record.custom_transaction_id}</span>
                                <button
                                  type="button"
                                  onClick={() => record.custom_transaction_id && handleCopyTransactionId(record.custom_transaction_id)}
                                  className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                                  title="Copy manual donation ID"
                                  aria-label="Copy manual donation ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </span>
                            ) : (
                              '-'
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
                          {!record.transaction_id ? (
                            // Manual donations - show static status
                            <span
                              className={
                                record.status === 'donated'
                                  ? "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-xs"
                                  : "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-semibold text-xs"
                              }
                            >
                              {record.status === 'donated' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-green-500 dark:text-green-400" />
                                  Donated
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                                  Pending
                                </>
                              )}
                            </span>
                          ) : (
                            // Regular donations - show clickable button
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(record)}
                              className={
                                record.status === 'donated'
                                  ? "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-xs hover:bg-green-100 dark:hover:bg-green-900/50 transition"
                                  : "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-semibold text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition"
                              }
                              aria-label={record.status === 'donated' ? "Mark as Pending" : "Mark as Donated"}
                              title={record.status === 'donated' ? "Mark as Pending" : "Mark as Donated"}
                            >
                              {record.status === 'donated' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-green-500 dark:text-green-400" />
                                  Donated
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                                  Pending
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete Button for Manual Donations */}
                      {!record.transaction_id && (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-end">
                            <Tooltip content="Delete manual donation" placement="top">
                              <button
                                onClick={() => {
                                  setDonationToDelete(record);
                                  setShowDeleteModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      )}
                      
                      {/* Info Button for Transaction-linked Donations */}
                      {record.transaction_id && (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-end">
                            <Tooltip content="Transaction-linked donation info" placement="top">
                              <button
                                onClick={() => setShowDonationInfo(true)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                              >
                                <Info className="w-4 h-4 mr-1" />
                                Info
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 px-2.5">
            {filteredRecords.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No donation records found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start tracking your donations and savings by adding your first record
                </p>
              </div>
            ) : (
              filteredRecords.map((record) => {
                const transaction = transactions.find(t => t.id === record.transaction_id);
                const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
                
                // For manual donations, extract currency from note
                let currency = 'USD';
                if (!record.transaction_id) {
                  const currencyMatch = record.note?.match(/Currency:\s*([A-Z]{3})/);
                  currency = currencyMatch ? currencyMatch[1] : 'USD';
                } else {
                  currency = account ? account.currency : 'USD';
                }
                
                return (
                  <div 
                    key={record.id}
                    id={`donation-${record.id}`}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    role="article"
                    aria-labelledby={`donation-${record.id}`}
                  >
                    {/* Card Header - Item Name and Date */}
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex-1">
                        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">
                          {record.mode === 'fixed' ? 'Fixed' : 'Percentage'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(record.created_at)}
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center justify-center text-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'donated'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {record.status === 'donated' ? 'Donated' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Card Body - Amount and Details */}
                    <div className="px-4 pb-3">
                      <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {`${currencySymbols[currency] || currency}${record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {transaction ? `#${transaction.transaction_id}` : record.custom_transaction_id ? `#${record.custom_transaction_id}` : 'Manual Donation'}
                      </div>
                      {!record.transaction_id && record.note && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                          Note: {record.note}
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {!record.transaction_id && (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            role="status"
                            aria-label="Manual donation"
                          >
                            Manual
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {record.transaction_id && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(record)}
                              className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                              title={record.status === 'donated' ? "Mark as Pending" : "Mark as Donated"}
                              aria-label={record.status === 'donated' ? "Mark as Pending" : "Mark as Donated"}
                            >
                              {record.status === 'donated' ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <Tooltip content="Transaction-linked donation info" placement="top">
                              <button
                                onClick={() => setShowDonationInfo(true)}
                                className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                                aria-label="Transaction-linked donation info"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </>
                        )}
                        {!record.transaction_id && (
                          <Tooltip content="Delete manual donation" placement="top">
                            <button
                              onClick={() => {
                                setDonationToDelete(record);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              aria-label="Delete manual donation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilterMenu && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header with Check and Cross */}
            <div className="bg-white dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Filters</span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Select filters and click ✓ to apply</div>
                </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchTerm(tempFilters.searchTerm);
                    setFilterMode(tempFilters.filterMode);
                    setFilterStatus(tempFilters.filterStatus);
                    setFilterCurrency(tempFilters.filterCurrency);
                    setFilterDateRange(tempFilters.filterDateRange);
                    setShowMobileFilterMenu(false);
                  }}
                  className={`p-1 transition-colors ${
                    (tempFilters.filterMode !== 'all' || tempFilters.filterStatus !== 'all' || tempFilters.filterCurrency || tempFilters.filterDateRange !== '1month')
                      ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  title="Apply Filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterMode('all');
                    setFilterStatus('all');
                    setFilterCurrency('');
                    setFilterDateRange('1month');
                    setShowMobileFilterMenu(false);
                  }}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                  title="Clear All Filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Currency Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Currency</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterCurrency: '' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterCurrency === ''
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Currencies
                  </button>
                  {recordCurrencies.map(currency => (
                    <button
                      key={currency}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, filterCurrency: currency });
                      }}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        tempFilters.filterCurrency === currency
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                          : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>

            {/* Mode Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Mode</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterMode: 'all' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterMode === 'all'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Modes
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterMode: 'fixed' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterMode === 'fixed'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Fixed
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterMode: 'percent' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterMode === 'percent'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Percentage
                  </button>
                </div>
              </div>

            {/* Status Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterStatus: 'all' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterStatus === 'all'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterStatus: 'donated' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterStatus === 'donated'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Donated
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterStatus: 'pending' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterStatus === 'pending'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>

            {/* Date Range Filter */}
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Date Range</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterDateRange: '1month' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterDateRange === '1month'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    1 Month
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterDateRange: '3months' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterDateRange === '3months'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    3 Months
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterDateRange: '6months' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterDateRange === '6months'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    6 Months
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterDateRange: '1year' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterDateRange === '1year'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    1 Year
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, filterDateRange: 'allTime' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.filterDateRange === 'allTime'
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Donation Modal */}
      <ManualDonationModal 
        isOpen={showManualDonationModal} 
        onClose={() => setShowManualDonationModal(false)} 
      />

      {/* Android Download Modal */}
      {showAndroidDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Download Not Available
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  File downloads are not supported in the Android app due to security restrictions.
                </p>
                
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    💡 Alternative Solutions:
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <li>• Open Balanze in your web browser</li>
                    <li>• Use the web version for downloads</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex">
                <button
                  onClick={() => setShowAndroidDownloadModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Donation Info Modal */}
      <DonationInfoModal
        isOpen={showDonationInfo}
        onClose={() => setShowDonationInfo(false)}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!donationToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (donationToDelete) await handleDeleteDonation(donationToDelete.id);
          setShowDeleteModal(false);
          setDonationToDelete(null);
        }}
        title="Delete Manual Donation"
        message={`Are you sure you want to delete this manual donation? This action cannot be undone.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-red-800 dark:text-red-300">Donation Details:</span>
            </div>
            <div className="text-xs sm:text-sm text-red-700 dark:text-red-300 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium min-w-[60px]">Amount:</span>
                <span>{donationToDelete?.amount ? `$${donationToDelete.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium min-w-[60px]">Mode:</span>
                <span className="capitalize">{donationToDelete?.mode || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium min-w-[60px]">Status:</span>
                <span className="capitalize">{donationToDelete?.status || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium min-w-[60px]">Date:</span>
                <span>{donationToDelete?.created_at ? formatDate(donationToDelete.created_at) : 'N/A'}</span>
              </div>
            </div>
          </>
        }
        confirmLabel="Delete Donation"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default DonationsSavingsPage;


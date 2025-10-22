import React, { useState, useEffect, useRef } from 'react';
import { Plus, Filter, Download, Search, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { Transaction } from '../../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useExport } from '../../hooks/useExport';
import { 
  TransactionTableSkeleton, 
  TransactionMobileSkeleton, 
  TransactionSummaryCardsSkeleton, 
  TransactionFiltersSkeleton 
} from '../Accounts/AccountSkeleton';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';

export const TransactionsView: React.FC = () => {
  const { transactions, accounts, categories, loading, error, globalSearchTerm, fetchTransactions, fetchCategories, fetchPurchaseCategories, purchaseCategories } = useFinanceStore();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  
  // Record selection functionality
  const {
    selectedRecord,
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: transactions,
    recordIdField: 'id',
    scrollToRecord: true
  });

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Hide export menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch data when component mounts
  useEffect(() => {
    // Fetch transactions on mount
    fetchTransactions();
    // Only fetch if data is missing
    if (categories.length === 0) {
      fetchCategories();
    }
    if (purchaseCategories.length === 0) {
      fetchPurchaseCategories();
    }
  }, [categories.length, purchaseCategories.length, fetchCategories, fetchPurchaseCategories, fetchTransactions]);


  // Filter transactions
  const filteredTransactions: Transaction[] = transactions.filter(transaction => {
    const matchesSearch = (transaction.description?.toLowerCase() || '').includes(globalSearchTerm.toLowerCase()) ||
                         (transaction.category?.toLowerCase() || '').includes(globalSearchTerm.toLowerCase()) ||
                         (transaction.tags || []).some(tag => (tag?.toLowerCase() || '').includes(globalSearchTerm.toLowerCase()));
    
    const isTransfer = transaction.tags?.includes('transfer');
    const matchesType = filterType === 'all' || (!isTransfer && transaction.type === filterType);
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesAccount = filterAccount === 'all' || transaction.account_id === filterAccount;


    return matchesSearch && matchesType && matchesCategory && matchesAccount && !isTransfer;
  });

  // Export functionality using shared hook
  const { isExporting, exportFormat, exportToCSV, exportToPDF, exportToHTML } = useExport({
    transactions: filteredTransactions,
    accounts,
    filters: {
      search: globalSearchTerm,
      type: filterType,
      account: filterAccount,
      currency: '',
      dateRange: { start: '', end: '' },
      showModifiedOnly: false,
      recentlyModifiedDays: 7
    }
  });

  // Use a generic formatCurrency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Export handlers with loading states
  const handleExportCSV = async () => {
    await exportToCSV();
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    await exportToPDF();
    setShowExportMenu(false);
  };

  const handleExportHTML = async () => {
    await exportToHTML();
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Smooth skeleton for transactions page */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden pb-[13px] lg:pb-0">
          {/* Filters skeleton */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <TransactionFiltersSkeleton />
          </div>
          
          {/* Summary cards skeleton */}
          <div className="p-4">
            <TransactionSummaryCardsSkeleton />
          </div>
          
          {/* Responsive skeleton - Desktop table, Mobile cards */}
          <div className="hidden md:block p-4">
            <TransactionTableSkeleton rows={6} />
          </div>
          <div className="md:hidden">
            <TransactionMobileSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-[300px] flex items-center justify-center text-red-600 text-xl">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Transaction List */}
      <div>
        <TransactionList 
          transactions={transactions as any}
          selectedRecord={selectedRecord}
          selectedId={selectedId}
          isFromSearch={isFromSearch}
          hasSelection={hasSelection}
          selectedRecordRef={selectedRecordRef}
          clearSelection={clearSelection}
        />
      </div>
    </div>
  );
};


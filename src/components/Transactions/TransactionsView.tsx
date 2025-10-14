import React, { useState, useEffect, useRef } from 'react';
import { Plus, Filter, Download, Search, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { Transaction } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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

  // Use a generic formatCurrency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Export handlers
  const handleExportCSV = () => {
    // Simple CSV export
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    const csvData = filteredTransactions.map(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      return [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount,
        (transaction.tags || []).join('; ')
      ];
    });
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    // Real PDF export logic
    const doc = new jsPDF();
    const headers = [['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags']];
    const rows = filteredTransactions.map(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      return [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount,
        (transaction.tags || []).join('; ')
      ];
    });
    autoTable(doc, {
      head: headers,
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
    });
    doc.save(`transactions-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const handleExportHTML = () => {
    // Simple HTML export (stub)
    let html = '<table border="1"><thead><tr>';
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    html += headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    filteredTransactions.forEach(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      html += '<tr>' + [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount,
        (transaction.tags || []).join('; ')
      ].map(field => `<td>${field}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Smooth skeleton for transactions page */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ paddingBottom: '13px' }}>
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
        />
      </div>
    </div>
  );
};


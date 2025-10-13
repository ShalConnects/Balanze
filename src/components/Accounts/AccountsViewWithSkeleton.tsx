import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useLoadingContext } from '../../context/LoadingContext';
import { AccountsPageSkeleton, AccountFormSkeleton } from './AccountsPageSkeleton';
import { AccountFilters } from './AccountFilters';
import { AccountSummaryCards } from './AccountSummaryCards';
import { AccountTable } from './AccountTable';
import { AccountMobileView } from './AccountMobileView';
import { AccountForm } from './AccountForm';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export const AccountsViewWithSkeleton: React.FC = () => {
  const { 
    accounts, 
    transactions, 
    loading, 
    error, 
    fetchAccounts, 
    fetchTransactions,
    updateAccountPosition,
    showAccountForm,
    setShowAccountForm,
    selectedAccount,
    setSelectedAccount
  } = useFinanceStore();

  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Enhanced loading state management
  const { 
    isLoading: isPageLoading, 
    setLoadingMessage,
    startLoading,
    stopLoading,
    startFormLoading,
    stopFormLoading,
    isFormLoading,
    loadingMessage
  } = useLoadingContext();

  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    currency: 'all',
    type: 'all',
    status: 'all'
  });

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        startLoading('skeleton');
        setLoadingMessage('Loading accounts...');
        
        // Simulate some delay for better UX
        await Promise.all([
          fetchAccounts(),
          fetchTransactions()
        ]);
        
        setLoadingMessage('Accounts loaded successfully!');
      } catch (error) {
        console.error('Error loading accounts:', error);
        setLoadingMessage('Failed to load accounts');
      } finally {
        stopLoading();
      }
    };

    loadData();
  }, [fetchAccounts, fetchTransactions, startLoading, stopLoading, setLoadingMessage]);

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    try {
      startFormLoading();
      setLoadingMessage('Saving account...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Handle form submission logic here
      console.log('Form submitted:', formData);
      
      setShowAccountForm(false);
      setSelectedAccount(null);
    } catch (error) {
      console.error('Error saving account:', error);
      setLoadingMessage('Failed to save account');
    } finally {
      stopFormLoading();
    }
  };

  // Handle account actions
  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setShowAccountForm(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      startFormLoading();
      setLoadingMessage('Deleting account...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Handle delete logic here
      console.log('Account deleted:', accountId);
    } catch (error) {
      console.error('Error deleting account:', error);
      setLoadingMessage('Failed to delete account');
    } finally {
      stopFormLoading();
    }
  };

  const handleToggleRow = (accountId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(accountId)) {
      newExpandedRows.delete(accountId);
    } else {
      newExpandedRows.add(accountId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleReorderAccounts = async (draggedId: string, targetId: string) => {
    try {
      const draggedIndex = sortedAccounts.findIndex(acc => acc.id === draggedId);
      const targetIndex = sortedAccounts.findIndex(acc => acc.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Calculate new position for the dragged account
      const newPosition = targetIndex + 1; // Position after the target
      
      await updateAccountPosition(draggedId, newPosition);
    } catch (error) {
      console.error('Failed to reorder accounts:', error);
    }
  };

  // Show loading skeleton if page is loading
  if (isPageLoading) {
    return (
      <AccountsPageSkeleton 
        isMobile={isMobile}
        message={loadingMessage}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Accounts</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter accounts based on current filters
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         account.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCurrency = filters.currency === 'all' || account.currency === filters.currency;
    const matchesType = filters.type === 'all' || account.type === filters.type;
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && account.isActive) ||
                         (filters.status === 'inactive' && !account.isActive);
    
    return matchesSearch && matchesCurrency && matchesType && matchesStatus;
  });

  // Sort accounts if sort config is set
  const sortedAccounts = sortConfig ? [...filteredAccounts].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof typeof a];
    const bValue = b[sortConfig.key as keyof typeof b];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  }) : filteredAccounts;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your financial accounts and track your balances
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAccountForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <AccountFilters
        filters={filters}
        onFiltersChange={setFilters}
        accounts={accounts}
      />

      {/* Summary Cards Section */}
      <AccountSummaryCards
        accounts={sortedAccounts}
        transactions={transactions}
      />

      {/* Main Content Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {/* Content Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Accounts ({sortedAccounts.length})
              </h2>
              {sortedAccounts.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                  {sortedAccounts.filter(a => a.isActive).length} Active
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortConfig(prev => prev?.key === 'name' && prev.direction === 'asc' 
                  ? { key: 'name', direction: 'desc' } 
                  : { key: 'name', direction: 'asc' }
                )}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {sortedAccounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No accounts found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {filters.search || filters.currency !== 'all' || filters.type !== 'all' || filters.status !== 'all'
                  ? 'No accounts match your current filters'
                  : 'Get started by adding your first account'
                }
              </p>
              {!filters.search && filters.currency === 'all' && filters.type === 'all' && filters.status === 'all' && (
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Account
                </button>
              )}
            </div>
          ) : isMobile ? (
            <AccountMobileView
              accounts={sortedAccounts}
              transactions={transactions}
              onEditAccount={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onAddAccount={() => setShowAccountForm(true)}
              onShowInfo={(account) => console.log('Show info:', account)}
              onAddTransaction={(accountId) => console.log('Add transaction:', accountId)}
            />
          ) : (
            <AccountTable
              accounts={sortedAccounts}
              transactions={transactions}
              expandedRows={expandedRows}
              onToggleRow={handleToggleRow}
              onEditAccount={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onAddTransaction={(accountId) => console.log('Add transaction:', accountId)}
              onShowInfo={(account) => console.log('Show info:', account)}
              onUpdateAccount={async (accountId, updates) => {
                // This would need to be implemented based on your store methods
                console.log('Update account:', accountId, updates);
              }}
              onReorderAccounts={handleReorderAccounts}
              formatCurrency={(amount, currency) => {
                if (currency === 'BDT') {
                  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency,
                }).format(amount);
              }}
            />
          )}
        </div>
      </div>

      {/* Account Form Modal */}
      {showAccountForm && (
        <AccountForm
          isOpen={showAccountForm}
          onClose={() => {
            setShowAccountForm(false);
            setSelectedAccount(null);
          }}
          account={selectedAccount}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Form Loading Overlay */}
      {isFormLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 
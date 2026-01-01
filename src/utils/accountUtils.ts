import { Account, Transaction } from '../types';

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  BDT: '৳',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  ALL: 'L',
  INR: '₹',
  CAD: '$',
  AUD: '$'
};

// Account types
export const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'investment', 'cash', 'lend_borrow'] as const;

// Currency options - Note: 'ALL' is removed as it's not a real currency (only used for filters)
// For full currency list, import from utils/currencies.ts
export const CURRENCY_OPTIONS = ['USD', 'BDT', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CNY', 'CHF'] as const;

/**
 * Format currency amount with proper symbol
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  // Handle different currency formatting
  switch (currency) {
    case 'BDT':
    case 'INR':
      return `${symbol}${amount.toLocaleString('en-IN')}`;
    case 'EUR':
    case 'GBP':
      return `${symbol}${amount.toLocaleString('en-GB')}`;
    default:
      return `${symbol}${amount.toLocaleString('en-US')}`;
  }
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Filter accounts based on search criteria
 */
export const filterAccounts = (
  accounts: Account[],
  filters: {
    search: string;
    currency: string;
    type: string;
    status: string;
  }
): Account[] => {
  return accounts.filter(account => {
    // Search filter
    if (filters.search && !account.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Currency filter
    if (filters.currency && account.currency !== filters.currency) {
      return false;
    }
    
    // Type filter
    if (filters.type !== 'all' && account.type !== filters.type) {
      return false;
    }
    
    // Status filter
    if (filters.status === 'active' && !account.isActive) {
      return false;
    }
    
    return true;
  });
};

/**
 * Sort accounts by specified key
 */
export const sortAccounts = (
  accounts: Account[],
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null
): Account[] => {
  if (!sortConfig) return accounts;
  
  return [...accounts].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortConfig.key) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'type':
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
        break;
      case 'currency':
        aValue = a.currency.toLowerCase();
        bValue = b.currency.toLowerCase();
        break;
      case 'balance':
        aValue = a.calculated_balance;
        bValue = b.calculated_balance;
        break;
      case 'transactions':
        // This would need transactions data to be passed
        aValue = 0;
        bValue = 0;
        break;
      case 'dps':
        aValue = a.has_dps ? 1 : 0;
        bValue = b.has_dps ? 1 : 0;
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

/**
 * Calculate account statistics
 */
export const calculateAccountStats = (account: Account, transactions: Transaction[]) => {
  const accountTransactions = transactions.filter(t => t.account_id === account.id);
  const incomeTransactions = accountTransactions.filter(t => t.type === 'income');
  const expenseTransactions = accountTransactions.filter(t => t.type === 'expense');
  
  let totalSaved = 0;
  let totalDonated = 0;
  
  incomeTransactions.forEach(t => {
    if (t.category === 'Savings') {
      totalSaved += t.amount;
    } else if (t.category === 'Donation') {
      totalDonated += t.amount;
    }
  });
  
  return {
    totalTransactions: accountTransactions.length,
    incomeTransactions: incomeTransactions.length,
    expenseTransactions: expenseTransactions.length,
    totalSaved,
    totalDonated,
    lastTransactionDate: accountTransactions.length > 0 
      ? new Date(accountTransactions[accountTransactions.length - 1].date)
      : null
  };
};

/**
 * Get account type display name
 */
export const getAccountTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'cash':
      return 'Cash Wallet';
    case 'checking':
      return 'Checking';
    case 'savings':
      return 'Savings';
    case 'credit':
      return 'Credit';
    case 'investment':
      return 'Investment';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

/**
 * Validate account data
 */
export const validateAccount = (account: Partial<Account>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!account.name?.trim()) {
    errors.push('Account name is required');
  }
  
  if (account.initial_balance === undefined || account.initial_balance < 0) {
    errors.push('Initial balance must be a non-negative number');
  }
  
  if (!account.currency) {
    errors.push('Currency is required');
  }
  
  if (!account.type) {
    errors.push('Account type is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 


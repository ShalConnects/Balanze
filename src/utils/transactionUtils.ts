import { Transaction, Account } from '../types';

export const TRANSACTION_TYPES = ['income', 'expense'] as const;

export const COMMON_CATEGORIES = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'],
    expense: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other']
};

export const filterTransactions = (
    transactions: Transaction[],
    filters: {
        search: string;
        type: string;
        category: string;
        account: string;
        dateRange: {
            start: string;
            end: string;
        };
    },
    globalSearchTerm: string = ''
): Transaction[] => {
    return transactions.filter(transaction => {
        const searchTerm = globalSearchTerm || filters.search;
        if (searchTerm) {
            const matchesSearch = 
                transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (transaction.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (!matchesSearch) return false;
        }
        
        if (filters.type !== 'all') {
            const isTransfer = transaction.tags?.includes('transfer');
            if (isTransfer || transaction.type !== filters.type) {
                return false;
            }
        }
        
        if (filters.category !== 'all' && transaction.category !== filters.category) {
            return false;
        }
        
        if (filters.account !== 'all' && transaction.account_id !== filters.account) {
            return false;
        }
        
        if (filters.dateRange.start || filters.dateRange.end) {
            const transactionDate = new Date(transaction.date);
            const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
            const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
            
            if (startDate && transactionDate < startDate) return false;
            if (endDate && transactionDate > endDate) return false;
        }
        
        const isTransfer = transaction.tags?.includes('transfer');
        if (isTransfer) return false;
        
        return true;
    });
};

export const sortTransactions = (
    transactions: Transaction[],
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null
): Transaction[] => {
    if (!sortConfig) return transactions;
    
    return [...transactions].sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortConfig.key) {
            case 'date':
                aValue = new Date(a.date).getTime();
                bValue = new Date(b.date).getTime();
                break;
            case 'description':
                aValue = a.description.toLowerCase();
                bValue = b.description.toLowerCase();
                break;
            case 'category':
                aValue = a.category.toLowerCase();
                bValue = b.category.toLowerCase();
                break;
            case 'amount':
                aValue = a.amount;
                bValue = b.amount;
                break;
            case 'type':
                aValue = a.type.toLowerCase();
                bValue = b.type.toLowerCase();
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

export const calculateTransactionStats = (transactions: Transaction[], accounts: Account[]) => {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpenses;
    
    const currencies = [...new Set(accounts.map(a => a.currency))];
    const primaryCurrency = currencies[0] || 'USD';
    
    const averageAmount = transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
        : 0;
    
    const accountStats = accounts.map(account => {
        const accountTransactions = transactions.filter(t => t.account_id === account.id);
        return {
            account,
            count: accountTransactions.length,
            total: accountTransactions.reduce((sum, t) => sum + t.amount, 0)
        };
    }).sort((a, b) => b.count - a.count);
    
    const mostActiveAccount = accountStats[0];
    
    const categoryBreakdown = transactions.reduce((acc, transaction) => {
        const category = transaction.category;
        if (!acc[category]) {
            acc[category] = { count: 0, total: 0 };
        }
        acc[category].count++;
        acc[category].total += transaction.amount;
        return acc;
    }, {} as Record<string, { count: number; total: number }>);
    
    return {
        totalIncome,
        totalExpenses,
        netAmount,
        transactionCount: transactions.length,
        incomeCount: incomeTransactions.length,
        expenseCount: expenseTransactions.length,
        averageAmount,
        primaryCurrency,
        mostActiveAccount,
        categoryBreakdown
    };
};

export const getAccountName = (accountId: string, accounts: Account[]): string => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
};

export const formatTransactionDate = (date: string, format: 'short' | 'long' | 'time' = 'short'): string => {
    const transactionDate = new Date(date);
    
    switch (format) {
        case 'short':
            return transactionDate.toLocaleDateString();
        case 'long':
            return transactionDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'time':
            return transactionDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        default:
            return transactionDate.toLocaleDateString();
    }
};

export const validateTransaction = (transaction: Partial<Transaction>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!transaction.description?.trim()) {
        errors.push('Transaction description is required');
    }
    
    if (!transaction.amount || transaction.amount <= 0) {
        errors.push('Transaction amount must be greater than 0');
    }
    
    if (!transaction.category?.trim()) {
        errors.push('Transaction category is required');
    }
    
    if (!transaction.account_id) {
        errors.push('Account is required');
    }
    
    if (!transaction.date) {
        errors.push('Transaction date is required');
    }
    
    if (!transaction.type || !TRANSACTION_TYPES.includes(transaction.type as any)) {
        errors.push('Valid transaction type is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

export const getTransactionTypeDisplayName = (type: string): string => {
    switch (type) {
        case 'income':
            return 'Income';
        case 'expense':
            return 'Expense';
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

export const isRecurringTransaction = (transaction: Transaction): boolean => {
    return (transaction as any).is_recurring || false;
};

export const getRecurringFrequencyDisplayName = (frequency?: string): string => {
    if (!frequency) return 'Not recurring';
    
    switch (frequency.toLowerCase()) {
        case 'daily':
            return 'Daily';
        case 'weekly':
            return 'Weekly';
        case 'monthly':
            return 'Monthly';
        case 'yearly':
            return 'Yearly';
        default:
            return frequency.charAt(0).toUpperCase() + frequency.slice(1);
    }
};

export const exportTransactionsToCSV = (transactions: Transaction[], accounts: Account[]): string => {
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    const csvData = transactions.map(transaction => {
        const account = accounts.find(a => a.id === transaction.account_id);
        return [
            formatTransactionDate(transaction.date),
            transaction.description,
            transaction.category,
            account?.name || 'Unknown',
            getTransactionTypeDisplayName(transaction.type),
            transaction.amount,
            (transaction.tags || []).join('; ')
        ];
    });
    
    return [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
};

export const getDateRangePresets = () => {
    const today = new Date();
    
    return {
        today: {
            start: today.toISOString().slice(0, 10),
            end: today.toISOString().slice(0, 10),
            label: 'Today'
        },
        week: {
            start: (() => {
                const day = today.getDay();
                const diffToMonday = (day === 0 ? -6 : 1) - day;
                const monday = new Date(today);
                monday.setDate(today.getDate() + diffToMonday);
                return monday.toISOString().slice(0, 10);
            })(),
            end: (() => {
                const day = today.getDay();
                const diffToMonday = (day === 0 ? -6 : 1) - day;
                const monday = new Date(today);
                monday.setDate(today.getDate() + diffToMonday);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                return sunday.toISOString().slice(0, 10);
            })(),
            label: 'This Week'
        },
        month: {
            start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
            end: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10),
            label: 'This Month'
        },
        lastMonth: {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10),
            end: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10),
            label: 'Last Month'
        },
        year: {
            start: new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10),
            end: new Date(today.getFullYear(), 11, 31).toISOString().slice(0, 10),
            label: 'This Year'
        }
    };
}; 


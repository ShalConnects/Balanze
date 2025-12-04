import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface FinancialHealthCardProps {
  transactions: Transaction[];
  selectedCurrency: string;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  transactions,
  selectedCurrency
}) => {
  // Helper function to check if transaction is lend/borrow related
  const isLendBorrowTransaction = (transaction: Transaction): boolean => {
    // Check for lend_borrow tag
    if (transaction.tags?.includes('lend_borrow')) {
      return true;
    }
    
    // Check description text patterns for old lend/borrow transactions
    const description = transaction.description?.toLowerCase() || '';
    const lendBorrowPatterns = [
      'lent to',
      'borrowed from', 
      'repayment from',
      'repayment to',
      'partial return from',
      'partial return to',
      'debt repayment to',
      'received partial return from',
      'made partial payment to',
      'partial loan repayment from'
    ];
    
    return lendBorrowPatterns.some(pattern => description.includes(pattern));
  };

  // Calculate true income and expenses (excluding lend/borrow transactions)
  const trueIncome = transactions
    .filter(t => t.type === 'income' && !isLendBorrowTransaction(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const trueExpenses = transactions
    .filter(t => t.type === 'expense' && !isLendBorrowTransaction(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = trueIncome - trueExpenses;
  const isPositive = netAmount >= 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Net (Ex: lent/borrow)</p>
          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
            {formatCurrency(netAmount, selectedCurrency)}
          </p>
          <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
            <span className="text-green-600 dark:text-green-400">
              {formatCurrency(trueIncome, selectedCurrency)}
            </span>
            <span className="mx-1">/</span>
            <span className="text-red-600 dark:text-red-400">
              {formatCurrency(trueExpenses, selectedCurrency)}
            </span>
          </p>
        </div>
        <TrendingDown className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
      </div>
    </div>
  );
};

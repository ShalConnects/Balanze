import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { logTransactionEvent } from '../../lib/auditLogging';
import { generateTransactionId } from '../../utils/transactionId';
import { getCurrencySymbol } from '../../utils/currency';
import { getDefaultAccountId } from '../../utils/defaultAccount';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';
import { parseISO, format } from 'date-fns';
import { useLoadingContext } from '../../context/LoadingContext';
import { getFilteredCategoriesForTransaction } from '../../utils/categoryFiltering';

interface BulkTransactionRow {
  id: string;
  account_id: string;
  amount: string;
  type: 'income' | 'expense' | '';
  category: string;
  description: string;
  date: string;
  errors: Record<string, string>;
}

interface BulkTransactionFormProps {
  onClose: () => void;
  isOpen?: boolean;
}

export const BulkTransactionForm: React.FC<BulkTransactionFormProps> = ({ onClose, isOpen = true }) => {
  const accounts = useFinanceStore(state => state.accounts);
  const categories = useFinanceStore(state => state.categories);
  const purchaseCategories = useFinanceStore(state => state.purchaseCategories);
  const addTransaction = useFinanceStore(state => state.addTransaction);
  const fetchAccounts = useFinanceStore(state => state.fetchAccounts);

  const { user } = useAuthStore();
  const { wrapAsync, setLoadingMessage, isLoading } = useLoadingContext();

  const [rows, setRows] = useState<BulkTransactionRow[]>([
    {
      id: `row-${Date.now()}`,
      account_id: getDefaultAccountId(),
      amount: '',
      type: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      errors: {}
    }
  ]);

  const defaultAccountId = getDefaultAccountId();
  const defaultDate = new Date().toISOString().split('T')[0];

  // Get filtered categories based on account currency
  const getFilteredCategories = (accountId: string, type: 'income' | 'expense' | '') => {
    if (!type) return { incomeCategories: [], purchaseCategories: [] };
    return getFilteredCategoriesForTransaction(
      categories,
      purchaseCategories,
      accounts,
      accountId,
      type,
      'regular_expense'
    );
  };

  // Initialize with one row
  useEffect(() => {
    if (isOpen) {
      setRows([{
        id: `row-${Date.now()}`,
        account_id: defaultAccountId,
        amount: '',
        type: '',
        category: '',
        description: '',
        date: defaultDate,
        errors: {}
      }]);
    }
  }, [isOpen, defaultAccountId, defaultDate]);

  // Ensure accounts are loaded
  useEffect(() => {
    if (isOpen && user && accounts.length === 0) {
      fetchAccounts();
    }
  }, [isOpen, user, accounts.length, fetchAccounts]);

  const addRow = () => {
    const newRow: BulkTransactionRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      account_id: rows[0]?.account_id || defaultAccountId,
      amount: '',
      type: rows[0]?.type || '',
      category: '',
      description: '',
      date: rows[0]?.date || defaultDate,
      errors: {}
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    } else {
      showToast.error('At least one row is required');
    }
  };

  const updateRow = (id: string, field: keyof BulkTransactionRow, value: any) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        // Clear category when type changes
        if (field === 'type' && value !== row.type) {
          updated.category = '';
        }
        // Clear errors when field is updated
        if (updated.errors[field as string]) {
          const newErrors = { ...updated.errors };
          delete newErrors[field as string];
          updated.errors = newErrors;
        }
        return updated;
      }
      return row;
    }));
  };

  const validateRow = (row: BulkTransactionRow): boolean => {
    const errors: Record<string, string> = {};
    
    if (!row.account_id) {
      errors.account_id = 'Account is required';
    }
    if (!row.amount || parseFloat(row.amount) <= 0) {
      errors.amount = 'Valid amount is required';
    }
    if (!row.type) {
      errors.type = 'Type is required';
    }
    if (!row.category) {
      errors.category = 'Category is required';
    }
    if (!row.date) {
      errors.date = 'Date is required';
    }

    updateRow(row.id, 'errors', errors);
    return Object.keys(errors).length === 0;
  };

  const validateAllRows = (): boolean => {
    let allValid = true;
    rows.forEach(row => {
      if (!validateRow(row)) {
        allValid = false;
      }
    });
    return allValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast.error('Please log in to add transactions');
      return;
    }

    if (!validateAllRows()) {
      showToast.error('Please fix all errors before submitting');
      return;
    }

    const validRows = rows.filter(row => 
      row.account_id && row.amount && row.type && row.category && row.date
    );

    if (validRows.length === 0) {
      showToast.error('Please add at least one valid transaction');
      return;
    }

    const wrappedSubmit = wrapAsync(async () => {
      setLoadingMessage(`Adding ${validRows.length} transaction${validRows.length > 1 ? 's' : ''}...`);
      
      try {
        let successCount = 0;
        let errorCount = 0;

        // Process transactions in batches to avoid overwhelming the system
        const batchSize = 5;
        for (let i = 0; i < validRows.length; i += batchSize) {
          const batch = validRows.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (row) => {
            try {
              const transactionId = generateTransactionId();
              const transactionData = {
                account_id: row.account_id,
                amount: parseFloat(row.amount),
                type: row.type as 'income' | 'expense',
                category: row.category,
                description: row.description || '',
                date: new Date(row.date).toISOString(),
                tags: [],
                user_id: user.id,
                transaction_id: transactionId
              };

              const result = await addTransaction(transactionData);
              
              if (result) {
                await logTransactionEvent('create', { ...transactionData, id: result.id });
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              errorCount++;
            }
          }));
        }

        if (successCount > 0) {
          showToast.success(`Successfully added ${successCount} transaction${successCount > 1 ? 's' : ''}`);
        }
        if (errorCount > 0) {
          showToast.error(`Failed to add ${errorCount} transaction${errorCount > 1 ? 's' : ''}`);
        }

        if (successCount > 0) {
          onClose();
        }
      } catch (error) {
        showToast.error('Failed to add transactions. Please try again.');
      }
    });

    await wrappedSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={isLoading ? undefined : onClose}
      />
      
      {/* Modal Container */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-[1rem] border border-gray-200 dark:border-gray-700 p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto z-50 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bulk Add Transactions
          </h2>
          <button 
            onClick={isLoading ? undefined : onClose} 
            className={`p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Close form"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Account</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Category</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const filteredCategories = getFilteredCategories(row.account_id, row.type);
                  const selectedAccount = accounts.find(a => a.id === row.account_id);
                  
                  return (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                      {/* Account */}
                      <td className="p-2">
                        <div className="relative">
                          <CustomDropdown
                            value={row.account_id}
                            onChange={(value: string) => updateRow(row.id, 'account_id', value)}
                            options={accounts
                              .filter(account => account.isActive && !account.name.includes('(DPS)'))
                              .map((account) => ({
                                value: account.id,
                                label: `${account.name} (${getCurrencySymbol(account.currency)}${Number(account.calculated_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                              }))}
                            placeholder="Account *"
                            fullWidth={true}
                          />
                          {row.errors.account_id && (
                            <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {row.errors.account_id}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-2">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={row.amount}
                            onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                            className={`w-full px-3 py-2 text-sm h-9 rounded-lg border transition-colors bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                              row.errors.amount ? 'border-red-300 focus:ring-red-500' : ''
                            }`}
                            placeholder="0.00"
                          />
                          {row.errors.amount && (
                            <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {row.errors.amount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-2">
                        <div className="relative">
                          <CustomDropdown
                            value={row.type}
                            onChange={(value: string) => {
                              updateRow(row.id, 'type', value);
                              updateRow(row.id, 'category', '');
                            }}
                            options={[
                              { value: 'expense', label: 'Expense' },
                              { value: 'income', label: 'Income' },
                            ]}
                            placeholder="Type *"
                            fullWidth={true}
                          />
                          {row.errors.type && (
                            <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {row.errors.type}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-2">
                        <div className="relative">
                          <CustomDropdown
                            value={row.category}
                            onChange={(value: string) => updateRow(row.id, 'category', value)}
                            options={
                              row.type === 'income'
                                ? [
                                    { value: '', label: 'Select category' },
                                    ...filteredCategories.incomeCategories.map((category) => ({
                                      value: category.name,
                                      label: category.name,
                                    })),
                                  ]
                                : row.type === 'expense'
                                ? [
                                    { value: '', label: 'Select category' },
                                    ...filteredCategories.purchaseCategories.map((category) => ({
                                      value: category.category_name,
                                      label: category.category_name,
                                    })),
                                  ]
                                : [{ value: '', label: 'Select type first' }]
                            }
                            placeholder="Category *"
                            fullWidth={true}
                          />
                          {row.errors.category && (
                            <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {row.errors.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm h-9 rounded-lg border transition-colors bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          placeholder="Description"
                        />
                      </td>

                      {/* Date */}
                      <td className="p-2">
                        <div className="relative">
                          <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 pr-2 text-sm h-9 rounded-lg w-full border border-gray-200 dark:border-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <DatePicker
                              selected={row.date ? parseISO(row.date) : null}
                              onChange={date => updateRow(row.id, 'date', date ? format(date, 'yyyy-MM-dd') : '')}
                              placeholderText="Date *"
                              dateFormat="yyyy-MM-dd"
                              className="bg-transparent outline-none border-none w-full cursor-pointer text-sm"
                              calendarClassName="z-[60] shadow-lg border border-gray-200 rounded-lg !font-sans"
                              popperPlacement="bottom-start"
                              showPopperArrow={false}
                              wrapperClassName="w-full"
                              todayButton="Today"
                              isClearable
                              autoComplete="off"
                            />
                          </div>
                          {row.errors.date && (
                            <span className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {row.errors.date}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Remove Button */}
                      <td className="p-2">
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            aria-label="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {rows.length} row{rows.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              disabled={isLoading}
            >
              Add {rows.length} Transaction{rows.length !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


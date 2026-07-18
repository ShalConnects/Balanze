import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getTodayLocalDateString } from '../../utils/taskDateUtils';
import { AppModal } from '../common/AppModal';

interface SavingsGoalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavingsGoalForm: React.FC<SavingsGoalFormProps> = ({ isOpen, onClose }) => {
  const { accounts, createSavingsGoal, loading, error } = useFinanceStore();
  const activeAccounts = accounts.filter(a => a.isActive && a.type !== 'savings');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    target_date: '',
    source_account_id: ''
  });

  const resetAndClose = () => {
    setFormData({
      name: '',
      description: '',
      target_amount: '',
      target_date: '',
      source_account_id: ''
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source_account_id || !formData.name || !formData.target_amount) return;

    await createSavingsGoal({
      name: formData.name,
      description: formData.description,
      target_amount: parseFloat(formData.target_amount),
      target_date: formData.target_date,
      source_account_id: formData.source_account_id
    });

    resetAndClose();
  };

  const sourceCurrency = formData.source_account_id
    ? accounts.find(a => a.id === formData.source_account_id)?.currency
    : undefined;

  return (
    <AppModal isOpen={isOpen} onClose={onClose} size="md" title="Create New Savings Goal">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        {error && (
          <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Goal Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            rows={3}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                {sourceCurrency === 'USD' ? '$' : ''}
              </span>
            </div>
            <input
              type="number"
              id="target_amount"
              value={formData.target_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
              className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
              min="0"
              step="0.01"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                {sourceCurrency && sourceCurrency !== 'USD' ? sourceCurrency : ''}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="target_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Date
          </label>
          <input
            type="date"
            id="target_date"
            value={formData.target_date}
            onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            min={getTodayLocalDateString()}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="source_account" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Source Account
          </label>
          <select
            id="source_account"
            value={formData.source_account_id}
            onChange={(e) => setFormData(prev => ({ ...prev, source_account_id: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm unified-dropdown"
            required
            disabled={loading}
          >
            <option value="">Select an account</option>
            {activeAccounts.map((account: Account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({formatCurrency(account.calculated_balance, account.currency)})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={resetAndClose}
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Goal'}
          </button>
        </div>
      </form>
    </AppModal>
  );
};

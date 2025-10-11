import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PlusIcon, StarIcon, CalendarDaysIcon, ArrowTrendingUpIcon, CheckIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { SavingsGoal } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { SavingsGoalForm } from './SavingsGoalForm';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';

export const SavingsView: React.FC = () => {
  const { accounts, savingsGoals, fetchSavingsGoals, saveSavingsGoal, loading, error } = useFinanceStore();
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [saveAmount, setSaveAmount] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    fetchSavingsGoals();
  }, [fetchSavingsGoals]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !saveAmount) return;

    await saveSavingsGoal(selectedGoal.id, parseFloat(saveAmount));
    setShowSaveForm(false);
    setSaveAmount('');
    setSelectedGoal(null);
  };

  const getGoalStatus = (goal: SavingsGoal) => {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (progress >= 100) return 'completed';
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 7) return 'urgent';
    if (progress >= 75) return 'almost-there';
    return 'on-track';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'almost-there': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckIcon className="w-5 h-5" />;
      case 'overdue': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'urgent': return <ClockIcon className="w-5 h-5" />;
      case 'almost-there': return <ArrowTrendingUpIcon className="w-5 h-5" />;
      default: return <StarIcon className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed!';
      case 'overdue': return 'Overdue';
      case 'urgent': return 'Due Soon';
      case 'almost-there': return 'Almost There';
      default: return 'On Track';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
        <button
          onClick={() => setShowNewGoalForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Savings Goal
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.map((goal) => {
          const sourceAccount = accounts.find(a => a.id === goal.source_account_id);
          const savingsAccount = accounts.find(a => a.id === goal.savings_account_id);
          const progress = (goal.current_amount / goal.target_amount) * 100;
          const status = getGoalStatus(goal);
          const targetDate = new Date(goal.target_date);
          const today = new Date();
          const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const remainingAmount = goal.target_amount - goal.current_amount;
          
          return (
            <div key={goal.id} className={`bg-white rounded-xl shadow-lg border-2 p-6 transition-all duration-200 hover:shadow-xl ${getStatusColor(status)}`}>
              {/* Header with status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{goal.name}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  )}
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  <span>{getStatusText(status)}</span>
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'overdue' ? 'bg-red-500' :
                      status === 'urgent' ? 'bg-orange-500' :
                      status === 'almost-there' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                
                {/* Amount Display */}
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-sm text-gray-500">Saved</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(goal.current_amount, sourceAccount?.currency || 'USD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Target</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(goal.target_amount, sourceAccount?.currency || 'USD')}
                    </p>
                  </div>
                </div>
                
                {remainingAmount > 0 && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      {formatCurrency(remainingAmount, sourceAccount?.currency || 'USD')} to go
                    </p>
                  </div>
                )}
              </div>

              {/* Timeline and Account Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>
                    Due {format(targetDate, 'MMM dd, yyyy')}
                    {daysLeft > 0 && ` (${daysLeft} days left)`}
                    {daysLeft <= 0 && ` (${Math.abs(daysLeft)} days overdue)`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>From: {sourceAccount?.name || 'Unknown Account'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>To: {savingsAccount?.name || 'Unknown Account'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedGoal(goal);
                  setShowSaveForm(true);
                }}
                disabled={loading || status === 'completed'}
                className={`w-full inline-flex justify-center items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  status === 'completed' 
                    ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {status === 'completed' ? (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Goal Completed!
                  </>
                ) : loading ? (
                  'Processing...'
                ) : (
                  <>
                    <ArrowTrendingUpIcon className="w-4 h-4 mr-2" />
                    Add Money
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <SavingsGoalForm
        isOpen={showNewGoalForm}
        onClose={() => setShowNewGoalForm(false)}
      />

      {/* Save Amount Dialog */}
      <Dialog open={showSaveForm} onClose={() => setShowSaveForm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Save to {selectedGoal?.name}
            </Dialog.Title>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      {selectedGoal && accounts.find(a => a.id === selectedGoal.source_account_id)?.currency === 'USD' ? '$' : ''}
                    </span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    value={saveAmount}
                    onChange={(e) => setSaveAmount(e.target.value)}
                    className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      {selectedGoal && accounts.find(a => a.id === selectedGoal.source_account_id)?.currency !== 'USD' 
                        ? accounts.find(a => a.id === selectedGoal.source_account_id)?.currency 
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveForm(false);
                    setSaveAmount('');
                    setSelectedGoal(null);
                  }}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}; 
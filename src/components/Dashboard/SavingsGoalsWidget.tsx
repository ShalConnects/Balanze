import React, { useState, useEffect } from 'react';
import { PiggyBank, Target, TrendingUp, Plus, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/currency';
import { SavingsGoal } from '../../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export const SavingsGoalsWidget: React.FC = () => {
  const { savingsGoals, fetchSavingsGoals, accounts, loading } = useFinanceStore();
  const [activeGoals, setActiveGoals] = useState<SavingsGoal[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);

  useEffect(() => {
    fetchSavingsGoals();
  }, [fetchSavingsGoals]);

  useEffect(() => {
    if (savingsGoals && savingsGoals.length > 0) {
      const active = savingsGoals.filter(goal => {
        const targetDate = new Date(goal.target_date);
        const today = new Date();
        return targetDate >= today; // Only show goals that haven't passed their target date
      });
      
      setActiveGoals(active.slice(0, 3)); // Show max 3 goals
      
      const saved = active.reduce((sum, goal) => sum + goal.current_amount, 0);
      const target = active.reduce((sum, goal) => sum + goal.target_amount, 0);
      
      setTotalSaved(saved);
      setTotalTarget(target);
    }
  }, [savingsGoals]);

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getGoalStatus = (goal: SavingsGoal) => {
    const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
    const daysLeft = getDaysUntilTarget(goal.target_date);
    
    if (progress >= 100) return 'completed';
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 7) return 'urgent';
    if (progress >= 75) return 'almost-there';
    return 'on-track';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'urgent': return 'text-orange-600 bg-orange-50';
      case 'almost-there': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeGoals || activeGoals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <PiggyBank className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Savings Goals</h2>
          </div>
        </div>
        
        <div className="text-center py-8">
          <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Goals</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start saving for your dreams and financial goals
          </p>
          <Link
            to="/savings"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <PiggyBank className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Savings Goals</h2>
        </div>
        <Link
          to="/savings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View All
        </Link>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Progress</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage(totalSaved, totalTarget)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getProgressPercentage(totalSaved, totalTarget).toFixed(1)}% Complete
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatCurrency(totalTarget - totalSaved)} to go
          </span>
        </div>
      </div>

      {/* Individual Goals */}
      <div className="space-y-4">
        {activeGoals.map((goal) => {
          const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
          const daysLeft = getDaysUntilTarget(goal.target_date);
          const status = getGoalStatus(goal);
          const sourceAccount = accounts.find(acc => acc.id === goal.source_account_id);
          
          return (
            <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{goal.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {getStatusText(status)}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {progress.toFixed(1)}% Complete
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Due {format(new Date(goal.target_date), 'MMM dd, yyyy')}</span>
                </div>
                {sourceAccount && (
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>{sourceAccount.name}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/savings"
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Money to Goals
        </Link>
      </div>
    </div>
  );
};

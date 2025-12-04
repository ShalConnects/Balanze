import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Target, 
  DollarSign,
  BarChart3,
  Wallet,
  Calendar
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';
import { formatTransactionDescription } from '../utils/transactionDescriptionFormatter';
import { SkeletonCard } from '../components/common/Skeleton';
import { SimpleInvestmentGoalForm } from '../components/SimpleInvestments/SimpleInvestmentGoalForm';

interface SimpleInvestmentStats {
  total_investment_value: number;
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_goal_progress: number;
}

interface SimpleInvestmentTransaction {
  id: string;
  account_id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: string;
}

export const SimpleInvestments: React.FC = () => {
  const [stats, setStats] = useState<SimpleInvestmentStats>({
    total_investment_value: 0,
    total_goals: 0,
    active_goals: 0,
    completed_goals: 0,
    total_goal_progress: 0
  });
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<SimpleInvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const { user } = useAuthStore();
  const { accounts } = useFinanceStore();

  useEffect(() => {
    if (user) {
      fetchInvestmentData();
    }
  }, [user]);

  const fetchInvestmentData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Add investment categories for this user
      await supabase.rpc('add_investment_categories_for_user', {
        user_uuid: user.id
      });

      // Fetch investment stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_investment_stats', { user_uuid: user.id });

      if (statsError) throw statsError;

      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Fetch investment goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('investment_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

      // Fetch investment transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .rpc('get_investment_transactions', { user_uuid: user.id });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

    } catch (err: any) {
      console.error('Error fetching investment data:', err);
      setError(err.message || 'Failed to fetch investment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (goalData: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('investment_goals')
        .insert([{ ...goalData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data, ...prev]);
      setShowGoalForm(false);
      
      // Refresh stats
      await fetchInvestmentData();
    } catch (err: any) {
      console.error('Error adding goal:', err);
      setError(err.message || 'Failed to add goal');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('investment_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(goal => goal.id === goalId ? data : goal));
    } catch (err: any) {
      console.error('Error updating goal:', err);
      setError(err.message || 'Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('investment_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      setError(err.message || 'Failed to delete goal');
    }
  };

  const getProgressPercentage = (goal: any) => {
    if (goal.target_amount === 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading investments</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Simple Investment Tracking</h1>
          <p className="text-gray-600">Track your investment goals and transactions</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowGoalForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Investment Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Investment Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_investment_value)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Goals */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_goals}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Goals */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Goals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_goals}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Completed Goals */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Goals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed_goals}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Investment Goals */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Investment Goals</h3>
          <button
            onClick={() => setShowGoalForm(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
        
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No investment goals yet</h3>
            <p className="text-gray-500 mb-4">Start by creating your first investment goal</p>
            <button
              onClick={() => setShowGoalForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progressPercentage = getProgressPercentage(goal);
              const isCompleted = goal.status === 'completed' || progressPercentage >= 100;
              const daysRemaining = goal.target_date ? getDaysRemaining(goal.target_date) : null;
              const isOverdue = daysRemaining !== null && daysRemaining < 0;
              
              return (
                <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          goal.status === 'active' ? 'bg-green-100 text-green-800' :
                          goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          goal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {goal.status}
                        </span>
                        <span className={`text-xs font-medium ${
                          goal.priority === 'high' ? 'text-red-600' :
                          goal.priority === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {goal.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                      <span>{formatCurrency(goal.current_amount)}</span>
                      <span>{formatCurrency(goal.target_amount)}</span>
                    </div>
                  </div>
                  
                  {goal.target_date && (
                    <div className="text-xs text-gray-500 mb-2">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                      {isOverdue && (
                        <span className="text-red-600 ml-2">
                          (Overdue by {Math.abs(daysRemaining!)} days)
                        </span>
                      )}
                    </div>
                  )}

                  {goal.description && (
                    <p className="text-xs text-gray-500 mb-3">{goal.description}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateGoal(goal.id, { 
                        current_amount: goal.current_amount + 1000 
                      })}
                      className="flex-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    >
                      +$1k
                    </button>
                    <button
                      onClick={() => handleUpdateGoal(goal.id, { 
                        current_amount: goal.current_amount + 5000 
                      })}
                      className="flex-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      +$5k
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Investment Transactions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Investment Transactions</h3>
          <a 
            href="/transactions" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Transactions
          </a>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No investment transactions yet</h3>
            <p className="text-gray-500 mb-4">Start tracking your investment transactions</p>
            <a 
              href="/transactions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Investment Transaction
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{formatTransactionDescription(transaction.description)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal Form Modal */}
      <SimpleInvestmentGoalForm
        isOpen={showGoalForm}
        onClose={() => setShowGoalForm(false)}
        onSubmit={handleAddGoal}
        loading={loading}
      />
    </div>
  );
};

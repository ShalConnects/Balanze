import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  Pause,
  Play
} from 'lucide-react';
import { InvestmentGoal, InvestmentGoalInput } from '../../types/investment';
import { formatCurrency } from '../../utils/currency';
import { SkeletonCard } from '../common/Skeleton';

interface InvestmentGoalsProps {
  goals: InvestmentGoal[];
  loading?: boolean;
  onAddGoal?: () => void;
  onEditGoal?: (goal: InvestmentGoal) => void;
  onDeleteGoal?: (goalId: string) => void;
  onUpdateGoalStatus?: (goalId: string, status: InvestmentGoal['status']) => void;
}

export const InvestmentGoals: React.FC<InvestmentGoalsProps> = ({
  goals,
  loading = false,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onUpdateGoalStatus
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed' | 'cancelled'>('all');

  const filteredGoals = goals.filter(goal => {
    if (filterStatus === 'all') return true;
    return goal.status === filterStatus;
  });

  const getStatusColor = (status: InvestmentGoal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: InvestmentGoal['status']) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: InvestmentGoal['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressPercentage = (goal: InvestmentGoal) => {
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
        <div className="flex justify-between items-center">
          <SkeletonCard className="h-8 w-48" />
          <SkeletonCard className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investment Goals</h2>
          <p className="text-gray-600">Set and track your investment objectives</p>
        </div>
        <button
          onClick={onAddGoal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'paused', 'completed', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal) => {
          const progressPercentage = getProgressPercentage(goal);
          const daysRemaining = goal.target_date ? getDaysRemaining(goal.target_date) : null;
          const isOverdue = daysRemaining !== null && daysRemaining < 0;
          const isCompleted = goal.status === 'completed' || progressPercentage >= 100;

          return (
            <div key={goal.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {goal.status}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEditGoal?.(goal)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => onDeleteGoal?.(goal.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
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

              {/* Target Date */}
              {goal.target_date && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Target Date:</span>
                    <span className={`font-medium ${
                      isOverdue ? 'text-red-600' : daysRemaining !== null && daysRemaining <= 30 ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      {new Date(goal.target_date).toLocaleDateString()}
                    </span>
                  </div>
                  {daysRemaining !== null && (
                    <div className="text-xs text-gray-500 mt-1">
                      {isOverdue ? (
                        <span className="text-red-600">
                          Overdue by {Math.abs(daysRemaining)} days
                        </span>
                      ) : daysRemaining === 0 ? (
                        <span className="text-yellow-600">Due today</span>
                      ) : (
                        <span>
                          {daysRemaining} days remaining
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {goal.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {goal.status === 'active' && (
                  <button
                    onClick={() => onUpdateGoalStatus?.(goal.id, 'paused')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                {goal.status === 'paused' && (
                  <button
                    onClick={() => onUpdateGoalStatus?.(goal.id, 'active')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}
                {!isCompleted && goal.status !== 'cancelled' && (
                  <button
                    onClick={() => onUpdateGoalStatus?.(goal.id, 'completed')}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGoals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals found</h3>
          <p className="text-gray-500 mb-4">
            {filterStatus === 'all' 
              ? 'Start by creating your first investment goal.'
              : `No ${filterStatus} goals found. Try adjusting your filter.`
            }
          </p>
          <button
            onClick={onAddGoal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Goal
          </button>
        </div>
      )}
    </div>
  );
};

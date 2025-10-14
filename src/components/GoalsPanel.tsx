import React, { useState, useMemo } from 'react';
import { chartColors } from '../styles/colors';
import { format, addMonths, differenceInDays } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: 'savings' | 'investment' | 'debt' | 'purchase';
  monthlyContribution?: number;
  isAutoSave: boolean;
}

interface GoalsPanelProps {
  goals?: Goal[];
  className?: string;
  currency?: string;
  onGoalAction?: (goalId: string, action: string) => void;
}

// Mock data generator
const generateMockGoals = (): Goal[] => [
  {
    id: 'emergency-fund',
    title: 'Emergency Fund',
    targetAmount: 100000,
    currentAmount: 65000,
    deadline: addMonths(new Date(), 8),
    category: 'savings',
    monthlyContribution: 5000,
    isAutoSave: true
  },
  {
    id: 'vacation',
    title: 'Europe Vacation',
    targetAmount: 150000,
    currentAmount: 45000,
    deadline: addMonths(new Date(), 12),
    category: 'purchase',
    monthlyContribution: 8000,
    isAutoSave: false
  },
  {
    id: 'car-loan',
    title: 'Car Loan Payoff',
    targetAmount: 200000,
    currentAmount: 120000,
    deadline: addMonths(new Date(), 18),
    category: 'debt',
    monthlyContribution: 6000,
    isAutoSave: true
  },
  {
    id: 'retirement',
    title: 'Retirement Fund',
    targetAmount: 500000,
    currentAmount: 180000,
    deadline: addMonths(new Date(), 60),
    category: 'investment',
    monthlyContribution: 10000,
    isAutoSave: true
  }
];

const CircularProgress: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
}> = ({ progress, size, strokeWidth, color, backgroundColor = '#e5e7eb' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-900">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

const GoalCard: React.FC<{
  goal: Goal;
  currency: string;
  onAction?: (goalId: string, action: string) => void;
}> = ({ goal, currency, onAction }) => {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysLeft = differenceInDays(goal.deadline, new Date());
  
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const requiredMonthlyAmount = remaining / monthsLeft;
  
  const isOnTrack = goal.monthlyContribution 
    ? goal.monthlyContribution >= requiredMonthlyAmount
    : false;
  
  const eta = goal.monthlyContribution && goal.monthlyContribution > 0
    ? addMonths(new Date(), Math.ceil(remaining / goal.monthlyContribution))
    : goal.deadline;

  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'savings': return chartColors.kpi.positive;
      case 'investment': return '#8b5cf6';
      case 'debt': return chartColors.kpi.negative;
      case 'purchase': return '#f59e0b';
      default: return chartColors.kpi.neutral;
    }
  };

  const formatCurrency = (amount: number) => `${currency}${amount.toLocaleString()}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{goal.title}</h3>
          <p className="text-xs text-gray-500 capitalize">{goal.category}</p>
        </div>
        <CircularProgress
          progress={Math.min(progress, 100)}
          size={56}
          strokeWidth={4}
          color={getCategoryColor(goal.category)}
        />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current</span>
          <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Target</span>
          <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className="font-medium text-blue-600">{formatCurrency(remaining)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: getCategoryColor(goal.category)
          }}
        />
      </div>

      {/* Timeline info */}
      <div className="space-y-2 mb-4 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Deadline:</span>
          <span>{format(goal.deadline, 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex justify-between">
          <span>Days left:</span>
          <span className={daysLeft < 30 ? 'text-red-600 font-medium' : ''}>{daysLeft}</span>
        </div>
        {goal.monthlyContribution && (
          <div className="flex justify-between">
            <span>Monthly:</span>
            <span className={isOnTrack ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(goal.monthlyContribution)}
            </span>
          </div>
        )}
      </div>

      {/* Prediction */}
      <div className="p-3 bg-gray-50 rounded-lg mb-4">
        <p className="text-xs text-gray-600 mb-1">Predicted completion:</p>
        <p className="text-sm font-medium">
          {format(eta, 'MMM yyyy')}
          {eta > goal.deadline && (
            <span className="text-red-600 text-xs ml-1">(Late)</span>
          )}
        </p>
        {!isOnTrack && goal.monthlyContribution && (
          <p className="text-xs text-red-600 mt-1">
            Need {formatCurrency(requiredMonthlyAmount - goal.monthlyContribution)}/month more
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {!goal.isAutoSave && (
          <button
            onClick={() => onAction?.(goal.id, 'enable_autosave')}
            className="flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Enable auto-save for ${goal.title}`}
          >
            Auto-save {formatCurrency(Math.ceil(requiredMonthlyAmount))}
          </button>
        )}
        <button
          onClick={() => onAction?.(goal.id, 'add_funds')}
          className="flex-1 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={`Add funds to ${goal.title}`}
        >
          Add Funds
        </button>
      </div>
    </div>
  );
};

const GoalsPanel: React.FC<GoalsPanelProps> = ({
  goals = generateMockGoals(),
  className = '',
  currency = '₹',
  onGoalAction
}) => {
  const [filter, setFilter] = useState<'all' | Goal['category']>('all');
  const [sortBy, setSortBy] = useState<'progress' | 'deadline' | 'amount'>('progress');

  const filteredAndSortedGoals = useMemo(() => {
    let filtered = filter === 'all' ? goals : goals.filter(g => g.category === filter);
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
        case 'deadline':
          return a.deadline.getTime() - b.deadline.getTime();
        case 'amount':
          return b.targetAmount - a.targetAmount;
        default:
          return 0;
      }
    });
  }, [goals, filter, sortBy]);

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalProgress = (totalCurrent / totalTarget) * 100;
    const onTrackCount = goals.filter(goal => {
      const remaining = goal.targetAmount - goal.currentAmount;
      const daysLeft = differenceInDays(goal.deadline, new Date());
      const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
      const requiredMonthly = remaining / monthsLeft;
      return goal.monthlyContribution ? goal.monthlyContribution >= requiredMonthly : false;
    }).length;

    return {
      totalTarget,
      totalCurrent,
      totalProgress,
      onTrackCount,
      totalGoals: goals.length
    };
  }, [goals]);

  const formatCurrency = (amount: number) => `${currency}${amount.toLocaleString()}`;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Goals
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track progress toward your targets
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter goals by category"
          >
            <option value="all">All Goals</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="debt">Debt</option>
            <option value="purchase">Purchase</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Sort goals by"
          >
            <option value="progress">Sort by Progress</option>
            <option value="deadline">Sort by Deadline</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 font-medium">TOTAL PROGRESS</p>
          <p className="text-lg font-semibold text-blue-900">
            {summary.totalProgress.toFixed(1)}%
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700 font-medium">SAVED</p>
          <p className="text-lg font-semibold text-green-900">
            {formatCurrency(summary.totalCurrent)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-700 font-medium">TARGET</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(summary.totalTarget)}
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-700 font-medium">ON TRACK</p>
          <p className="text-lg font-semibold text-purple-900">
            {summary.onTrackCount}/{summary.totalGoals}
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAndSortedGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            currency={currency}
            onAction={onGoalAction}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onGoalAction?.('new', 'create_goal')}
            className="p-3 text-left border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="text-blue-600 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Add New Goal</p>
            <p className="text-xs text-gray-500">Set a new savings target</p>
          </button>
          
          <button
            onClick={() => onGoalAction?.('all', 'boost_savings')}
            className="p-3 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <div className="text-green-600 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Boost Savings</p>
            <p className="text-xs text-gray-500">Increase monthly contributions</p>
          </button>
          
          <button
            onClick={() => onGoalAction?.('all', 'review_goals')}
            className="p-3 text-left border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <div className="text-purple-600 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Review Goals</p>
            <p className="text-xs text-gray-500">Adjust targets and timelines</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalsPanel;


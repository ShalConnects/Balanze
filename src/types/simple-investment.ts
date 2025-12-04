// =====================================================
// SIMPLE INVESTMENT TRACKING TYPES
// =====================================================
// Simple investment tracking using existing transaction system

export interface SimpleInvestmentCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleInvestmentGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  description?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// INPUT TYPES FOR FORMS
// =====================================================

export interface SimpleInvestmentCategoryInput {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface SimpleInvestmentGoalInput {
  id?: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
  description?: string;
}

// =====================================================
// SIMPLE ANALYTICS TYPES
// =====================================================

export interface SimpleInvestmentStats {
  total_investment_value: number;
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_goal_progress: number;
  recent_investment_transactions: any[]; // Using existing transaction system
}

// =====================================================
// CONSTANTS
// =====================================================

export const SIMPLE_INVESTMENT_CATEGORIES = [
  'Stocks',
  'Crypto', 
  'Bonds',
  'Real Estate',
  'ETFs',
  'Mutual Funds',
  'Other'
] as const;

export const SIMPLE_INVESTMENT_GOAL_PRIORITIES = [
  'low',
  'medium', 
  'high'
] as const;

export const SIMPLE_INVESTMENT_GOAL_STATUSES = [
  'active',
  'paused',
  'completed',
  'cancelled'
] as const;

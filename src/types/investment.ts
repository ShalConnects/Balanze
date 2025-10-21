// =====================================================
// INVESTMENT TRACKING TYPES
// =====================================================
// TypeScript interfaces for comprehensive investment tracking

export interface InvestmentCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentAsset {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string; // e.g., 'AAPL', 'BTC', 'TSLA'
  name: string; // e.g., 'Apple Inc.', 'Bitcoin', 'Tesla Inc.'
  asset_type: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'crypto' | 'commodity' | 'real_estate' | 'other';
  category_id?: string;
  current_price: number;
  currency: string;
  total_shares: number;
  total_value: number;
  cost_basis: number; // Total amount invested
  unrealized_gain_loss: number;
  realized_gain_loss: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  user_id: string;
  account_id: string;
  asset_id: string;
  transaction_type: 'buy' | 'sell' | 'dividend' | 'split' | 'merger' | 'transfer_in' | 'transfer_out';
  quantity: number;
  price_per_share: number;
  total_amount: number;
  fees: number;
  currency: string;
  transaction_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioPerformance {
  id: string;
  user_id: string;
  account_id: string;
  date: string;
  total_value: number;
  total_cost_basis: number;
  unrealized_gain_loss: number;
  realized_gain_loss: number;
  total_gain_loss: number;
  return_percentage: number;
  created_at: string;
}

export interface InvestmentGoal {
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

export interface InvestmentCategoryInput {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface InvestmentAssetInput {
  id?: string;
  user_id?: string;
  account_id: string;
  symbol: string;
  name: string;
  asset_type: 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'crypto' | 'commodity' | 'real_estate' | 'other';
  category_id?: string;
  current_price?: number;
  currency?: string;
  notes?: string;
}

export interface InvestmentTransactionInput {
  id?: string;
  user_id?: string;
  account_id: string;
  asset_id: string;
  transaction_type: 'buy' | 'sell' | 'dividend' | 'split' | 'merger' | 'transfer_in' | 'transfer_out';
  quantity: number;
  price_per_share: number;
  total_amount?: number;
  fees?: number;
  currency?: string;
  transaction_date: string;
  notes?: string;
}

export interface InvestmentGoalInput {
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
// ANALYTICS AND REPORTING TYPES
// =====================================================

export interface InvestmentAnalytics {
  total_portfolio_value: number;
  total_cost_basis: number;
  total_unrealized_gain_loss: number;
  total_realized_gain_loss: number;
  total_gain_loss: number;
  overall_return_percentage: number;
  asset_count: number;
  transaction_count: number;
  top_performing_asset?: {
    symbol: string;
    name: string;
    gain_loss: number;
    return_percentage: number;
  };
  worst_performing_asset?: {
    symbol: string;
    name: string;
    gain_loss: number;
    return_percentage: number;
  };
  asset_type_breakdown: Array<{
    asset_type: string;
    total_value: number;
    percentage: number;
    count: number;
  }>;
  currency_breakdown: Array<{
    currency: string;
    total_value: number;
    percentage: number;
  }>;
  monthly_performance: Array<{
    month: string;
    total_value: number;
    gain_loss: number;
    return_percentage: number;
  }>;
}

export interface PortfolioAllocation {
  asset_type: string;
  total_value: number;
  percentage: number;
  count: number;
  color: string;
}

export interface AssetPerformance {
  symbol: string;
  name: string;
  asset_type: string;
  current_value: number;
  cost_basis: number;
  gain_loss: number;
  return_percentage: number;
  total_shares: number;
  current_price: number;
  currency: string;
}

export interface InvestmentDashboardStats {
  total_portfolio_value: number;
  total_gain_loss: number;
  return_percentage: number;
  asset_count: number;
  active_goals: number;
  completed_goals: number;
  recent_transactions: InvestmentTransaction[];
  top_assets: AssetPerformance[];
  portfolio_allocation: PortfolioAllocation[];
}

// =====================================================
// CONSTANTS AND ENUMS
// =====================================================

export const INVESTMENT_ASSET_TYPES = [
  'stock',
  'bond', 
  'etf',
  'mutual_fund',
  'crypto',
  'commodity',
  'real_estate',
  'other'
] as const;

export const INVESTMENT_TRANSACTION_TYPES = [
  'buy',
  'sell',
  'dividend',
  'split',
  'merger',
  'transfer_in',
  'transfer_out'
] as const;

export const INVESTMENT_GOAL_PRIORITIES = [
  'low',
  'medium',
  'high'
] as const;

export const INVESTMENT_GOAL_STATUSES = [
  'active',
  'paused',
  'completed',
  'cancelled'
] as const;

// =====================================================
// UTILITY TYPES
// =====================================================

export type AssetType = typeof INVESTMENT_ASSET_TYPES[number];
export type TransactionType = typeof INVESTMENT_TRANSACTION_TYPES[number];
export type GoalPriority = typeof INVESTMENT_GOAL_PRIORITIES[number];
export type GoalStatus = typeof INVESTMENT_GOAL_STATUSES[number];

// =====================================================
// FILTER AND SEARCH TYPES
// =====================================================

export interface InvestmentFilters {
  searchTerm: string;
  assetTypeFilter: string;
  categoryFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
  minValue: number;
  maxValue: number;
  showOnlyActive: boolean;
}

export interface InvestmentSearchResult {
  assets: InvestmentAsset[];
  transactions: InvestmentTransaction[];
  categories: InvestmentCategory[];
  total_results: number;
}

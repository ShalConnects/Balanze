export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  initial_balance: number;
  calculated_balance: number;
  currency: string;
  isActive: boolean;
  created_at: string;
  description?: string;
  has_dps: boolean;
  dps_type: 'monthly' | 'flexible' | null;
  dps_amount_type: 'fixed' | 'custom' | null;
  dps_fixed_amount: number | null;
  dps_savings_account_id: string | null;
  donation_preference?: number | null;
  transaction_id?: string;
  position?: number;
}

export interface AccountInput {
  id?: string;
  user_id?: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  initial_balance: number;
  currency: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
  description?: string;
  has_dps: boolean;
  dps_type: 'monthly' | 'flexible' | null;
  dps_amount_type: 'fixed' | 'custom' | null;
  dps_fixed_amount: number | null;
  dps_savings_account_id: string | null;
  dps_initial_balance?: number;
  position?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  saving_amount?: number;
  donation_amount?: number;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  to_account_id?: string;
  transaction_id?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  currency?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  spent: number;
  createdAt: Date;
}

export interface CurrencyDashboardStats {
  currency: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  mrr: number;
}

export interface DashboardStats {
  byCurrency: CurrencyDashboardStats[];
  accountsCount: number;
  transactionsCount: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  source_account_id: string;
  savings_account_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

// Purchase Management Types
export interface Purchase {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  price: number;
  purchase_date: string;
  status: 'planned' | 'purchased' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseCategory {
  id: string;
  user_id: string;
  category_name: string;
  description?: string;
  monthly_budget: number;
  category_color: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseAnalytics {
  total_spent: number;
  monthly_spent: number;
  planned_count: number;
  purchased_count: number;
  cancelled_count: number;
  top_category?: string;
  category_breakdown: Array<{
    category: string;
    total_spent: number;
    item_count: number;
    percentage: number;
  }>;
}

export interface User {
  id: string;
  fullName?: string;
  email?: string;
  profilePicture?: string;
  local_currency?: string;
  subscription?: 'free' | 'premium';
}

// Lend & Borrow Types
export interface LendBorrow {
  id: string;
  user_id: string;
  type: 'lend' | 'borrow';
  person_name: string;
  amount: number;
  currency: string;
  due_date?: string;
  status: 'active' | 'settled' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Partial return fields (kept for backward compatibility)
  partial_return_amount?: number;
  partial_return_date?: string;
}

export interface LendBorrowInput {
  id?: string;
  user_id?: string;
  type: 'lend' | 'borrow' | '';
  person_name: string;
  amount?: number;
  currency: string | '';
  due_date?: string;
  status?: 'active' | 'settled' | 'overdue';
  notes?: string;
  partial_return_amount?: number;
  partial_return_date?: string;
}

// New type for individual partial returns
export interface LendBorrowReturn {
  id: string;
  lend_borrow_id: string;
  amount: number;
  return_date: string;
  created_at: string;
}

// Keep the old PartialReturn type for backward compatibility
export interface PartialReturn {
  id: string;
  lend_borrow_id: string;
  amount: number;
  return_date: string;
  created_at: string;
}

export interface LendBorrowAnalytics {
  total_lent: number;
  total_borrowed: number;
  outstanding_lent: number;
  outstanding_borrowed: number;
  overdue_count: number;
  active_count: number;
  settled_count: number;
  top_person?: string;
  currency_breakdown: Array<{
    currency: string;
    total_lent: number;
    total_borrowed: number;
    outstanding_lent: number;
    outstanding_borrowed: number;
  }>;
  // Partial return analytics
  partial_return_stats?: {
    total_partial_returns: number;
    total_partial_return_amount: number;
    average_partial_return_amount: number;
  };
}

// Donation & Savings Types - Updated
export interface DonationSavingRecord {
  id: string;
  user_id: string;
  transaction_id: string | null; // Can be null for manual donations
  custom_transaction_id?: string; // For manual donations without linked transactions
  type: 'saving' | 'donation';
  amount: number;
  mode: 'fixed' | 'percent';
  mode_value?: number;
  note?: string;
  created_at: string;
  updated_at?: string;
  status: 'pending' | 'donated';
}

export interface DonationSavingAnalytics {
  total_saved: number;
  total_donated: number;
  top_month?: string;
  monthly_breakdown: Array<{
    month: string;
    saved: number;
    donated: number;
    total: number;
  }>;
  type_breakdown: Array<{
    type: 'saving' | 'donation';
    total: number;
    count: number;
    percentage: number;
  }>;
  mode_breakdown: Array<{
    mode: 'fixed' | 'percent';
    total: number;
    count: number;
    percentage: number;
  }>;
}

// Payment History Types
export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  plan_id: string;
  amount: number;
  currency: string;
  payment_provider: 'stripe' | 'paypal';
  provider_transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method?: string;
  billing_cycle: 'monthly' | 'one-time';
  transaction_type: 'payment' | 'refund' | 'chargeback';
  metadata?: any;
  created_at: string;
  updated_at?: string;
  plan_name?: string;
}

export interface PaymentHistoryFilters {
  searchTerm: string;
  statusFilter: string;
  dateFilter: string;
}

export interface PaymentHistoryStats {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
}